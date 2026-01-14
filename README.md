# DLCard Frontend (GitHub Pages, no build)
本前端為 **純靜態**（HTML/CSS/JS），可直接部署到 GitHub Pages（例如 `/dlcard/`）。
- 後端：FastAPI（apidlcard.dreamlight.site）
- 登入：Google OAuth（由後端處理並設 HttpOnly Cookie）
- 前端：以 Hash Router（#/...）避免 GitHub Pages 404 問題

## 1) 設定
編輯 `assets/config.js`：
- `API_BASE`
- `APP_BASE`（你的 GitHub Pages 子路徑）

## 2) 部署
把整包檔案放到 GitHub repo 的 `/`（或 docs/），開啟 Pages 即可。

## 3) 常用路由
- `#/`：登入/首頁
- `#/bind-phone`：首次綁定手機（PENDING → ACTIVE）
- `#/dashboard`：會員卡/QR
- `#/wallet`：點數錢包/流水
- `#/topup`：儲值（ECPay）
- `#/shop`：商城
- `#/product?id=xxx`：商品頁
- `#/checkout`：結帳（送出訂單）
- `#/orders`：訂單
- `#/profile`：個資/地址
- `#/admin`：後台入口（需要 Admin API Key）

## 4) API 端點對應（可在 config.js 調整）
本前端預設使用：
- GET `/` 健檢
- GET `/auth/google`（導向登入）
- POST `/auth/logout`
- GET `/me`
- POST `/bind-phone`
- GET `/qr/token`
- GET `/wallet`
- GET `/ledger`
- GET `/malls`
- GET `/products`
- GET `/products/{id}`
- POST `/orders`
- GET `/orders`
- GET `/orders/{id}`
- POST `/topup/create`
- GET `/promotions/active`

若你後端路徑不同，請在 `assets/config.js` 內調整 `PATHS`。
