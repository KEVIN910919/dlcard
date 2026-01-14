// DLCard QR Lite（非標準 QR；僅視覺化佔位，方便先串流程）
export function drawPseudoQR(canvas, text){
  const ctx = canvas.getContext("2d");
  const size = canvas.width = canvas.height = 320;
  ctx.clearRect(0,0,size,size);

  ctx.fillStyle = "rgba(7,10,18,0.35)";
  ctx.fillRect(0,0,size,size);

  let h = 2166136261;
  for (let i=0;i<text.length;i++){
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells = 29;
  const pad = 14;
  const cell = Math.floor((size - pad*2) / cells);
  function rand(){
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  }
  function finder(x,y){
    ctx.fillStyle = "rgba(124,247,216,0.75)";
    ctx.fillRect(x,y,cell*7,cell*7);
    ctx.fillStyle = "rgba(7,10,18,0.95)";
    ctx.fillRect(x+cell,y+cell,cell*5,cell*5);
    ctx.fillStyle = "rgba(124,247,216,0.75)";
    ctx.fillRect(x+cell*2,y+cell*2,cell*3,cell*3);
  }
  finder(pad, pad);
  finder(pad + cell*(cells-7), pad);
  finder(pad, pad + cell*(cells-7));

  for (let r=0;r<cells;r++){
    for (let c=0;c<cells;c++){
      const inFinder =
        (r<7 && c<7) ||
        (r<7 && c>=cells-7) ||
        (r>=cells-7 && c<7);
      if (inFinder) continue;
      const v = rand();
      if (v > 0.55){
        ctx.fillStyle = "rgba(122,167,255,0.55)";
        ctx.fillRect(pad + c*cell, pad + r*cell, cell-1, cell-1);
      }
    }
  }
  ctx.fillStyle = "rgba(234,240,255,0.9)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text.slice(0, 22) + (text.length>22?"…":""), size/2, size - 10);
}
