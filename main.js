const API_BASE = 'https://apidlcard.dreamlight.site';

const btn = document.getElementById('loginBtn');
const out = document.getElementById('output');

btn.onclick = async () => {
  try{
    const res = await fetch(API_BASE + '/auth/google', {
      credentials:'include'
    });
    const data = await res.json();
    if(data.auth_url){
      window.location.href = data.auth_url;
    }else{
      out.textContent = '沒有取得 auth_url\n' + JSON.stringify(data,null,2);
    }
  }catch(e){
    out.textContent = '錯誤: ' + e;
  }
};

(async ()=>{
  try{
    const res = await fetch(API_BASE + '/', {credentials:'include'});
    const data = await res.json();
    out.textContent = JSON.stringify(data,null,2);
  }catch(e){
    out.textContent = '無法連線後端';
  }
})();
