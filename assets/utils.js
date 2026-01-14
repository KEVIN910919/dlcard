(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function fmtDate(v){
    if(!v) return '';
    try{
      const d = (typeof v === 'string' || typeof v === 'number') ? new Date(v) : v;
      if(Number.isNaN(d.getTime())) return String(v);
      return d.toLocaleString('zh-Hant-TW', { hour12:false });
    }catch(e){ return String(v); }
  }

  function toast(title, msg){
    const host = document.getElementById('toastHost');
    if(!host) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<b>${esc(title)}</b><p>${esc(msg)}</p>`;
    host.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .2s ease'; }, 3200);
    setTimeout(()=>{ el.remove(); }, 3600);
  }

  function openModal(title, html, {actions=[]}={}){
    const host = document.getElementById('modalHost');
    host.innerHTML = `
      <div class="modalBackdrop" data-close></div>
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal__hd"><b>${esc(title)}</b><button class="btn small ghost" data-close>關閉</button></div>
        <div class="modal__bd">${html}</div>
        <div class="modal__ft" id="modalActions"></div>
      </div>
    `;
    host.dataset.open = '1';
    const close = ()=>{ host.dataset.open='0'; host.innerHTML=''; };
    host.addEventListener('click', (e)=>{ if(e.target && e.target.hasAttribute('data-close')) close(); }, { once:false });
    document.addEventListener('keydown', function onKey(ev){ if(ev.key==='Escape'){ close(); document.removeEventListener('keydown', onKey); } });

    const act = document.getElementById('modalActions');
    for(const a of actions){
      const b = document.createElement('button');
      b.className = 'btn' + (a.variant?` ${a.variant}`:'');
      b.textContent = a.label;
      b.onclick = async()=>{ try{ await a.onClick?.(close); }catch(err){ toast('操作失敗', String(err?.message||err)); } };
      act.appendChild(b);
    }

    return { close };
  }

  window.DL = { $, $$, esc, fmtDate, toast, openModal };
})();
