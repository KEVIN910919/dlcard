window.PagesProfile = function(){
  const { $, esc, fmtDate, toast, openModal } = window.DL;
  const { mount } = window.VIEW;

  function renderCard(me, wallet){
    const balance = wallet?.balance ?? wallet?.data?.balance ?? wallet?.wallet?.balance;
    const cardId = me?.card_id ?? me?.cardId ?? '';
    return `
      <div class="memberCard">
        <div class="line">
          <div>
            <div class="name">${esc(me.nickname||me.email||'會員')}</div>
            <div class="id">card_id：${esc(cardId||'（未發卡）')}</div>
          </div>
          <div style="text-align:right">
            <div class="pill ok">${esc(me.status||'')}</div>
            <div class="id" style="margin-top:8px">更新：${esc(fmtDate(new Date()))}</div>
          </div>
        </div>
        <div class="sep"></div>
        <div class="line">
          <div>
            <div class="label">點數餘額</div>
            <div class="balance">${esc(balance ?? '—')}</div>
          </div>
          <div class="row" style="justify-content:flex-end">
            <button class="btn" id="refreshBtn">重新整理</button>
            <button class="btn primary" id="showBtn">出示會員（全螢幕）</button>
          </div>
        </div>
      </div>
    `;
  }

  window.ROUTER.add('/profile', async()=>{
    let me = null;
    try{ me = await window.API.authMe(); }catch(e){ me = null; }
    if(!me){ location.hash = '#/'; return; }
    if(String(me.status||'').toUpperCase()==='PENDING'){
      location.hash = '#/bind-phone';
      return;
    }

    let profile = null, wallet = null;
    try{ profile = await window.API.request('/user/profile'); }catch(e){}
    try{ wallet = await window.API.request('/wallet/ledger'); }catch(e){}

    mount(`
      <section class="card">
        <div class="card__hd"><h2>會員</h2><div class="hint">尊榮會員卡 · 動態 QR Token · 手機可全螢幕出示</div></div>
        <div class="card__bd">
          ${renderCard(profile?.user || me, wallet)}
          <div class="sep"></div>
          <div class="grid">
            <div class="card" style="box-shadow:none">
              <div class="card__hd"><h2>基本資料</h2><div class="hint">依後端回傳顯示</div></div>
              <div class="card__bd">
                <div class="kv"><b>Email</b><span>${esc((profile?.user||me).email||'')}</span></div>
                <div class="kv"><b>暱稱</b><span>${esc((profile?.user||me).nickname||'')}</span></div>
                <div class="kv"><b>手機</b><span>${esc((profile?.user||me).phone||'')}</span></div>
                <div class="kv"><b>狀態</b><span>${esc((profile?.user||me).status||'')}</span></div>
                <div class="sep"></div>
                <div class="row">
                  <a class="btn" href="#/wallet">查看點數流水</a>
                  <a class="btn" href="#/mall/${esc(window.DLCARD_CONFIG.DEFAULT_MALL_ID)}">前往商城</a>
                </div>
              </div>
            </div>

            <div class="card" style="box-shadow:none">
              <div class="card__hd"><h2>QR Token</h2><div class="hint">短時效亂數 · card_id 不公開</div></div>
              <div class="card__bd">
                <div class="row">
                  <button class="btn primary" id="genQrBtn">產生 QR Token</button>
                  <button class="btn" id="copyQrBtn" disabled>複製 Token</button>
                </div>
                <div class="sep"></div>
                <div class="qrBox" id="qrBox">
                  <div class="small">尚未產生 Token</div>
                </div>
                <div class="small" style="margin-top:10px">目前前端先顯示 token 文字。若你要真正 QR 圖，我也能幫你加上（用純 JS 產生 QR）。</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `);

    $('#refreshBtn').onclick = ()=> location.reload();

    let latestToken = '';
    $('#genQrBtn').onclick = async()=>{
      try{
        const d = await window.API.request('/user/qr-token', { method:'POST' });
        latestToken = d.qr_token || d.token || d.qrToken || '';
        const info = latestToken ? `<div class="mono">${esc(latestToken)}</div>` : `<div class="mono">${esc(JSON.stringify(d,null,2))}</div>`;
        $('#qrBox').innerHTML = info;
        $('#copyQrBtn').disabled = !latestToken;
        toast('已產生 Token', '可用於櫃台掃碼驗證');
      }catch(e){ toast('產生失敗', e.message||''); }
    };

    $('#copyQrBtn').onclick = async()=>{
      try{ await navigator.clipboard.writeText(latestToken); toast('已複製', 'Token 已複製到剪貼簿'); }catch(e){ toast('複製失敗', '瀏覽器不允許'); }
    };

    $('#showBtn').onclick = ()=>{
      const u = profile?.user || me;
      const balance = wallet?.balance ?? wallet?.wallet?.balance ?? '';
      openModal('全螢幕出示（櫃台模式）', `
        <div class="memberCard" style="transform:scale(1.02)">
          <div class="line">
            <div>
              <div class="name">${esc(u.nickname||u.email||'會員')}</div>
              <div class="id">狀態：${esc(u.status||'')}</div>
            </div>
            <div style="text-align:right">
              <div class="label">點數</div>
              <div class="balance" style="font-size:34px">${esc(balance||'—')}</div>
            </div>
          </div>
          <div class="sep"></div>
          <div class="qrBox">
            <div class="small">請先按「產生 QR Token」</div>
            <div class="mono" style="margin-top:10px">${esc(latestToken||'')}</div>
          </div>
        </div>
      `);
    };
  });
}
