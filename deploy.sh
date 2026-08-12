#!/usr/bin/env bash
# Safely deploy the committed website snapshot to Cloudflare Pages.
# Never deploy this working directory directly: it may contain untracked pages.
set -euo pipefail

readonly ACCOUNT_ID="1d40522ab3420773595e47549fea8e2b"
readonly PROJECT_NAME="1584-website"
readonly PRODUCTION_BRANCH="main"

usage() {
  echo "usage: ./deploy.sh [--check]" >&2
}

if [ "$#" -gt 1 ]; then
  usage
  exit 2
fi

check_only=false
if [ "$#" -eq 1 ]; then
  if [ "$1" != "--check" ]; then
    usage
    exit 2
  fi
  check_only=true
fi

for command_name in git tar mktemp npx; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "error: required command not found: $command_name" >&2
    exit 1
  fi
done

site_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$site_dir"

if [ "$(git rev-parse --show-toplevel)" != "$site_dir" ]; then
  echo "error: deploy.sh must run from the website Git repository" >&2
  exit 1
fi

current_branch="$(git branch --show-current)"
if [ "$current_branch" != "$PRODUCTION_BRANCH" ]; then
  echo "error: production deployments must run from branch '$PRODUCTION_BRANCH' (currently '$current_branch')" >&2
  exit 1
fi

echo "Checking origin/$PRODUCTION_BRANCH..."
git fetch --quiet origin "$PRODUCTION_BRANCH"

local_commit="$(git rev-parse HEAD)"
remote_commit="$(git rev-parse "origin/$PRODUCTION_BRANCH")"
if [ "$local_commit" != "$remote_commit" ]; then
  echo "error: local HEAD does not match origin/$PRODUCTION_BRANCH" >&2
  echo "       local:  $local_commit" >&2
  echo "       remote: $remote_commit" >&2
  echo "Commit and push the intended website state before deploying." >&2
  exit 1
fi

change_count="$(git status --porcelain | wc -l | tr -d ' ')"
if [ "$change_count" != "0" ]; then
  echo "Note: $change_count local working-tree change(s) will be excluded."
fi

deploy_dir="$(mktemp -d "${TMPDIR:-/tmp}/1584-website-deploy.XXXXXX")"
cleanup() {
  case "$deploy_dir" in
    "${TMPDIR:-/tmp}"/1584-website-deploy.*) /usr/bin/find "$deploy_dir" -depth -delete ;;
    *) echo "warning: refused to clean unexpected temporary path: $deploy_dir" >&2 ;;
  esac
}
trap cleanup EXIT

# Upload only files stored in Git at HEAD. Exclude deployment-only repository
# files so they are not exposed as static website assets.
git archive --format=tar "$local_commit" -- . \
  ':(exclude).gitignore' \
  ':(exclude)DEPLOYMENT.md' \
  ':(exclude)deploy.sh' \
  | tar -xf - -C "$deploy_dir"

snapshot_files="$(/usr/bin/find "$deploy_dir" -type f | wc -l | tr -d ' ')"
short_commit="$(git rev-parse --short HEAD)"
echo "Prepared $snapshot_files committed files from $short_commit."

if [ "$check_only" = true ]; then
  echo "Check passed; no deployment was created."
  exit 0
fi

export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
commit_message="$(git log -1 --pretty=%s)"

npx --yes wrangler pages deploy "$deploy_dir" \
  --project-name="$PROJECT_NAME" \
  --branch="$PRODUCTION_BRANCH" \
  --commit-hash="$local_commit" \
  --commit-message="$commit_message" \
  --commit-dirty=false

echo "Deployed committed snapshot $short_commit to $PROJECT_NAME."
