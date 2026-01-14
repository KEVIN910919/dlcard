/**
 * ✅ 你只需要改這支
 * - API_BASE: 後端 API 網域（Nginx 反代）
 * - APP_BASE: GitHub Pages 子路徑（例如 /dlcard/）
 */
window.DLCARD_CONFIG = {
  API_BASE: "https://apidlcard.dreamlight.site",
  APP_BASE: "/dlcard/",
  /**
   * API paths mapping（若後端路徑不同，在這裡調整即可）
   */
  PATHS: {
    health: "/",
    googleLogin: "/auth/google",
    logout: "/auth/logout",
    me: "/me",
    bindPhone: "/bind-phone",
    qrToken: "/qr/token",
    wallet: "/wallet",
    ledger: "/ledger",
    malls: "/malls",
    products: "/products",
    orders: "/orders",
    orderById: (id) => `/orders/${encodeURIComponent(id)}`,
    productById: (id) => `/products/${encodeURIComponent(id)}`,
    topupCreate: "/topup/create",
    promotionsActive: "/promotions/active",

    // Admin (API key header required)
    adminMembers: "/admin/members",
    adminWalletAdjust: "/admin/wallet/adjust",
    adminMalls: "/admin/malls",
    adminProducts: "/admin/products",
    adminOrders: "/admin/orders",
    adminPromotions: "/admin/promotions",
    adminTopups: "/admin/topups",
    adminSessions: "/admin/sessions"
  }
};
