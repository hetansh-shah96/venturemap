import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

function uint32BE(n) { const b=Buffer.alloc(4); b.writeUInt32BE(n,0); return b; }
function crc32(buf) {
  const t=new Uint32Array(256);
  for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[i]=c;}
  let c=0xffffffff;
  for(const b of buf)c=t[(c^b)&0xff]^(c>>>8);
  return(c^0xffffffff)>>>0;
}
function chunk(type,data){
  const t=Buffer.from(type,'ascii'),cb=Buffer.concat([t,data]);
  return Buffer.concat([uint32BE(data.length),t,data,uint32BE(crc32(cb))]);
}

// Simplified continent outlines [lon, lat] — equirectangular projection
const CONTINENTS = [
  [[-168,55],[-163,68],[-140,70],[-110,72],[-80,73],[-64,63],[-53,47],
   [-66,44],[-71,41],[-76,35],[-81,25],[-87,16],[-104,19],[-110,24],
   [-117,33],[-122,37],[-124,47],[-130,55],[-148,60],[-168,55]],
  [[-55,62],[-46,60],[-30,64],[-20,70],[-22,78],[-35,84],[-52,83],[-68,80],[-73,73],[-68,66],[-55,62]],
  [[-77,12],[-63,11],[-50,5],[-35,-5],[-37,-22],[-48,-28],[-51,-34],
   [-65,-55],[-70,-55],[-75,-38],[-80,-5],[-78,0],[-77,12]],
  [[-9,37],[2,36],[10,37],[18,39],[28,38],[30,40],[32,47],[28,55],
   [25,60],[22,62],[28,70],[20,72],[16,70],[12,60],[8,58],[3,55],
   [0,52],[-2,50],[-5,48],[-9,44],[-9,37]],
  [[-6,36],[10,37],[14,35],[25,31],[32,31],[38,22],[43,12],[51,11],
   [42,2],[40,-4],[40,-12],[35,-18],[32,-26],[28,-34],[18,-35],
   [16,-29],[12,-18],[10,-5],[8,4],[2,5],[-15,10],[-18,15],[-18,22],[-13,28],[-6,36]],
  [[26,42],[36,37],[36,30],[42,12],[56,22],[62,22],[68,24],[72,20],
   [80,10],[100,5],[110,2],[118,4],[126,10],[130,32],[140,38],
   [142,46],[145,48],[142,55],[130,62],[115,72],[95,75],[72,72],
   [55,68],[45,68],[38,68],[35,67],[28,62],[30,52],[26,42]],
  [[130,31],[133,34],[136,35],[140,38],[142,42],[142,44],[140,43],[136,34],[132,32],[130,31]],
  [[114,-22],[122,-18],[130,-12],[136,-12],[142,-12],[148,-20],[152,-24],
   [156,-28],[152,-38],[148,-38],[140,-38],[130,-34],[122,-34],[114,-30],[114,-22]],
];

function makeIcon(size) {
  const BG    = [26, 26, 26, 255];
  const WHITE = [244,244,241,255];
  const GRID  = [52, 52, 50, 255];
  const EQ    = [72, 72, 70, 255];

  const cx = size/2, cy = size/2;
  const outerR = Math.round(size*0.48);   // outer ring
  const inner1 = Math.round(size*0.44);   // first inner ring
  const inner2 = Math.round(size*0.40);   // globe boundary

  const buf = new Uint8Array(size*size*4);
  for(let i=0;i<buf.length;i+=4){buf[i]=BG[0];buf[i+1]=BG[1];buf[i+2]=BG[2];buf[i+3]=BG[3];}

  function setPixel(x,y,col){
    const xi=Math.round(x),yi=Math.round(y);
    if(xi<0||xi>=size||yi<0||yi>=size)return;
    const i=(yi*size+xi)*4;
    buf[i]=col[0];buf[i+1]=col[1];buf[i+2]=col[2];buf[i+3]=col[3];
  }

  function line(x0,y0,x1,y1,w,col){
    const dx=x1-x0,dy=y1-y0,len2=dx*dx+dy*dy,hw=w/2;
    const bx0=Math.max(0,Math.floor(Math.min(x0,x1)-hw));
    const bx1=Math.min(size-1,Math.ceil(Math.max(x0,x1)+hw));
    const by0=Math.max(0,Math.floor(Math.min(y0,y1)-hw));
    const by1=Math.min(size-1,Math.ceil(Math.max(y0,y1)+hw));
    for(let y=by0;y<=by1;y++)
      for(let x=bx0;x<=bx1;x++){
        const t=len2===0?0:Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/len2));
        if((x-x0-t*dx)**2+(y-y0-t*dy)**2<=hw*hw)setPixel(x,y,col);
      }
  }

  function circleRing(rcx,rcy,r,w,col){
    const r0=r-w/2,r1=r+w/2;
    for(let y=Math.max(0,Math.floor(rcy-r1));y<=Math.min(size-1,Math.ceil(rcy+r1));y++)
      for(let x=Math.max(0,Math.floor(rcx-r1));x<=Math.min(size-1,Math.ceil(rcx+r1));x++){
        const d=Math.sqrt((x-rcx)**2+(y-rcy)**2);
        if(d>=r0&&d<=r1)setPixel(x,y,col);
      }
  }

  // Equirectangular lon/lat → globe pixel (centred, clipped to inner2 radius)
  function project(lon,lat){
    const gx = cx + (lon/180)*inner2;
    const gy = cy - (lat/90)*(inner2*0.5);
    return [gx,gy];
  }

  // --- Badge rings ---
  const rw = Math.max(1,Math.round(size*0.008));
  circleRing(cx,cy,outerR, rw*2, WHITE);    // thick outer
  circleRing(cx,cy,inner1, rw,   WHITE);    // thin inner border
  circleRing(cx,cy,inner2, rw,   WHITE);    // globe edge

  // --- Lat/lon grid inside globe ---
  const gw = 1;
  for(let lon=-120;lon<=180;lon+=30){
    const [x0,y0]=project(lon,89),[x1,y1]=project(lon,-89);
    const steps=60;
    for(let i=0;i<steps;i++){
      const la0=89-i*(178/steps),la1=89-(i+1)*(178/steps);
      const [ax,ay]=project(lon,la0),[bx,by]=project(lon,la1);
      const inside=(ax-cx)**2+(ay-cy)**2<=inner2**2 && (bx-cx)**2+(by-cy)**2<=inner2**2;
      if(inside)line(ax,ay,bx,by,gw,GRID);
    }
  }
  for(let lat=-60;lat<=90;lat+=30){
    const steps=80;
    for(let i=0;i<steps;i++){
      const lo0=-180+i*(360/steps),lo1=-180+(i+1)*(360/steps);
      const [ax,ay]=project(lo0,lat),[bx,by]=project(lo1,lat);
      if((ax-cx)**2+(ay-cy)**2<=inner2**2)line(ax,ay,bx,by,gw,GRID);
    }
  }
  // equator + prime meridian slightly brighter
  for(let i=0;i<80;i++){
    const lo=-180+i*(360/80);
    const [ax,ay]=project(lo,0),[bx,by]=project(lo+(360/80),0);
    if((ax-cx)**2+(ay-cy)**2<=inner2**2)line(ax,ay,bx,by,gw,EQ);
  }
  for(let i=0;i<60;i++){
    const la=89-i*(178/60);
    const [ax,ay]=project(0,la),[bx,by]=project(0,la-(178/60));
    if((ax-cx)**2+(ay-cy)**2<=inner2**2)line(ax,ay,bx,by,gw,EQ);
  }

  // --- Continent outlines (clipped to globe circle) ---
  const cw = Math.max(1,Math.round(size*0.005));
  for(const pts of CONTINENTS){
    for(let i=0;i<pts.length;i++){
      const [x0,y0]=project(pts[i][0],pts[i][1]);
      const [x1,y1]=project(pts[(i+1)%pts.length][0],pts[(i+1)%pts.length][1]);
      if((x0-cx)**2+(y0-cy)**2<=inner2**2 || (x1-cx)**2+(y1-cy)**2<=inner2**2)
        line(x0,y0,x1,y1,cw,WHITE);
    }
  }

  // --- Decorative side dots (like the reference badge) ---
  const dotR = Math.max(2,Math.round(size*0.022));
  const dotDist = Math.round(size*0.46);
  for(const sign of [-1,1]){
    const dx2=sign*dotDist;
    circleRing(cx+dx2,cy,dotR,Math.max(1,Math.round(size*0.010)),WHITE);
  }

  // --- Bottom banner arc (dark band) ---
  const bannerR1=inner1, bannerR2=Math.round(size*0.36);
  for(let y=Math.max(0,Math.floor(cy));y<=Math.min(size-1,Math.ceil(cy+bannerR1));y++)
    for(let x=Math.max(0,Math.floor(cx-bannerR1));x<=Math.min(size-1,Math.ceil(cx+bannerR1));x++){
      const d=Math.sqrt((x-cx)**2+(y-cy)**2);
      if(d>=bannerR2&&d<=bannerR1){
        buf[(y*size+x)*4]   = 18;
        buf[(y*size+x)*4+1] = 18;
        buf[(y*size+x)*4+2] = 18;
        buf[(y*size+x)*4+3] = 255;
      }
    }
  // Banner outline arcs
  circleRing(cx,cy,bannerR1,rw,WHITE);
  circleRing(cx,cy,bannerR2,rw,WHITE);

  // --- PNG assemble ---
  const scanlines=Buffer.alloc(size*(1+size*4));
  for(let y=0;y<size;y++){
    const rb=y*(1+size*4);scanlines[rb]=0;
    for(let x=0;x<size;x++){
      const s=(y*size+x)*4,d=rb+1+x*4;
      scanlines[d]=buf[s];scanlines[d+1]=buf[s+1];
      scanlines[d+2]=buf[s+2];scanlines[d+3]=buf[s+3];
    }
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
  ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),
    chunk('IDAT',deflateSync(scanlines)),
    chunk('IEND',Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir,{recursive:true});
writeFileSync(resolve(publicDir,'icon-192.png'),makeIcon(192));
writeFileSync(resolve(publicDir,'icon-512.png'),makeIcon(512));
console.log('Icons generated: public/icon-192.png  public/icon-512.png');
