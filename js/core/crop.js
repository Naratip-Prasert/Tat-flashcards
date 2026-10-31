/* ✂️ ครอบรูป: เปิดหน้าต่างให้ลากเลื่อน / ถ่างนิ้วซูม แล้วคืนรูปที่ครอบเป็น dataURL (JPEG)
   cropImage(file, {w, h, round, q, title}) → Promise<string|null>  (null = กดยกเลิก) */
function cropImage(file,opt){
  const o=Object.assign({w:600,h:600,round:false,q:.8,title:"ครอบรูป"},opt||{});
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file), im=new Image();
    im.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error("img")); };
    im.onload=()=>{
      const wrap=document.createElement("div"); wrap.className="crop";
      wrap.innerHTML=`<div class="crop-top"><button class="crop-x" data-a="no">ยกเลิก</button><b>${esc(o.title)}</b><button class="crop-ok" data-a="ok">ใช้รูปนี้</button></div>
        <div class="crop-stage"><img alt="" draggable="false"><div class="crop-frame${o.round?" round":""}"></div></div>
        <div class="crop-bot"><span>－</span><input type="range" min="1" max="4" step="0.01" value="1" aria-label="ซูม"><span>＋</span></div>
        <p class="crop-hint">ลากเพื่อเลื่อน · ถ่างนิ้วหรือเลื่อนแถบเพื่อซูม</p>`;
      document.body.appendChild(wrap);
      const stage=wrap.querySelector(".crop-stage"), img=wrap.querySelector("img"), frame=wrap.querySelector(".crop-frame"), zoom=wrap.querySelector("input");
      const IW=im.naturalWidth, IH=im.naturalHeight, A=o.w/o.h;
      img.src=url; img.style.width=IW+"px"; img.style.height=IH+"px";
      let FW,FH,FX,FY,base,z=1,x=0,y=0;                 // frame size/pos in stage; image top-left (x,y) relative to frame
      function layout(){
        const SW=stage.clientWidth, SH=stage.clientHeight, pad=20;
        FW=Math.min(SW-pad*2,(SH-pad*2)*A,520); FH=FW/A; FX=(SW-FW)/2; FY=(SH-FH)/2;
        Object.assign(frame.style,{left:FX+"px",top:FY+"px",width:FW+"px",height:FH+"px"});
        const ob=base; base=Math.max(FW/IW,FH/IH);
        if(!ob){ x=(FW-IW*base)/2; y=(FH-IH*base)/2; } paint();
      }
      const sc=()=>base*z;
      function clamp(){ const s=sc(); x=Math.min(0,Math.max(FW-IW*s,x)); y=Math.min(0,Math.max(FH-IH*s,y)); }
      function paint(){ clamp(); img.style.transform=`translate(${FX+x}px,${FY+y}px) scale(${sc()})`; zoom.value=z; }
      function zoomAt(nz,cx,cy){                           // keep point (cx,cy) in frame coords fixed
        nz=Math.min(4,Math.max(1,nz)); const s0=sc(), s1=base*nz;
        x=cx-(cx-x)*s1/s0; y=cy-(cy-y)*s1/s0; z=nz; paint();
      }
      const P=new Map(); let pinch=null;
      stage.addEventListener("pointerdown",e=>{ stage.setPointerCapture(e.pointerId); P.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(P.size===2){ const [a,b]=[...P.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z}; } });
      stage.addEventListener("pointermove",e=>{ const p=P.get(e.pointerId); if(!p) return;
        if(P.size===1){ x+=e.clientX-p.x; y+=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; paint(); return; }
        p.x=e.clientX; p.y=e.clientY;
        if(P.size===2&&pinch){ const [a,b]=[...P.values()], r=stage.getBoundingClientRect();
          zoomAt(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,(a.x+b.x)/2-r.left-FX,(a.y+b.y)/2-r.top-FY); } });
      const up=e=>{ P.delete(e.pointerId); if(P.size<2) pinch=null; };
      stage.addEventListener("pointerup",up); stage.addEventListener("pointercancel",up);
      stage.addEventListener("wheel",e=>{ e.preventDefault(); const r=stage.getBoundingClientRect(); zoomAt(z*(e.deltaY<0?1.1:1/1.1),e.clientX-r.left-FX,e.clientY-r.top-FY); },{passive:false});
      zoom.oninput=()=>zoomAt(+zoom.value,FW/2,FH/2);
      const onR=()=>{ const fx=-x/sc(), fy=-y/sc(); layout(); x=-fx*sc(); y=-fy*sc(); paint(); };
      window.addEventListener("resize",onR);
      function done(v){ window.removeEventListener("resize",onR); URL.revokeObjectURL(url); wrap.remove(); resolve(v); }
      wrap.querySelector(".crop-top").onclick=e=>{ const a=e.target.dataset.a; if(!a) return;
        if(a==="no") return done(null);
        const s=sc(), c=document.createElement("canvas"); c.width=o.w; c.height=o.h;
        const g=c.getContext("2d"); g.fillStyle="#fff"; g.fillRect(0,0,o.w,o.h); g.imageSmoothingQuality="high";
        g.drawImage(im,-x/s,-y/s,FW/s,FH/s,0,0,o.w,o.h);
        done(c.toDataURL("image/jpeg",o.q)); };
      requestAnimationFrame(()=>{ wrap.classList.add("on"); layout(); });
    };
    im.src=url;
  });
}
