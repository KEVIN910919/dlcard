window.PagesCheckout = function(){
  const { esc, toast, openModal } = window.DL;
  const { mount } = window.VIEW;

  function renderCart(cart){
    if(!cart.length) return `<div class="small">購物車是空的。請先到商城加入商品。</div>`;
    return cart.map((x,i)=>{
      const snap = x.snapshot || {};
      return `
        <div class="card" style="box-shadow:none;margin-bottom:10px">
          <div class="card__bd">
            <div class="row" style="justify-content:space-between">
              <b>${esc(snap.name || '商品')}</b>
              <span class="small">ID: <span class="mono">${esc(x.id)}</span></span>
            </div>
            <div class="row" style="justify-content:space-between; margin-top:8px">
              <span class="pill">商城：${esc(x.mall_id||'')}</span>
              <span class="pill">單價：${esc(snap.price ?? '—')} 點</span>
            </div>
            <div class="sep"></div>
            <div class="row" style="justify-content:space-between">
              <div style="display:flex;gap:8px;align-items:center">
                <button class="btn small" data-dec="${esc(i)}">-</button>
                <span class="pill">數量：${esc(x.qty||1)}</span>
                <button class="btn small" data-inc="${esc(i)}">+</button>
              </div>
              <button class="btn small danger" data-del="${esc(i)}">移除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderShipping(sh){
    return `
      <div class="row">
        <button class="btn ${sh.mode==='address'?'primary':''}" data-mode="address">宅配地址</button>
        <button class="btn ${sh.mode==='store'?'primary':''}" data-mode="store">超商門市</button>
      </div>
      <div class="sep"></div>
      <div class="field"><div class="label">收件人</div><input class="input" id="receiver" value="${esc(sh.receiver||'')}" /></div>
      <div class="field"><div class="label">手機</div><input class="input" id="phone" value="${esc(sh.phone||'')}" /></div>
      <div class="field" id="addrField" style="display:${sh.mode==='address'?'block':'none'}"><div class="label">地址</div><textarea class="input" id="address" rows="3">${esc(sh.address||'')}</textarea></div>
      <div id="storeFields" style="display:${sh.mode==='store'?'block':'none'}">
        <div class="field"><div class="label">門市店名</div><input class="input" id="store_name" value="${esc(sh.store_name||'')}" /></div>
        <div class="field"><div class="label">門市店號</div><input class="input" id="store_id" value="${esc(sh.store_id||'')}" /></div>
        <div class="field"><div class="label">門市地址</div><textarea class="input" id="store_address" rows="2">${esc(sh.store_address||'')}</textarea></div>
        <div class="small">（目前先手動輸入門市資訊；若你之後要串超商選店，我可以再接。）</div>
      </div>
    `;
  }

  function buildOrderPayload(cart, sh){
    // Backend rule: frontend only sends IDs/qty + shipping; pricing computed server-side.
    const items = cart.map(x=>({ product_id: x.id, id: x.id, qty: x.qty||1, mall_id: x.mall_id }));
    const shipping = (sh.mode==='address')
      ? { mode:'address', receiver: sh.receiver, phone: sh.phone, address: sh.address }
      : { mode:'store', receiver: sh.receiver, phone: sh.phone, store_name: sh.store_name, store_id: sh.store_id, store_address: sh.store_address };
    return { items, shipping };
  }

  window.ROUTER.add('/checkout', async()=>{
    let me=null; try{ me=await window.API.authMe(); }catch(e){}
    if(!me){ location.hash='#/'; return; }

    let cart = window.STORE.getCart();
    let sh = window.STORE.getShipping();

    mount(`
      <section class="card">
        <div class="card__hd"><h2>結帳</h2><div class="hint">先試算（preview）再建立訂單（create）</div></div>
        <div class="card__bd">
          <div class="grid">
            <div>
              <div class="row" style="justify-content:space-between">
                <span class="pill">購物車：${esc(cart.length)} 件</span>
                <div class="row">
                  <a class="btn" href="#/mall/${esc(window.DLCARD_CONFIG.DEFAULT_MALL_ID)}">回商城</a>
                  <button class="btn danger" id="clearBtn">清空</button>
                </div>
              </div>
              <div class="sep"></div>
              <div id="cartList">${renderCart(cart)}</div>
            </div>

            <div>
              <div class="card" style="box-shadow:none">
                <div class="card__hd"><h2>寄送資料</h2><div class="hint">地址 / 超商</div></div>
                <div class="card__bd" id="shipBox">
                  ${renderShipping(sh)}
                  <div class="sep"></div>
                  <div class="row">
                    <button class="btn" id="saveShipBtn">儲存寄送資料</button>
                  </div>
                </div>
              </div>

              <div class="card" style="box-shadow:none; margin-top:12px">
                <div class="card__hd"><h2>送出</h2><div class="hint">後端計算扣點/優惠</div></div>
                <div class="card__bd">
                  <div class="row">
                    <button class="btn" id="previewBtn">試算 Preview</button>
                    <button class="btn primary" id="createBtn">建立訂單</button>
                  </div>
                  <div class="sep"></div>
                  <details open>
                    <summary class="small">結果</summary>
                    <pre class="mono" id="out">（尚未執行）</pre>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `);

    function persistCart(newCart){
      cart = newCart;
      window.STORE.setCart(cart);
      document.getElementById('cartList').innerHTML = renderCart(cart);
    }

    document.getElementById('cartList').onclick = (e)=>{
      const t = e.target;
      if(!(t instanceof HTMLElement)) return;
      if(t.dataset.inc){
        const i = Number(t.dataset.inc); cart[i].qty = (cart[i].qty||1) + 1; persistCart(cart); return;
      }
      if(t.dataset.dec){
        const i = Number(t.dataset.dec); cart[i].qty = Math.max(1,(cart[i].qty||1)-1); persistCart(cart); return;
      }
      if(t.dataset.del){
        const i = Number(t.dataset.del); cart.splice(i,1); persistCart(cart); return;
      }
    };

    document.getElementById('clearBtn').onclick = ()=>{ window.STORE.clearCart(); location.reload(); };

    function readShipping(){
      const mode = sh.mode;
      const receiver = document.getElementById('receiver').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address')?.value?.trim() || '';
      const store_name = document.getElementById('store_name')?.value?.trim() || '';
      const store_id = document.getElementById('store_id')?.value?.trim() || '';
      const store_address = document.getElementById('store_address')?.value?.trim() || '';
      return { mode, receiver, phone, address, store_name, store_id, store_address };
    }

    document.getElementById('shipBox').onclick = (e)=>{
      const t = e.target;
      if(!(t instanceof HTMLElement)) return;
      if(t.dataset.mode){
        sh.mode = t.dataset.mode;
        window.STORE.setShipping(sh);
        document.getElementById('shipBox').innerHTML = renderShipping(sh) + `<div class="sep"></div><div class="row"><button class="btn" id="saveShipBtn">儲存寄送資料</button></div>`;
      }
    };

    document.getElementById('saveShipBtn').onclick = ()=>{
      sh = readShipping();
      window.STORE.setShipping(sh);
      toast('已儲存', '寄送資料已保存於此裝置');
    };

    async function callOrder(endpoint){
      if(!cart.length){ toast('購物車為空', '請先加入商品'); return; }
      sh = readShipping();
      const payload = buildOrderPayload(cart, sh);
      document.getElementById('out').textContent = '處理中…';
      try{
        const d = await window.API.request(endpoint, { method:'POST', json: payload });
        document.getElementById('out').textContent = JSON.stringify(d,null,2);
        return d;
      }catch(e){
        document.getElementById('out').textContent = `錯誤：${e.message}\n\n` + (e.data?JSON.stringify(e.data,null,2):'');
        toast('失敗', e.message||'');
        return null;
      }
    }

    document.getElementById('previewBtn').onclick = ()=> callOrder('/order/preview');
    document.getElementById('createBtn').onclick = async()=>{
      const d = await callOrder('/order/create');
      if(d){
        toast('訂單已建立', '購物車將清空');
        window.STORE.clearCart();
      }
    };

  });
}
