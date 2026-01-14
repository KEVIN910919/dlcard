(function(){
  const CFG = window.DLCARD_CONFIG;
  const API_BASE = CFG.API_BASE.replace(/\/+$/,'');

  async function request(path, opt={}){
    const url = API_BASE + path;
    const headers = Object.assign({}, opt.headers||{});
    if(opt.json && !headers['Content-Type']) headers['Content-Type']='application/json';

    const r = await fetch(url, {
      method: opt.method || 'GET',
      credentials: 'include',
      headers,
      body: opt.json ? JSON.stringify(opt.json) : opt.body,
    });

    const ct = r.headers.get('content-type') || '';
    let data = null;
    if(ct.includes('application/json')){
      try{ data = await r.json(); }catch(e){ data = null; }
    }else{
      try{ data = await r.text(); }catch(e){ data = null; }
    }

    if(!r.ok){
      const msg = (data && typeof data === 'object' && (data.detail||data.message)) ? (data.detail||data.message) : (typeof data === 'string' ? data : r.statusText);
      const err = new Error(msg || `HTTP ${r.status}`);
      err.status = r.status;
      err.data = data;
      throw err;
    }

    return data;
  }

  // --- Auth helpers
  async function authMe(){
    const d = await request('/auth/me');
    if(d && typeof d === 'object' && d.logged_in === false) return null;
    return (d && d.user) ? d.user : d;
  }

  async function authGetGoogleUrl(){
    const d = await request('/auth/google');
    if(d && d.auth_url) return d.auth_url;
    throw new Error('NO_AUTH_URL');
  }

  async function authLogout(){
    try{ await request('/auth/logout', { method:'POST' }); }catch(e){ /* ignore */ }
  }

  window.API = { request, authMe, authGetGoogleUrl, authLogout, API_BASE };
})();
