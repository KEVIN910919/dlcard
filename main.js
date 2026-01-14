
const API = "https://apidlcard.dreamlight.site";

async function loadStatus(){
  try{
    const res = await fetch(API + "/");
    const data = await res.json();
    document.getElementById("status").textContent =
      JSON.stringify(data, null, 2);
  }catch(e){
    document.getElementById("status").textContent =
      "Error connecting to backend";
  }
}
loadStatus();
