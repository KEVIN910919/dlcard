window.PagesHome = function(){
  const { esc } = window.DL;
  const { mount } = window.VIEW;

  window.ROUTER.add('/', async()=>{
    let me = null;
    try{ me = await window.API.authMe(); }catch(e){ me = null; }

    mount(`
      <section class="card">
        <div class="card__hd">
          <h2>首頁｜DLCard</h2>
          <div class="hint">Google 單一登入 · 手機綁定 · Cookie Session（72 小時）</div>
        </div>
        <div class="card__bd">
          <div class="grid">
            <div class="card" style="box-shadow:none">
              <div class="card__hd"><h2>快速狀態</h2><div class="hint">目前登入狀態</div></div>
              <div class="card__bd">
                ${me ? `
                  <div class="row">
                    <span class="pill ok">已登入</span>
                    <span class="pill">狀態：${esc(me.status||'')}</span>
                  </div>
                  <div class="kv"><b>暱稱</b><span>${esc(me.nickname||'')}</span></div>
                  <div class="kv"><b>Email</b><span>${esc(me.email||'')}</span></div>
                ` : `
                  <div class="row">
                    <span class="pill bad">未登入</span>
                    <span class="small">點右上角「Google 登入」開始</span>
                  </div>
                `}
                <div class="sep"></div>
                <div class="row">
                  <a class="btn" href="#/profile">會員頁</a>
                  <a class="btn" href="#/wallet">錢包</a>
                  <a class="btn" href="#/mall/${esc(window.DLCARD_CONFIG.DEFAULT_MALL_ID)}">商城</a>
                  <a class="btn" href="#/checkout">結帳</a>
                </div>
              </div>
            </div>

            <div class="card" style="box-shadow:none">
              <div class="card__hd"><h2>核心規則</h2><div class="hint">對應企劃定案</div></div>
              <div class="card__bd">
                <ul class="small" style="margin:0; padding-left:18px; line-height:1.8">
                  <li>綠界只做「儲值」，消費扣點由 DLCard 後端計算。</li>
                  <li>首次登入狀態為 <b>PENDING</b>，完成手機綁定後轉 <b class="good">ACTIVE</b>。</li>
                  <li>點數/折扣/扣點一律以後端計算為準，前端只送商品 ID/數量/寄送資料。</li>
                  <li>QR 顯示短時效 token，card_id 不公開。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="card" style="margin-top:12px">
        <div class="card__hd"><h2>手機版操作</h2><div class="hint">小螢幕會自動顯示底部導覽</div></div>
        <div class="card__bd">
          <div class="row">
            <span class="pill">底部導覽</span>
            <span class="pill">大按鈕「出示會員」</span>
            <span class="pill">全螢幕會員卡</span>
          </div>
          <p class="small">在會員頁可點「全螢幕出示」進入櫃台出示模式。</p>
        </div>
      </section>
    `);
  });
}
