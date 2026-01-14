(function(){
  const routes = [];

  function add(pattern, handler){
    // pattern: "/mall/:mallId" etc.
    const keys = [];
    const re = new RegExp('^' + pattern
      .replace(/\//g,'\\/')
      .replace(/:([A-Za-z0-9_]+)/g, (_,k)=>{ keys.push(k); return '([^/]+)'; })
      + '$');
    routes.push({ pattern, re, keys, handler });
  }

  function getPath(){
    // support both hash routes and direct path routes
    const h = location.hash;
    if(h && h.startsWith('#')){
      const p = h.slice(1);
      return p || '/';
    }
    return location.pathname || '/';
  }

  async function go(path){
    if(!path.startsWith('#')) location.hash = '#' + path;
    else location.hash = path;
  }

  async function render(){
    const path = getPath();
    const clean = path.split('?')[0].replace(/\/+$/,'') || '/';

    // nav active
    document.querySelectorAll('[data-nav]').forEach(a=>{
      const href = a.getAttribute('href') || '';
      const isActive = href === '#' + clean || (href.startsWith('#/mall') && clean.startsWith('/mall'));
      a.dataset.active = isActive ? '1' : '0';
    });

    for(const r of routes){
      const m = clean.match(r.re);
      if(m){
        const params = {};
        r.keys.forEach((k,i)=> params[k]=decodeURIComponent(m[i+1]));
        await r.handler({ path: clean, params });
        return;
      }
    }
    // 404
    await routes.find(x=>x.pattern==='*')?.handler?.({ path: clean, params:{} });
  }

  window.ROUTER = { add, render, go, getPath };
})();
