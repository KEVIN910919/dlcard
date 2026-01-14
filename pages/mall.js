window.PagesMall = function(){
  const { esc, toast, openModal } = window.DL;
  const { mount } = window.VIEW;

  function normalizeProducts(d){
    if(!d) return [];
    if(Array.isArray(d)) return d;
    const items = d.items || d.products || d.data || d.rows || [];
    return Array.isArray(items)?items:[];
  }

  function productId(p){ return p.product_id ?? p.id ?? p.pid ?? ''; }
  function productName(p){ return p.name ?? p.title ?? p.product_name ?? '未命名商品'; }
  function productPrice(p){ return p.price ?? p.points ?? p.point_price ?? p.cost ?? '—'; }
  function productImg(p){ return p.image ?? p.img ?? p.cover ?? p.thumbnail ?? ''; }
  function productStock(p){ return p.stock ?? p.inventory ?? p.qty ?? null; }
  function productCat(p){ return p.category ?? p.cat ?? p.tag ?? ''; }

  function renderFilters(mallId, q, cat){
    return `
      <div class="row" style="align-items:flex-end">
        <div class="field" style="flex:1; min-width:220px">
          <div class="label">搜尋</div>
          <input id="q" class="input" placeholder="輸入商品名稱/標籤" value="${esc(q||'')}" />
        </div>
        <div class="field" style="width:200px">
          <div class="label">分類（可留空）</div>
          <input id="cat" class="input" placeholder="例如：卡牌 / 周邊" value="${esc(cat||'')}" />
        </div>
        <div class="field" style="width:140px">
          <div class="label">商城 ID</div>
          <input id="mallId" class="input" value="${esc(mallId)}" />
        </div>
        <div class="row">
          <button class="btn" id="applyBtn">套用</button>
          <a class="btn" href="#/checkout">去結帳</a>
        </div>
      </div>
    `;
  }

  function renderProductCard(p, mallId){
    const id = productId(p);
    const name = productName(p);
    const price = productPrice(p);
    const img = productImg(p);
    const stock = productStock(p);
    const cat = productCat(p);

    const stockText = (stock===null || stock===undefined) ? '—' : String(stock);

    return `
      <div class="pcard">
        <img src="${esc(img)}" alt="${esc(name)}" onerror="this.style.display='none'" />
        <div class="title">${esc(name)}</div>
        <div class="meta">
          <span>${esc(cat||'')}</span>
          <span>庫存：${esc(stockText)}</span>
        </div>
        <div class="meta"><span class="price">${esc(price)} 點</span><span class="small">ID: ${esc(id)}</span></div>
        <div class="actions">
          <button class="btn" data-view="${esc(id)}">查看</button>
          <button class="btn primary" data-add="${esc(id)}">加入</button>
        </div>
      </div>
    `;
  }

  window.ROUTER.add('/mall/:mallId', async({params})=>{
    let me=null; try{ me=await window.API.authMe(); }catch(e){}
    if(!me){ location.hash='#/'; return; }

    const mallId = params.mallId || window.DLCARD_CONFIG.DEFAULT_MALL_ID;
    const url = new URL(location.href);
    const q = url.hash.includes('?') ? url.hash.split('?')[1] : '';
    const sp = new URLSearchParams(q);
    const query = sp.get('q') || '';
    const cat = sp.get('cat') || '';

    let data=null;
    try{ data = await window.API.request(`/malls/${encodeURIComponent(mallId)}/products`); }
    catch(e){ toast('讀取商品失敗', e.message||''); data=null; }

    const list = normalizeProducts(data);
    const filtered = list.filter(p=>{
      const name = String(productName(p)).toLowerCase();
      const tag = String(productCat(p)).toLowerCase();
      const okQ = !query || name.includes(query.toLowerCase()) || tag.includes(query.toLowerCase());
      const okC = !cat || tag.includes(cat.toLowerCase());
      return okQ && okC;
    });

    mount(`
      <section class="card">
        <div class="card__hd"><h2>商城</h2><div class="hint">多商城 / 分類 / 搜尋 · 價格由後端計算</div></div>
        <div class="card__bd">
          ${renderFilters(mallId, query, cat)}
          <div class="sep"></div>
          <div class="row">
            <span class="pill">商品數：${esc(filtered.length)}</span>
            <span class="pill">購物車：${esc(window.STORE.getCart().length)}</span>
          </div>
          <div class="sep"></div>
          <div class="products" id="products">
            ${filtered.map(p=>renderProductCard(p, mallId)).join('') || `<div class="small">尚無商品</div>`}
          </div>
          <div class="sep"></div>
          <details>
            <summary class="small">查看原始 JSON（除錯用）</summary>
            <pre class="mono">${esc(JSON.stringify(data,null,2))}</pre>
          </details>
        </div>
      </section>
    `);

    const host = document.getElementById('products');
    host.addEventListener('click', async(e)=>{
      const t = e.target;
      if(!(t instanceof HTMLElement)) return;
      if(t.dataset.add){
        const id = t.dataset.add;
        const p = filtered.find(x=>String(productId(x))===String(id));
        window.STORE.addToCart({ id, mall_id: mallId, qty:1, snapshot:{ name: productName(p||{}), price: productPrice(p||{}), img: productImg(p||{}) } });
        toast('已加入購物車', '可前往結帳頁確認');
        return;
      }
      if(t.dataset.view){
        const id = t.dataset.view;
        const p = filtered.find(x=>String(productId(x))===String(id));
        const snap = {
          id,
          name: productName(p||{}),
          price: productPrice(p||{}),
          img: productImg(p||{}),
          desc: p?.desc || p?.description || p?.content || '',
          cat: productCat(p||{}),
          stock: productStock(p||{}),
        };
        openModal('商品資訊', `
          <div class="grid">
            <div>
              ${snap.img?`<img src="${esc(snap.img)}" style="width:100%;border-radius:14px;border:1px solid rgba(38,50,95,.8)" onerror="this.style.display='none'">`:''}
              <div class="sep"></div>
              <div class="row"><span class="pill">${esc(snap.cat||'')}</span><span class="pill">庫存：${esc(snap.stock??'—')}</span></div>
            </div>
            <div>
              <div style="font-weight:900;font-size:18px">${esc(snap.name)}</div>
              <div class="sep"></div>
              <div class="kv"><b>點數</b><span style="font-weight:900">${esc(snap.price)} 點</span></div>
              <div class="kv"><b>商品 ID</b><span class="mono">${esc(id)}</span></div>
              <div class="sep"></div>
              <div class="small">${esc(snap.desc||'（無描述）')}</div>
            </div>
          </div>
        `, { actions:[
          { label:'加入購物車', variant:'primary', onClick:()=>{ window.STORE.addToCart({ id, mall_id: mallId, qty:1, snapshot:{ name:snap.name, price:snap.price, img:snap.img } }); toast('已加入購物車',''); } },
          { label:'前往結帳', onClick:()=>{ location.hash = '#/checkout'; } },
        ]});
      }
    });

    document.getElementById('applyBtn').onclick = ()=>{
      const qv = document.getElementById('q').value.trim();
      const cv = document.getElementById('cat').value.trim();
      const mv = document.getElementById('mallId').value.trim() || mallId;
      const sp = new URLSearchParams();
      if(qv) sp.set('q', qv);
      if(cv) sp.set('cat', cv);
      const qs = sp.toString();
      location.hash = `#/mall/${encodeURIComponent(mv)}${qs?('?'+qs):''}`;
    };
  });
}
