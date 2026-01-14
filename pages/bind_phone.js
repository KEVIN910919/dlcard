window.PagesBindPhone = function(){
  const { $, esc, toast } = window.DL;
  const { mount } = window.VIEW;

  window.ROUTER.add('/bind-phone', async()=>{
    let me = null;
    try{ me = await window.API.authMe(); }catch(e){ me = null; }
    if(!me){ location.hash = '#/'; return; }

    mount(`
      <section class="card">
        <div class="card__hd"><h2>手機綁定</h2><div class="hint">首次登入必填 · 不做簡訊驗證 · 只檢查唯一性</div></div>
        <div class="card__bd">
          <div class="grid">
            <div>
              <div class="field"><div class="label">手機號碼</div><input id="phone" class="input" placeholder="例如：0912345678" /></div>
              <div class="row">
                <button class="btn primary" id="bindBtn">綁定並發卡</button>
                <a class="btn" href="#/">取消</a>
              </div>
              <div class="sep"></div>
              <p class="small">規則：一支手機只能註冊一次。完成後狀態會轉為 <b class="good">ACTIVE</b>。</p>
            </div>

            <div>
              <div class="card" style="box-shadow:none">
                <div class="card__hd"><h2>目前帳號</h2><div class="hint">Google 已驗證</div></div>
                <div class="card__bd">
                  <div class="kv"><b>Email</b><span>${esc(me.email||'')}</span></div>
                  <div class="kv"><b>暱稱</b><span>${esc(me.nickname||'')}</span></div>
                  <div class="kv"><b>狀態</b><span>${esc(me.status||'')}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `);

    $('#bindBtn').onclick = async()=>{
      const phone = ($('#phone').value||'').trim();
      if(!phone){ toast('請輸入手機', '手機號碼不可空白'); return; }
      try{
        const d = await window.API.request('/user/bind-phone', { method:'POST', json:{ phone } });
        toast('綁定成功', '已完成手機綁定');
        location.hash = '#/profile';
      }catch(e){
        toast('綁定失敗', e.message || '請稍後再試');
      }
    };
  });
}
