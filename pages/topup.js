window.PagesTopup = function(){
  const { esc, toast, openModal } = window.DL;
  const { mount } = window.VIEW;

  window.ROUTER.add('/topup', async()=>{
    let me=null; try{ me=await window.API.authMe(); }catch(e){}
    if(!me){ location.hash='#/'; return; }

    mount(`
      <section class="card">
        <div class="card__hd"><h2>儲值</h2><div class="hint">綠界只負責儲值 · 消費不走綠界</div></div>
        <div class="card__bd">
          <div class="grid">
            <div>
              <div class="field"><div class="label">儲值金額（TWD）</div><input class="input" id="amount" placeholder="例如：500" /></div>
              <div class="row">
                <button class="btn primary" id="createBtn">建立儲值單</button>
                <a class="btn" href="#/wallet">回錢包</a>
              </div>
              <div class="sep"></div>
              <p class="small">建立儲值單後，後端可能回傳：付款網址、或一段 HTML form（自動提交）。此頁兩種都支援。</p>
            </div>
            <div>
              <div class="card" style="box-shadow:none">
                <div class="card__hd"><h2>結果</h2><div class="hint">除錯用</div></div>
                <div class="card__bd">
                  <pre class="mono" id="out">（尚未建立）</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `);

    document.getElementById('createBtn').onclick = async()=>{
      const amount = Number((document.getElementById('amount').value||'').trim());
      if(!amount || amount<=0){ toast('金額不正確', '請輸入正整數'); return; }
      document.getElementById('out').textContent = '處理中…';
      try{
        const d = await window.API.request('/topup/create', { method:'POST', json:{ amount } });
        document.getElementById('out').textContent = JSON.stringify(d,null,2);

        // common patterns
        const payUrl = d.pay_url || d.payment_url || d.url || d.redirect_url;
        const html = d.html || d.form_html || d.form;

        if(payUrl){
          toast('前往付款', '即將導向金流頁面');
          setTimeout(()=>location.href = payUrl, 500);
          return;
        }
        if(html && typeof html === 'string' && html.includes('<form')){
          openModal('付款表單', `<div class="small">若沒有自動跳轉，請點下方「送出」</div><div class="sep"></div>${html}`, {
            actions:[{ label:'送出', variant:'primary', onClick:()=>{
              // inject and submit
              const host = document.createElement('div');
              host.innerHTML = html;
              document.body.appendChild(host);
              const f = host.querySelector('form');
              if(f) f.submit();
            }}]
          });
          return;
        }

        toast('建立成功', '已建立儲值單（請確認後端回傳格式）');
      }catch(e){
        document.getElementById('out').textContent = `錯誤：${e.message}\n\n` + (e.data?JSON.stringify(e.data,null,2):'');
        toast('失敗', e.message||'');
      }
    };
  });
}
