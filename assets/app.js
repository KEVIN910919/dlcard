(function(){
  const { $, toast } = window.DL;
  const CFG = window.DLCARD_CONFIG;

  const envHint = document.getElementById('envHint');
  envHint.textContent = `API: ${window.API.API_BASE}`;

  // --- Auth UI
  async function renderAuth(){
    const box = document.getElementById('authBox');
    box.innerHTML = '<span class="pill">檢查登入中…</span>';

    let me = null;
    try{ me = await window.API.authMe(); }catch(e){ me = null; }

    if(!me){
      box.innerHTML = `<button class="btn primary" id="loginBtn">Google 登入</button>`;
      $('#loginBtn').onclick = async()=>{
        try{
          const url = await window.API.authGetGoogleUrl();
          location.href = url;
        }catch(e){
          toast('登入失敗', e.message || '無法取得登入網址');
        }
      };
      return;
    }

    const name = me.nickname || me.email || 'User';
    box.innerHTML = `
      <span class="pill ok">已登入</span>
      <span class="small" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${window.DL.esc(name)}</span>
      <button class="btn small danger" id="logoutBtn">登出</button>
    `;
    $('#logoutBtn').onclick = async()=>{
      await window.API.authLogout();
      toast('已登出', '登入狀態已清除');
      setTimeout(()=>location.reload(), 300);
    };

    // redirect rule: if pending, go bind-phone
    if(String(me.status||'').toUpperCase()==='PENDING'){
      if(!location.hash || location.hash==='#/' || location.hash==='#'){
        location.hash = '#/bind-phone';
      }
    }
  }

  // --- Register pages
  const app = document.getElementById('app');
  function mount(html){ app.innerHTML = html; }
  window.VIEW = { mount };

  // Pages register
  window.PagesHome();
  window.PagesBindPhone();
  window.PagesProfile();
  window.PagesWallet();
  window.PagesMall();
  window.PagesCheckout();
  window.PagesTopup();
  window.PagesAdmin();

  // 404
  window.ROUTER.add('*', async({path})=>{
    mount(`
      <section class="card">
        <div class="card__hd"><h2>找不到頁面</h2><div class="hint">${window.DL.esc(path)}</div></div>
        <div class="card__bd">
          <p class="small">請用下方導覽回到可用頁面。</p>
          <div class="row"><a class="btn" href="#/">回首頁</a></div>
        </div>
      </section>
    `);
  });

  // Run
  window.addEventListener('hashchange', window.ROUTER.render);
  window.ROUTER.render();
  renderAuth();
})();
