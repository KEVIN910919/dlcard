window.PagesWallet = function(){
  const { esc, fmtDate, toast } = window.DL;
  const { mount } = window.VIEW;

  function normalizeLedger(d){
    if(!d) return { balance:null, items:[] };
    if(Array.isArray(d)) return { balance:null, items:d };
    const items = d.items || d.ledger || d.data || d.rows || [];
    const balance = d.balance ?? d.wallet?.balance ?? d.data?.balance;
    return { balance, items: Array.isArray(items)?items:[] };
  }

  window.ROUTER.add('/wallet', async()=>{
    let me=null; try{ me=await window.API.authMe(); }catch(e){}
    if(!me){ location.hash='#/'; return; }

    let data=null;
    try{ data = await window.API.request('/wallet/ledger'); }
    catch(e){ toast('讀取失敗', e.message||''); data=null; }

    const { balance, items } = normalizeLedger(data);

    const rows = items.slice(0,200).map(x=>{
      const t = x.created_at || x.createdAt || x.time || x.ts || '';
      const amt = x.amount ?? x.delta ?? x.points ?? '';
      const reason = x.reason || x.memo || x.note || x.type || '';
      return `
        <div class="card" style="box-shadow:none; margin-bottom:10px">
          <div class="card__bd">
            <div class="row" style="justify-content:space-between">
              <b>${esc(String(amt))}</b>
              <span class="small">${esc(fmtDate(t))}</span>
            </div>
            <div class="small">${esc(reason)}</div>
          </div>
        </div>
      `;
    }).join('') || `<div class="small">尚無流水資料，或後端回傳格式不同（此頁會把 JSON 原樣顯示在底部）。</div>`;

    mount(`
      <section class="card">
        <div class="card__hd"><h2>錢包</h2><div class="hint">點數餘額與流水（Ledger）</div></div>
        <div class="card__bd">
          <div class="row">
            <span class="pill">餘額：<b style="margin-left:6px">${esc(balance ?? '—')}</b></span>
            <a class="btn" href="#/topup">去儲值</a>
          </div>
          <div class="sep"></div>
          ${rows}
          <div class="sep"></div>
          <details>
            <summary class="small">查看原始 JSON（除錯用）</summary>
            <pre class="mono">${esc(JSON.stringify(data,null,2))}</pre>
          </details>
        </div>
      </section>
    `);
  });
}
