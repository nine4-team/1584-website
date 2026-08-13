# 1584 Design Website

Static HTML site deployed to Cloudflare Pages at **1584design.com**.

## Cloudflare Account

1584 Design has its own Cloudflare account (separate from the Nine4 account). When deploying, use the Wrangler CLI and make sure you are authenticated under the **1584 Design Cloudflare account**, not Nine4.

The Cloudflare MCP server in this project is connected to the Nine4 account and cannot deploy here.

## Deployment

```bash
# From the website directory
wrangler pages deploy . --project-name=1584-website
```

## Pages Projects

| Project | Domain | Purpose |
|---|---|---|
| `1584-website` | 1584design.com | Main website |
| `1584-inventory` | inventory.1584design.com | Inventory app |
| `1584-budget-estimator` | toolkit.1584design.com | Budget estimator |
