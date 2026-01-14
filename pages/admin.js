window.PagesAdmin = function(){
  const { esc, toast } = window.DL;
  const { mount } = window.VIEW;

  function renderApiExplorer(){
    return `
      <div class="card" style="box-shadow:none">
        <div class="card__hd"><h2>Admin API Explorer</h2><div class="hint">不知道後端完整 admin 路由時，用這個直接呼叫</div></div>
        <div class="card__bd">
          <div class="row">
            <select id="method" class="input" style="width:140px">
              <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
            </select>
            <input id="path" class="input" placeholder="/admin/xxx" value="/admin/" />
            <button class="btn primary" id="sendBtn">送出</button>
          </div>
          <div class="field"><div class="label">JSON Body（GET 可留空）</div><textarea id="body" class="input" rows="6" placeholder='{"key":"value"}'></textarea></div>
          <div class="sep"></div>
          <pre class="mono" id="out">（尚未呼叫）</pre>
        </div>
      </div>
    `;
  }

  window.ROUTER.add('/admin', async()=>{
    let me=null; try{ me=await window.API.authMe(); }catch(e){}
    if(!me){ location.hash='#/'; return; }

    mount(`
      <section class="card">
        <div class="card__hd"><h2>後台（Admin）</h2><div class="hint">會員/點數/商城/訂單/優惠 · 依後端 /admin/* API</div></div>
        <div class="card__bd">
          <div class="row">
            <span class="pill">此頁提供「後台 API 測試器」與基本快捷操作</span>
          </div>
          <div class="sep"></div>
          <div class="grid">
            <div>
              <div class="card" style="box-shadow:none">
                <div class="card__hd"><h2>快捷</h2><div class="hint">常用查詢</div></div>
                <div class="card__bd">
                  <div class="row">
                    <button class="btn" data-q="/admin/users">會員</button>
                    <button class="btn" data-q="/admin/orders">訂單</button>
                    <button class="btn" data-q="/admin/malls">商城</button>
                    <button class="btn" data-q="/admin/products">商品</button>
                    <button class="btn" data-q="/admin/promotions">優惠</button>
                  </div>
                  <div class="sep"></div>
                  <pre class="mono" id="quickOut">（點按按鈕呼叫）</pre>
                  <div class="small">若後端路由名稱不同，請改用右側 Explorer 自訂呼叫。</div>
                </div>
              </div>
            </div>

            <div>
              ${renderApiExplorer()}
            </div>
          </div>
        </div>
      </section>
    `);

    document.querySelectorAll('[data-q]').forEach(btn=>{
      btn.addEventListener('click', async()=>{
        const p = btn.getAttribute('data-q');
        document.getElementById('quickOut').textContent = '處理中…';
        try{
          const d = await window.API.request(p);
          document.getElementById('quickOut').textContent = JSON.stringify(d,null,2);
        }catch(e){
          document.getElementById('quickOut').textContent = `錯誤：${e.message}`;
          toast('失敗', e.message||'');
        }
      });
    });

    document.getElementById('sendBtn').onclick = async()=>{
      const method = document.getElementById('method').value;
      const path = document.getElementById('path').value.trim();
      let bodyTxt = document.getElementById('body').value.trim();
      let json = null;
      if(bodyTxt){
        try{ json = JSON.parse(bodyTxt); }
        catch(e){ toast('JSON 格式錯誤', '請確認 body'); return; }
      }
      document.getElementById('out').textContent = '處理中…';
      try{
        const d = await window.API.request(path, { method, json: (method==='GET'||method==='DELETE')?null:json });
        document.getElementById('out').textContent = JSON.stringify(d,null,2);
      }catch(e){
        document.getElementById('out').textContent = `錯誤：${e.message}\n\n` + (e.data?JSON.stringify(e.data,null,2):'');
        toast('失敗', e.message||'');
      }
    };
  });
}
