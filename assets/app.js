import { drawPseudoQR } from "./qr-lite.js";

const CFG = window.DLCARD_CONFIG;
const API = CFG.API_BASE;
const PATHS = CFG.PATHS;

const $app = document.getElementById("app");

function esc(s){ return (s ?? "").toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function toast(title, msg){
  let wrap = qs(".toastWrap");
  if (!wrap){
    wrap = document.createElement("div");
    wrap.className = "toastWrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<b>${esc(title)}</b><div class="muted" style="margin-top:4px;line-height:1.6">${esc(msg)}</div>`;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity="0"; t.style.transform="translateY(6px)"; }, 2800);
  setTimeout(()=>{ t.remove(); }, 3400);
}

async function apiFetch(path, opt={}){
  const url = API + path;
  const res = await fetch(url, {
    ...opt,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opt.headers || {})
    }
  });
  const ct = res.headers.get("content-type") || "";
  let data = null;
  if (ct.includes("application/json")){
    data = await res.json().catch(()=>null);
  }else{
    data = await res.text().catch(()=>null);
  }
  if (!res.ok){
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function go(hash){ location.hash = hash; }

let state = {
  me: null,
  malls: [],
  products: [],
  promotions: [],
  adminKey: localStorage.getItem("dlcard_admin_key") || ""
};

async function loadMe(){
  try{
    state.me = await apiFetch(PATHS.me);
    return state.me;
  }catch(e){
    if (e.status === 401) state.me = null;
    else toast("連線失敗", (e.data?.detail || e.message || "未知錯誤"));
    return null;
  }
}

async function logout(){
  try{ await apiFetch(PATHS.logout, { method:"POST", body: JSON.stringify({}) }); }catch(e){}
  state.me = null;
  toast("已登出", "登入狀態已清除。");
  go("#/");
}

function topbar(){
  const me = state.me;
  const loggedIn = !!me;
  const nick = me?.nickname || me?.name || me?.email || "會員";

  return `
    <div class="topbar">
      <div class="topbarIn">
        <a class="brand" href="#/">
          <div class="logoMark"></div>
          <div>
            <b>DLCard</b>
            <span>夢光創意｜會員與點數系統</span>
          </div>
        </a>

        <div class="navRow">
          <a class="navBtn" href="#/shop">商城</a>
          <a class="navBtn" href="#/wallet">錢包</a>
          <a class="navBtn" href="#/orders">訂單</a>
          <a class="navBtn" href="#/profile">會員</a>
          <a class="navBtn" href="#/admin">後台</a>
          ${loggedIn ? `<button class="navBtn" id="btnLogout">登出</button>` : `<a class="navBtn primary" href="#/">登入</a>`}
        </div>
      </div>
    </div>
    <div class="container">
      <div class="row" style="justify-content:space-between;margin:8px 0 0">
        <div class="row" style="gap:8px">
          <span class="pill ${loggedIn ? "ok": "warn"}">${loggedIn ? "已登入" : "未登入"}</span>
          ${loggedIn ? `<span class="pill">你好，${esc(nick)}</span>` : ""}
        </div>
        <div class="row" style="gap:8px">
          <span class="pill">API：<span class="mono">${esc(API)}</span></span>
        </div>
      </div>
    </div>
  `;
}

function requireLogin(nextHash){
  toast("需要登入", "請先使用 Google 登入。");
  go("#/");
  if (nextHash) sessionStorage.setItem("dlcard_next", nextHash);
}

function pageShell(innerHtml){
  $app.innerHTML = topbar() + `<div class="container">${innerHtml}</div>`;
  const btn = qs("#btnLogout");
  if (btn) btn.addEventListener("click", logout);
}

/* ------------------------- Pages ------------------------- */
function pageHome(){
  const me = state.me;
  const next = sessionStorage.getItem("dlcard_next");
  if (me){
    if (me.status === "PENDING" || me.member_status === "PENDING"){
      go("#/bind-phone");
      return;
    }
    go(next || "#/dashboard");
    sessionStorage.removeItem("dlcard_next");
    return;
  }

  pageShell(`
    <div class="hero">
      <h1>DLCard｜會員卡・點數・多商城</h1>
      <p>此頁為 GitHub Pages 前端（純靜態）。登入、Session、Cookie 皆由後端處理。</p>
      <div class="row" style="margin-top:14px">
        <a class="btn primary" href="${API + PATHS.googleLogin}">使用 Google 登入</a>
        <button class="btn" id="btnHealth">測試後端連線</button>
      </div>
      <div class="hr"></div>
      <div class="kv">
        <div class="k">登入方式</div><div class="v">Google OAuth（後端設 HttpOnly Cookie）</div>
        <div class="k">部署</div><div class="v">前端 GitHub Pages｜後端 自架 + Nginx 反代</div>
        <div class="k">提示</div><div class="v">若你剛登入完成但頁面沒跳轉，請重新整理一次。</div>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="card">
      <div class="cardHead">
        <b>連線狀態</b>
        <span class="muted small">GET ${esc(PATHS.health)}</span>
      </div>
      <div class="cardBody">
        <pre id="healthPre" class="mono" style="margin:0;white-space:pre-wrap">（尚未測試）</pre>
      </div>
    </div>
  `);

  qs("#btnHealth")?.addEventListener("click", async ()=>{
    const pre = qs("#healthPre");
    pre.textContent = "Loading...";
    try{
      const d = await apiFetch(PATHS.health);
      pre.textContent = JSON.stringify(d, null, 2);
      toast("OK", "後端可用。");
    }catch(e){
      pre.textContent = "Error: " + (e.data?.detail || e.message);
      toast("錯誤", "後端連線失敗（可能是 CORS 或路徑）。");
    }
  });
}

function pageBindPhone(){
  if (!state.me) return requireLogin("#/bind-phone");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>首次登入｜手機綁定</b>
        <span class="muted small">狀態：PENDING → ACTIVE</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="kv">
                <div class="k">Google Email</div><div class="v">${esc(state.me.email || "-")}</div>
                <div class="k">會員狀態</div><div class="v"><span class="pill warn">PENDING</span></div>
                <div class="k">說明</div><div class="v">此版本「不做簡訊驗證」，只做手機唯一性。完成後會發卡（card_id）。</div>
              </div>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="field">
                <div class="label">手機號碼（僅限一次註冊）</div>
                <input class="input" id="phone" placeholder="例如：0912345678" inputmode="tel" />
              </div>
              <div style="height:10px"></div>
              <button class="btn primary wide" id="btnBind">完成綁定</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                若後端端點不是 <span class="mono">${esc(PATHS.bindPhone)}</span>，請至 <span class="mono">assets/config.js</span> 調整 PATHS。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  qs("#btnBind")?.addEventListener("click", async ()=>{
    const phone = qs("#phone")?.value?.trim();
    if (!phone) return toast("請輸入手機", "手機號碼不可為空。");
    try{
      await apiFetch(PATHS.bindPhone, { method:"POST", body: JSON.stringify({ phone }) });
      toast("完成", "手機已綁定，正在更新會員狀態…");
      await loadMe();
      go("#/dashboard");
    }catch(e){
      toast("失敗", e.data?.detail || e.message || "綁定失敗");
    }
  });
}

function pageDashboard(){
  if (!state.me) return requireLogin("#/dashboard");

  const me = state.me;
  const cardId = me.card_id || me.cardId || "(後端未回傳)";
  const level = me.level || me.member_level || "—";
  const points = (me.points ?? me.balance ?? "—");
  const name = me.nickname || me.name || me.email || "會員";

  pageShell(`
    <div class="hero">
      <h1>會員卡</h1>
      <p>PC：尊榮展示｜手機：出示會員/QR 為核心（此版先做通用 UI）。</p>
      <div class="row" style="margin-top:12px">
        <a class="btn" href="#/wallet">查看錢包</a>
        <a class="btn" href="#/shop">前往商城</a>
        <button class="btn primary" id="btnRefresh">刷新資料</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="grid">
      <div class="card">
        <div class="cardHead">
          <b>尊榮會員卡</b>
          <span class="muted small">card_id 不公開（前端只展示）</span>
        </div>
        <div class="cardBody">
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="spread">
                <div>
                  <div style="font-size:12px;color:var(--muted)">持卡人</div>
                  <div style="font-size:18px;font-weight:750;margin-top:2px">${esc(name)}</div>
                </div>
                <span class="pill ok">ACTIVE</span>
              </div>
              <div class="hr"></div>
              <div class="kv">
                <div class="k">會員等級</div><div class="v">${esc(level)}</div>
                <div class="k">點數餘額</div><div class="v"><span class="hl">${esc(points)}</span></div>
                <div class="k">Card ID</div><div class="v"><span class="mono">${esc(cardId)}</span></div>
              </div>
            </div>
          </div>
          <div class="muted small" style="margin-top:10px">建議：card_id 不要直接暴露在 QR，QR 應使用短時效 token。</div>
        </div>
      </div>

      <div class="card">
        <div class="cardHead">
          <b>出示 QR（動態 Token）</b>
          <span class="muted small">短時效 / 可掃碼後作廢</span>
        </div>
        <div class="cardBody">
          <div class="qrBox">
            <div class="qr"><canvas id="qrCanvas"></canvas></div>
            <div>
              <div class="kv">
                <div class="k">qr_token</div><div class="v mono" id="tokenText">（尚未取得）</div>
                <div class="k">有效性</div><div class="v muted">由後端決定（例如 30～60 秒）。</div>
              </div>
              <div style="height:10px"></div>
              <button class="btn primary wide" id="btnToken">重新生成 Token</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                目前使用「視覺化 pseudo-QR」先把流程跑通。要換成真正 QR lib 我可以再幫你替換。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  async function refreshToken(){
    const canvas = qs("#qrCanvas");
    const tokenEl = qs("#tokenText");
    tokenEl.textContent = "Loading...";
    try{
      const data = await apiFetch(PATHS.qrToken);
      const token = data.qr_token || data.token || data.qrToken || JSON.stringify(data);
      tokenEl.textContent = token;
      drawPseudoQR(canvas, String(token));
      toast("已更新", "QR Token 已刷新。");
    }catch(e){
      tokenEl.textContent = "Error: " + (e.data?.detail || e.message);
      drawPseudoQR(canvas, "ERROR");
      toast("失敗", "取得 QR Token 失敗（請確認後端端點）。");
    }
  }

  qs("#btnToken")?.addEventListener("click", refreshToken);
  qs("#btnRefresh")?.addEventListener("click", async ()=>{
    await loadMe();
    toast("已刷新", "會員資料已更新。");
    go("#/dashboard");
  });

  refreshToken();
}

function pageWallet(){
  if (!state.me) return requireLogin("#/wallet");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>點數錢包</b>
        <span class="muted small">Wallet / Ledger</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="spread">
                <div>
                  <div class="muted small">目前餘額</div>
                  <div style="font-size:26px;font-weight:800;margin-top:4px" id="bal">—</div>
                </div>
                <div class="row">
                  <a class="btn" href="#/topup">儲值</a>
                  <button class="btn primary" id="btnReload">重新載入</button>
                </div>
              </div>
              <div class="hr"></div>
              <div class="kv">
                <div class="k">提示</div><div class="v">前端不可信：價格、折扣、扣點都必須由後端計算。</div>
              </div>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="field">
                <div class="label">流水篩選（示意）</div>
                <select id="flt">
                  <option value="">全部</option>
                  <option value="TOPUP">儲值</option>
                  <option value="SPEND">消費</option>
                  <option value="ADJUST">手動調整</option>
                </select>
              </div>
              <div style="height:10px"></div>
              <button class="btn wide" id="btnFilter">套用篩選</button>
            </div>
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="card" style="background: rgba(7,10,18,.22)">
          <div class="cardHead">
            <b>點數流水</b>
            <span class="muted small">GET ${esc(PATHS.ledger)}</span>
          </div>
          <div class="cardBody">
            <table class="table" id="ledgerTbl">
              <thead>
                <tr><th>時間</th><th>類型</th><th>變動</th><th>備註</th></tr>
              </thead>
              <tbody><tr><td colspan="4" class="muted">載入中…</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `);

  async function loadAll(){
    try{
      const w = await apiFetch(PATHS.wallet);
      const bal = w.balance ?? w.points ?? w.amount ?? "—";
      qs("#bal").textContent = bal;
    }catch(e){
      qs("#bal").textContent = "—";
      toast("錢包讀取失敗", e.data?.detail || e.message);
    }

    try{
      const rows = await apiFetch(PATHS.ledger);
      renderLedger(Array.isArray(rows) ? rows : (rows.items || []));
    }catch(e){
      renderLedger([]);
      toast("流水讀取失敗", e.data?.detail || e.message);
    }
  }

  function renderLedger(items){
    const tbody = qs("#ledgerTbl tbody");
    if (!items.length){
      tbody.innerHTML = `<tr><td colspan="4" class="muted">（目前沒有資料）</td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(it=>{
      const t = it.created_at || it.time || it.ts || "";
      const typ = it.type || it.kind || "";
      const delta = it.delta ?? it.amount ?? it.change ?? "";
      const note = it.note || it.reason || it.memo || "";
      const cls = (delta < 0) ? "bad" : "good";
      return `<tr>
        <td class="muted">${esc(t)}</td>
        <td>${esc(typ)}</td>
        <td class="${cls} mono">${esc(delta)}</td>
        <td class="muted">${esc(note)}</td>
      </tr>`;
    }).join("");
  }

  qs("#btnReload")?.addEventListener("click", loadAll);
  qs("#btnFilter")?.addEventListener("click", ()=>{
    toast("提示", "此版篩選為示意；要做真篩選需後端支援 query。");
  });

  loadAll();
}

function pageTopup(){
  if (!state.me) return requireLogin("#/topup");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>儲值（台幣 → 點數）</b>
        <span class="muted small">ECPay（由後端建單與回呼）</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="field">
                <div class="label">儲值方案（示例）</div>
                <select id="plan">
                  <option value="300">NT$300</option>
                  <option value="500">NT$500</option>
                  <option value="1000">NT$1000</option>
                  <option value="2000">NT$2000</option>
                </select>
              </div>
              <div style="height:10px"></div>
              <button class="btn primary wide" id="btnCreate">建立儲值單</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                若你目前 ECPay 尚未接好，後端可能回錯誤或示意資料。
              </div>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="kv">
                <div class="k">注意</div><div class="v">前端只送方案/金額，點數換算、加碼、手續費全由後端計算。</div>
                <div class="k">流程</div><div class="v">建單 → 付款 → 回呼 → 加點 → 寫流水。</div>
              </div>
            </div>
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="card" style="background: rgba(7,10,18,.22)">
          <div class="cardHead"><b>後端回應</b><span class="muted small">POST ${esc(PATHS.topupCreate)}</span></div>
          <div class="cardBody">
            <pre id="out" class="mono" style="margin:0;white-space:pre-wrap">（尚未建立）</pre>
            <div style="height:10px"></div>
            <div id="payArea"></div>
          </div>
        </div>
      </div>
    </div>
  `);

  qs("#btnCreate")?.addEventListener("click", async ()=>{
    const amount = Number(qs("#plan")?.value || 0);
    const out = qs("#out");
    const payArea = qs("#payArea");
    out.textContent = "Loading...";
    payArea.innerHTML = "";
    try{
      const data = await apiFetch(PATHS.topupCreate, {
        method:"POST",
        body: JSON.stringify({ amount })
      });
      out.textContent = JSON.stringify(data, null, 2);

      if (data?.html_form){
        payArea.innerHTML = data.html_form;
        toast("已建立儲值單", "請依後端回傳進行付款。");
      }else if (data?.pay_url){
        payArea.innerHTML = `<a class="btn primary" target="_blank" rel="noopener" href="${esc(data.pay_url)}">前往付款</a>`;
        toast("已建立儲值單", "已取得付款連結。");
      }else{
        payArea.innerHTML = `<div class="muted small">（後端未提供付款導向欄位；請依你的後端實作調整）</div>`;
      }
    }catch(e){
      out.textContent = "Error: " + (e.data?.detail || e.message);
      toast("建立失敗", e.data?.detail || e.message);
    }
  });
}

function pageShop(){
  pageShell(`
    <div class="hero">
      <h1>商城</h1>
      <p>支援多商城 / 分類 / 搜尋。商品、訂單、優惠、報表都以商城分流。</p>
      <div class="row" style="margin-top:12px">
        <select id="mallSel" class="input" style="min-width:240px"></select>
        <input id="q" class="input" placeholder="搜尋商品（名稱/標籤）" style="flex:1;min-width:220px" />
        <button class="btn primary" id="btnSearch">搜尋</button>
      </div>
    </div>

    <div style="height:14px"></div>

    <div class="card">
      <div class="cardHead">
        <b>商品列表</b>
        <span class="muted small">GET ${esc(PATHS.products)}</span>
      </div>
      <div class="cardBody">
        <div id="prodGrid" class="grid"></div>
      </div>
    </div>
  `);

  const mallSel = qs("#mallSel");
  const q = qs("#q");
  const prodGrid = qs("#prodGrid");

  function renderMalls(list){
    const opts = [`<option value="">全部商城</option>`].concat(list.map(m=>{
      const id = m.id ?? m.mall_id ?? m.code ?? "";
      const name = m.name ?? m.title ?? id;
      return `<option value="${esc(id)}">${esc(name)}</option>`;
    }));
    mallSel.innerHTML = opts.join("");
  }

  function renderProducts(items){
    if (!items.length){
      prodGrid.innerHTML = `<div class="muted">（目前沒有商品）</div>`;
      return;
    }
    prodGrid.innerHTML = items.map(p=>{
      const id = p.id ?? p.product_id ?? "";
      const name = p.name ?? p.title ?? "未命名商品";
      const price = p.price_points ?? p.price ?? p.points ?? "—";
      const mall = p.mall_id ?? p.mall ?? "";
      const stock = p.stock ?? p.inventory ?? null;
      const tag = p.tag || p.category || "";
      const badge = (stock === 0) ? `<span class="pill warn">缺貨</span>` : `<span class="pill ok">可購買</span>`;
      return `
        <div class="card" style="background: rgba(7,10,18,.28)">
          <div class="cardBody">
            <div class="spread">
              <div style="font-weight:750">${esc(name)}</div>
              ${badge}
            </div>
            <div class="muted small" style="margin-top:6px">商城：${esc(mall || "—")}　標籤：${esc(tag || "—")}</div>
            <div class="hr"></div>
            <div class="spread">
              <div><span class="muted small">點數價</span><div style="font-size:18px;font-weight:800" class="hl">${esc(price)}</div></div>
              <div class="row">
                <a class="btn" href="#/product?id=${encodeURIComponent(id)}">查看</a>
                <button class="btn primary" data-add="${esc(id)}">加入購物車</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    qsa("[data-add]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if (!state.me) return requireLogin("#/shop");
        const id = btn.getAttribute("data-add");
        cartAdd(id, 1);
        toast("已加入", "商品已加入購物車。");
      });
    });
  }

  async function loadMalls(){
    try{
      const ms = await apiFetch(PATHS.malls);
      state.malls = Array.isArray(ms) ? ms : (ms.items || []);
      renderMalls(state.malls);
    }catch(e){
      renderMalls([]);
      toast("商城讀取失敗", e.data?.detail || e.message);
    }
  }

  async function search(){
    const mall = mallSel.value;
    const keyword = q.value.trim();
    prodGrid.innerHTML = `<div class="muted">載入中…</div>`;
    try{
      const url = new URL(API + PATHS.products);
      if (mall) url.searchParams.set("mall_id", mall);
      if (keyword) url.searchParams.set("q", keyword);
      const res = await fetch(url.toString(), { credentials:"include" });
      if (!res.ok) throw Object.assign(new Error("HTTP "+res.status), { status:res.status, data: await res.text().catch(()=>null) });
      const data = await res.json().catch(()=>[]);
      const items = Array.isArray(data) ? data : (data.items || []);
      state.products = items;
      renderProducts(items);
    }catch(e){
      prodGrid.innerHTML = `<div class="muted">（讀取失敗，請確認後端 /products 支援 query 或回傳格式）</div>`;
      toast("商品讀取失敗", e.data?.detail || e.message || "可能是 CORS 或路徑");
    }
  }

  qs("#btnSearch")?.addEventListener("click", search);
  loadMalls().then(search);
}

function pageProduct(){
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id") || "";
  if (!id) return go("#/shop");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>商品內容</b>
        <a class="navBtn" href="#/shop">← 返回商城</a>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div class="muted small">商品圖（示意）</div>
              <div style="height:10px"></div>
              <div style="height:220px;border-radius:16px;border:1px solid rgba(38,50,95,.65);background:
                radial-gradient(800px 240px at 30% 20%, rgba(124,247,216,.16), transparent 55%),
                radial-gradient(700px 240px at 70% 0%, rgba(122,167,255,.18), transparent 60%),
                rgba(7,10,18,.25);
              "></div>
            </div>
          </div>
          <div class="card" style="background: rgba(7,10,18,.28)">
            <div class="cardBody">
              <div style="font-size:18px;font-weight:850" id="pName">載入中…</div>
              <div class="muted small" id="pMeta" style="margin-top:6px"></div>
              <div class="hr"></div>
              <div class="spread">
                <div>
                  <div class="muted small">點數價</div>
                  <div style="font-size:22px;font-weight:900" class="hl" id="pPrice">—</div>
                </div>
                <div class="row">
                  <input class="input" id="qty" type="number" min="1" value="1" style="width:90px" />
                  <button class="btn primary" id="btnAdd">加入購物車</button>
                </div>
              </div>
              <div class="hr"></div>
              <div class="muted small" id="pDesc" style="line-height:1.7"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  async function load(){
    try{
      const data = await apiFetch(PATHS.productById(id));
      const name = data.name ?? data.title ?? "未命名商品";
      const price = data.price_points ?? data.price ?? data.points ?? "—";
      const mall = data.mall_id ?? data.mall ?? "—";
      const tag = data.tag || data.category || "—";
      const stock = data.stock ?? data.inventory ?? "—";
      const desc = data.desc ?? data.description ?? "";

      qs("#pName").textContent = name;
      qs("#pPrice").textContent = price;
      qs("#pMeta").textContent = `商城：${mall}｜標籤：${tag}｜庫存：${stock}`;
      qs("#pDesc").textContent = desc || "（無商品介紹）";
    }catch(e){
      toast("讀取失敗", e.data?.detail || e.message);
      qs("#pName").textContent = "讀取失敗";
    }
  }

  qs("#btnAdd")?.addEventListener("click", ()=>{
    if (!state.me) return requireLogin(`#/product?id=${encodeURIComponent(id)}`);
    const qty = Math.max(1, Number(qs("#qty").value || 1));
    cartAdd(id, qty);
    toast("已加入", `已加入購物車 x${qty}`);
  });

  load();
}

function cartGet(){ try{ return JSON.parse(localStorage.getItem("dlcard_cart") || "[]"); }catch{ return []; } }
function cartSet(items){ localStorage.setItem("dlcard_cart", JSON.stringify(items)); }
function cartAdd(productId, qty){
  const cart = cartGet();
  const i = cart.findIndex(x=>x.productId===productId);
  if (i>=0) cart[i].qty += qty;
  else cart.push({ productId, qty });
  cartSet(cart);
}
function cartClear(){ cartSet([]); }

function pageCheckout(){
  if (!state.me) return requireLogin("#/checkout");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>結帳</b>
        <span class="muted small">前端只送商品ID/數量/寄送資料｜價格由後端計算</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardHead"><b>購物車</b><span class="muted small">localStorage</span></div>
            <div class="cardBody">
              <table class="table" id="cartTbl">
                <thead><tr><th>商品ID</th><th>數量</th><th></th></tr></thead>
                <tbody></tbody>
              </table>
              <div style="height:10px"></div>
              <button class="btn danger wide" id="btnClear">清空購物車</button>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardHead"><b>寄送資訊</b><span class="muted small">宅配 / 超商</span></div>
            <div class="cardBody">
              <div class="field">
                <div class="label">寄送方式</div>
                <select id="shipType">
                  <option value="HOME">宅配</option>
                  <option value="CVS">超商</option>
                </select>
              </div>
              <div style="height:10px"></div>
              <div class="field">
                <div class="label">收件人</div>
                <input class="input" id="recvName" placeholder="姓名" />
              </div>
              <div style="height:10px"></div>
              <div class="field">
                <div class="label">電話</div>
                <input class="input" id="recvPhone" placeholder="09xx..." inputmode="tel" />
              </div>
              <div style="height:10px"></div>
              <div class="field" id="addrField">
                <div class="label">地址</div>
                <input class="input" id="recvAddr" placeholder="縣市/路/號..." />
              </div>
              <div class="field" id="cvsField" style="display:none">
                <div class="label">超商門市資訊</div>
                <input class="input" id="cvsInfo" placeholder="店號/店名/地址..." />
              </div>
              <div style="height:12px"></div>
              <button class="btn primary wide" id="btnSubmit">送出訂單</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                POST ${esc(PATHS.orders)}<br/>
                若後端欄位命名不同（items/shipping），可在 app.js 內調整。
              </div>
            </div>
          </div>
        </div>

        <div style="height:12px"></div>
        <div class="card" style="background: rgba(7,10,18,.22)">
          <div class="cardHead"><b>後端回應</b><span class="muted small">—</span></div>
          <div class="cardBody">
            <pre id="resp" class="mono" style="margin:0;white-space:pre-wrap">（尚未送出）</pre>
          </div>
        </div>
      </div>
    </div>
  `);

  const cartTbl = qs("#cartTbl tbody");
  const resp = qs("#resp");
  const shipType = qs("#shipType");

  function renderCart(){
    const cart = cartGet();
    if (!cart.length){
      cartTbl.innerHTML = `<tr><td colspan="3" class="muted">（購物車是空的）</td></tr>`;
      return;
    }
    cartTbl.innerHTML = cart.map((it, idx)=>`
      <tr>
        <td class="mono">${esc(it.productId)}</td>
        <td class="mono">${esc(it.qty)}</td>
        <td><button class="btn" data-rm="${idx}">移除</button></td>
      </tr>
    `).join("");
    qsa("[data-rm]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const i = Number(btn.getAttribute("data-rm"));
        const cart = cartGet();
        cart.splice(i,1);
        cartSet(cart);
        renderCart();
      });
    });
  }

  function toggleShip(){
    const t = shipType.value;
    qs("#addrField").style.display = (t==="HOME") ? "" : "none";
    qs("#cvsField").style.display = (t==="CVS") ? "" : "none";
  }
  shipType.addEventListener("change", toggleShip);
  toggleShip();
  renderCart();

  qs("#btnClear").addEventListener("click", ()=>{
    cartClear(); renderCart();
    toast("已清空", "購物車已清空。");
  });

  qs("#btnSubmit").addEventListener("click", async ()=>{
    const cart = cartGet();
    if (!cart.length) return toast("購物車為空", "請先加入商品。");

    const payload = {
      items: cart.map(x=>({ product_id: x.productId, qty: x.qty })),
      shipping: {
        type: shipType.value,
        receiver_name: qs("#recvName").value.trim(),
        receiver_phone: qs("#recvPhone").value.trim(),
        address: qs("#recvAddr").value.trim(),
        cvs_info: qs("#cvsInfo").value.trim()
      }
    };

    resp.textContent = "Loading...";
    try{
      const data = await apiFetch(PATHS.orders, { method:"POST", body: JSON.stringify(payload) });
      resp.textContent = JSON.stringify(data, null, 2);
      toast("已送出", "訂單已建立。");
      cartClear();
      renderCart();
      go("#/orders");
    }catch(e){
      resp.textContent = "Error: " + (e.data?.detail || e.message);
      toast("送出失敗", e.data?.detail || e.message);
    }
  });
}

function pageOrders(){
  if (!state.me) return requireLogin("#/orders");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>訂單</b>
        <span class="muted small">GET ${esc(PATHS.orders)}</span>
      </div>
      <div class="cardBody">
        <div class="row" style="justify-content:space-between">
          <div class="muted small">提示：後端必須以 transaction 保證扣點與建單一致。</div>
          <a class="btn primary" href="#/checkout">前往結帳</a>
        </div>
        <div style="height:12px"></div>
        <table class="table" id="ordTbl">
          <thead>
            <tr><th>訂單號</th><th>商城</th><th>狀態</th><th>點數</th><th>時間</th><th></th></tr>
          </thead>
          <tbody><tr><td colspan="6" class="muted">載入中…</td></tr></tbody>
        </table>
      </div>
    </div>
  `);

  async function load(){
    const tbody = qs("#ordTbl tbody");
    try{
      const data = await apiFetch(PATHS.orders);
      const items = Array.isArray(data) ? data : (data.items || []);
      if (!items.length){
        tbody.innerHTML = `<tr><td colspan="6" class="muted">（目前沒有訂單）</td></tr>`;
        return;
      }
      tbody.innerHTML = items.map(o=>{
        const id = o.id ?? o.order_id ?? o.code ?? "";
        const mall = o.mall_id ?? o.mall ?? "—";
        const st = o.status ?? "—";
        const pts = o.total_points ?? o.points ?? "—";
        const t = o.created_at ?? o.time ?? "—";
        return `<tr>
          <td class="mono">${esc(id)}</td>
          <td>${esc(mall)}</td>
          <td>${esc(st)}</td>
          <td class="hl mono">${esc(pts)}</td>
          <td class="muted">${esc(t)}</td>
          <td><a class="btn" href="#/order?id=${encodeURIComponent(id)}">查看</a></td>
        </tr>`;
      }).join("");
    }catch(e){
      tbody.innerHTML = `<tr><td colspan="6" class="muted">讀取失敗：${esc(e.data?.detail || e.message)}</td></tr>`;
      toast("訂單讀取失敗", e.data?.detail || e.message);
    }
  }
  load();
}

function pageOrder(){
  if (!state.me) return requireLogin("#/orders");
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const id = params.get("id") || "";
  if (!id) return go("#/orders");

  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>訂單明細</b>
        <a class="navBtn" href="#/orders">← 返回訂單</a>
      </div>
      <div class="cardBody">
        <pre id="detail" class="mono" style="margin:0;white-space:pre-wrap">載入中…</pre>
      </div>
    </div>
  `);

  (async ()=>{
    try{
      const data = await apiFetch(PATHS.orderById(id));
      qs("#detail").textContent = JSON.stringify(data, null, 2);
    }catch(e){
      qs("#detail").textContent = "Error: " + (e.data?.detail || e.message);
      toast("讀取失敗", e.data?.detail || e.message);
    }
  })();
}

function pageProfile(){
  if (!state.me) return requireLogin("#/profile");

  const me = state.me;
  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>會員資料</b>
        <span class="muted small">Profile / Addresses（此版先做展示＋本地儲存）</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardHead"><b>基本資料</b><span class="muted small">GET ${esc(PATHS.me)}</span></div>
            <div class="cardBody">
              <div class="kv">
                <div class="k">Email</div><div class="v">${esc(me.email || "—")}</div>
                <div class="k">暱稱</div><div class="v">${esc(me.nickname || me.name || "—")}</div>
                <div class="k">手機</div><div class="v">${esc(me.phone || "—")}</div>
                <div class="k">狀態</div><div class="v">${esc(me.status || me.member_status || "—")}</div>
              </div>
              <div style="height:10px"></div>
              <button class="btn primary wide" id="btnReload">重新載入</button>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardHead"><b>常用收件資料</b><span class="muted small">localStorage（可改成後端）</span></div>
            <div class="cardBody">
              <div class="field">
                <div class="label">收件人</div>
                <input class="input" id="aName" placeholder="姓名" />
              </div>
              <div style="height:10px"></div>
              <div class="field">
                <div class="label">電話</div>
                <input class="input" id="aPhone" placeholder="09xx..." />
              </div>
              <div style="height:10px"></div>
              <div class="field">
                <div class="label">地址</div>
                <input class="input" id="aAddr" placeholder="縣市/路/號..." />
              </div>
              <div style="height:12px"></div>
              <button class="btn primary wide" id="btnSave">儲存</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                之後要改成後端：新增 /addresses API（新增/刪除/預設）即可。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  function loadAddr(){
    let a = {};
    try{ a = JSON.parse(localStorage.getItem("dlcard_addr")||"{}"); }catch{}
    qs("#aName").value = a.name || "";
    qs("#aPhone").value = a.phone || "";
    qs("#aAddr").value = a.addr || "";
  }
  loadAddr();

  qs("#btnSave").addEventListener("click", ()=>{
    const a = { name: qs("#aName").value.trim(), phone: qs("#aPhone").value.trim(), addr: qs("#aAddr").value.trim() };
    localStorage.setItem("dlcard_addr", JSON.stringify(a));
    toast("已儲存", "常用收件資料已儲存。");
  });

  qs("#btnReload").addEventListener("click", async ()=>{
    await loadMe();
    toast("已更新", "會員資料已刷新。");
    go("#/profile");
  });
}

function adminHeader(){ return state.adminKey ? { "X-Admin-Api-Key": state.adminKey } : {}; }
async function adminFetch(path, opt={}){
  return apiFetch(path, { ...opt, headers: { ...(opt.headers||{}), ...adminHeader() } });
}

function pageAdmin(){
  pageShell(`
    <div class="card">
      <div class="cardHead">
        <b>Admin 後台</b>
        <span class="muted small">需要 Admin API Key</span>
      </div>
      <div class="cardBody">
        <div class="grid">
          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardBody">
              <div class="field">
                <div class="label">Admin API Key</div>
                <input class="input mono" id="adminKey" placeholder="貼上 ADMIN_API_KEY" />
              </div>
              <div style="height:10px"></div>
              <button class="btn primary wide" id="btnSaveKey">儲存 Key</button>
              <div class="muted small" style="margin-top:10px;line-height:1.7">
                Key 會存入 localStorage（只建議用於你自己的管理端裝置）。
              </div>
            </div>
          </div>

          <div class="card" style="background: rgba(7,10,18,.22)">
            <div class="cardBody">
              <div class="row">
                <a class="btn" href="#/admin/members">會員</a>
                <a class="btn" href="#/admin/malls">商城</a>
                <a class="btn" href="#/admin/products">商品</a>
                <a class="btn" href="#/admin/orders">訂單</a>
                <a class="btn" href="#/admin/promotions">優惠</a>
                <a class="btn" href="#/admin/topups">儲值</a>
              </div>
              <div class="hr"></div>
              <button class="btn wide" id="btnTest">測試 Admin 權限</button>
              <pre id="adminOut" class="mono" style="margin:10px 0 0;white-space:pre-wrap">（尚未測試）</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const input = qs("#adminKey");
  input.value = state.adminKey || "";

  qs("#btnSaveKey").addEventListener("click", ()=>{
    state.adminKey = input.value.trim();
    localStorage.setItem("dlcard_admin_key", state.adminKey);
    toast("已儲存", "Admin API Key 已保存。");
  });

  qs("#btnTest").addEventListener("click", async ()=>{
    const out = qs("#adminOut");
    out.textContent = "Loading...";
    try{
      const data = await adminFetch(PATHS.adminMembers);
      out.textContent = JSON.stringify(data, null, 2);
      toast("OK", "Admin Key 有效。");
    }catch(e){
      out.textContent = "Error: " + (e.data?.detail || e.message);
      toast("失敗", "Admin Key 無效或後端未開啟此端點。");
    }
  });
}

function adminListShell(title, path){
  return `
    <div class="card">
      <div class="cardHead">
        <b>${esc(title)}</b>
        <span class="muted small">GET ${esc(path)}（需要 X-Admin-Api-Key）</span>
      </div>
      <div class="cardBody">
        <div class="row" style="justify-content:space-between">
          <div class="muted small">此版先做「列表展示 + JSON 輸出」，後續再把 CRUD 表單補齊。</div>
          <button class="btn primary" id="btnLoad">載入</button>
        </div>
        <div style="height:12px"></div>
        <pre id="out" class="mono" style="margin:0;white-space:pre-wrap">（尚未載入）</pre>
      </div>
    </div>
  `;
}

function pageAdminList(title, path){
  pageShell(adminListShell(title, path));
  const btn = qs("#btnLoad");
  const out = qs("#out");
  btn.addEventListener("click", async ()=>{
    out.textContent = "Loading...";
    try{
      const data = await adminFetch(path);
      out.textContent = JSON.stringify(data, null, 2);
      toast("OK", "載入成功。");
    }catch(e){
      out.textContent = "Error: " + (e.data?.detail || e.message);
      toast("失敗", "請確認 Admin Key 與後端端點。");
    }
  });
}

function pageAdminMembers(){ pageAdminList("會員管理", PATHS.adminMembers); }
function pageAdminMalls(){ pageAdminList("商城管理", PATHS.adminMalls); }
function pageAdminProducts(){ pageAdminList("商品管理", PATHS.adminProducts); }
function pageAdminOrders(){ pageAdminList("訂單管理", PATHS.adminOrders); }
function pageAdminPromos(){ pageAdminList("優惠管理", PATHS.adminPromotions); }
function pageAdminTopups(){ pageAdminList("儲值管理", PATHS.adminTopups); }

/* ------------------------- Router ------------------------- */
const routes = {
  "#/": pageHome,
  "#/bind-phone": pageBindPhone,
  "#/dashboard": pageDashboard,
  "#/wallet": pageWallet,
  "#/topup": pageTopup,
  "#/shop": pageShop,
  "#/product": pageProduct,
  "#/checkout": pageCheckout,
  "#/orders": pageOrders,
  "#/order": pageOrder,
  "#/profile": pageProfile,
  "#/admin": pageAdmin,
  "#/admin/members": pageAdminMembers,
  "#/admin/malls": pageAdminMalls,
  "#/admin/products": pageAdminProducts,
  "#/admin/orders": pageAdminOrders,
  "#/admin/promotions": pageAdminPromos,
  "#/admin/topups": pageAdminTopups
};

async function render(){
  await loadMe();
  const hash = location.hash || "#/";
  const base = hash.split("?")[0];
  const fn = routes[base] || pageHome;
  fn();
}

window.addEventListener("hashchange", render);
render();
