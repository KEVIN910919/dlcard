# DLCard Frontend (Vanilla SPA)

- Pure static files (GitHub Pages friendly)
- Hash router + GitHub Pages path fallback (404.html)
- Works with cookie-based session (credentials: include)

## Configure
Edit `assets/config.js`:
- `API_BASE`
- `FRONTEND_BASE`

## Deploy (GitHub Pages)
- Put all files at repository root (or /docs) and enable Pages.
- Ensure `404.html` is deployed (needed for /bind-phone style paths).

## Routes
- `/` or `#/`
- `/bind-phone` or `#/bind-phone`
- `/profile` or `#/profile`
- `/wallet` or `#/wallet`
- `/mall/:mallId` or `#/mall/:mallId`
- `/checkout` or `#/checkout`
- `/topup` or `#/topup`
- `/admin` or `#/admin`

