(function(){
  const KEY = 'dlcard_store_v1';

  function load(){
    try{ return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }catch(e){ return {}; }
  }
  function save(s){ localStorage.setItem(KEY, JSON.stringify(s||{})); }

  function getCart(){
    const s = load();
    return Array.isArray(s.cart) ? s.cart : [];
  }
  function setCart(cart){
    const s = load();
    s.cart = cart;
    save(s);
  }

  function addToCart(item){
    const cart = getCart();
    const id = String(item.product_id ?? item.id ?? '');
    const mall_id = String(item.mall_id ?? item.mallId ?? item.mall ?? '');
    const idx = cart.findIndex(x => String(x.id)===id && String(x.mall_id||'')===mall_id);
    if(idx>=0){ cart[idx].qty = (cart[idx].qty||1) + (item.qty||1); }
    else cart.push({ id, mall_id, qty: item.qty||1, snapshot: item.snapshot||null });
    setCart(cart);
  }
  function removeFromCart(id, mall_id){
    const cart = getCart().filter(x => !(String(x.id)===String(id) && String(x.mall_id||'')===String(mall_id||'')));
    setCart(cart);
  }
  function clearCart(){ setCart([]); }

  function getShipping(){
    const s = load();
    return s.shipping || { mode:'address', receiver:'', phone:'', address:'', store_name:'', store_id:'', store_address:'' };
  }
  function setShipping(sh){
    const s = load();
    s.shipping = sh;
    save(s);
  }

  window.STORE = { load, save, getCart, setCart, addToCart, removeFromCart, clearCart, getShipping, setShipping };
})();
