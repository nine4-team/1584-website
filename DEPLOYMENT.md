# Website deployment

Cloudflare Pages automatically deploys `main` after a push. That Git-backed
deployment is the normal production path.

For a manual Cloudflare Pages deployment, always run:

```bash
./deploy.sh
```

Do not run `wrangler pages deploy .` from this directory. Deploying the working
directory can publish untracked files that disappear during the next Git-backed
deployment.

`deploy.sh` prevents that failure mode by:

- requiring the checked-out branch to be `main`;
- fetching `origin/main` and requiring local `HEAD` to match it exactly;
- building the upload from `git archive HEAD`, so modified and untracked local
  files cannot enter production;
- attaching the deployed Git commit to the Cloudflare deployment.

Run `./deploy.sh --check` to validate and assemble the committed snapshot
without deploying it.

