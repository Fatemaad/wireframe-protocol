
/* Backend endpoint that holds the prompt + API key server-side.
   Change this if your API route differs. */
const API_ENDPOINT = '/api/generate';

let uploadedFile=null, resultImage=null, composedBlob=null;
const $=s=>document.querySelector(s);

function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1900); }

/* dropzone helper */
function wireDrop(zone,onFile){
  zone.addEventListener('click',()=>zone._input.click());
  ['dragover','dragenter'].forEach(e=>zone.addEventListener(e,ev=>{ev.preventDefault();zone.classList.add('hot')}));
  ['dragleave','drop'].forEach(e=>zone.addEventListener(e,ev=>{ev.preventDefault();zone.classList.remove('hot')}));
  zone.addEventListener('drop',ev=>{ if(ev.dataTransfer.files[0]) onFile(ev.dataTransfer.files[0]); });
}

/* 01 upload */
const dz=$('#dropzone'), fi=$('#fileInput'); dz._input=fi;
wireDrop(dz,handleUpload);
fi.onchange=e=>{ if(e.target.files[0]) handleUpload(e.target.files[0]); };
function handleUpload(file){
  uploadedFile=file;
  $('#uploadImg').src=URL.createObjectURL(file);
  $('#uploadPreview').style.display='block';
  const st=$('#s1status'); st.textContent='STATUS // SOURCE LOADED'; st.classList.add('on');
  $('#genBtn').disabled=false;
  const g=$('#s2status'); g.textContent='STATUS // READY TO RENDER'; g.classList.add('on');
}

/* 02 generate — auto, via backend. Prompt + key live server-side. */
$('#genBtn').onclick=async ()=>{
  if(!uploadedFile){ toast('Upload a photo first'); return; }
  const btn=$('#genBtn'), old=btn.textContent; btn.disabled=true; btn.innerHTML='<span class="spin"></span>Rendering';
  const st=$('#s2status'); st.textContent='STATUS // RENDERING'; st.classList.add('on');
  try{
    const fd=new FormData();
    fd.append('image', uploadedFile);
    const res=await fetch(API_ENDPOINT,{method:'POST',body:fd});
    if(!res.ok){ let msg='Render failed'; try{ msg=(await res.json()).error||msg; }catch(e){} throw new Error(msg); }
    const ct=res.headers.get('content-type')||'';
    let src;
    if(ct.includes('application/json')){ const d=await res.json(); src=d.image||('data:image/png;base64,'+d.b64_json); }
    else { src=URL.createObjectURL(await res.blob()); }
    const img=new Image();
    img.onload=()=>{ resultImage=img; renderReady(); toast('Render complete'); $('#s3').scrollIntoView(); };
    img.src=src;
  }catch(err){
    toast('Render failed');
    const s=$('#s2status'); s.textContent='STATUS // '+(err.message||'ERROR').toUpperCase(); s.classList.remove('on');
    btn.disabled=false;
  }
  finally{ btn.disabled=false; btn.textContent=old; }
};

/* when a render exists: draw composite + enable everything */
function renderReady(){
  const st=$('#s2status'); st.textContent='STATUS // RENDER LOADED'; st.classList.add('on');
  drawComposite('#composer2');
  $('#composer2').style.display='block';
  $('#ph2').style.display='none';
  ['#downloadBtn','#nativeShare','#shareLinkedIn','#shareX'].forEach(s=>$(s).disabled=false);
}

/* ---- logos ----
   Top-left: AxioMeta, Anthropic, Unicorn Mafia.
   Bottom-left: host logo (drop file into /assets, see BOTTOM_LEFT_LOGO below). */
const UM_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcztpbWFnZS1yZW5kZXJpbmc6cGl4ZWxhdGVkIj4KICA8cmVjdCB4PSIyNTciIHk9IjQ4MCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjI1NyIgeT0iNDE2IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iMjU3IiB5PSIzNTIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIzMjEiIHk9IjM1MiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjMyMSIgeT0iMjg4IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iMzg1IiB5PSIyODgiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIzODUiIHk9IjIyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjQ0OSIgeT0iMjI0IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNTEzIiB5PSIyODgiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI1NzciIHk9IjM1MiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjUxMyIgeT0iMzUyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNjQxIiB5PSIzNTIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI2NDEiIHk9IjQxNiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjcwNSIgeT0iNDgwIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNzY5IiB5PSI1NDQiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI3NjkiIHk9IjYwOCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9Ijc2OSIgeT0iNjcyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNzA1IiB5PSI3MzYiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI2NDEiIHk9IjczNiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjU3NyIgeT0iNjcyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNTEzIiB5PSI2NzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI1MTMiIHk9IjczNiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjUxMyIgeT0iODAwIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNTEzIiB5PSI0ODAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIxOTMiIHk9IjU0NCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjI1NyIgeT0iNTQ0IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iMTkzIiB5PSI2MDgiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIyNTciIHk9IjYwOCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjE5MyIgeT0iNjcyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iMTkzIiB5PSI3MzYiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIyNTciIHk9IjY3MiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9IjY0MSIgeT0iMjg4IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNCMzA3RUIiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSI3MDUiIHk9IjI4OCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMzE5OEYxIiBzdHlsZT0ic3Ryb2tlOm5vbmU7c2hhcGUtcmVuZGVyaW5nOmNyaXNwRWRnZXMiIC8+CiAgPHJlY3QgeD0iNzA1IiB5PSIyMjQiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0iIzRFRjlCRCIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgogIDxyZWN0IHg9Ijc2OSIgeT0iMTYwIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFRTE3MDEiIHN0eWxlPSJzdHJva2U6bm9uZTtzaGFwZS1yZW5kZXJpbmc6Y3Jpc3BFZGdlcyIgLz4KICA8cmVjdCB4PSIxOTMiIHk9IjQ4MCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJ3aGl0ZSIgc3R5bGU9InN0cm9rZTpub25lO3NoYXBlLXJlbmRlcmluZzpjcmlzcEVkZ2VzIiAvPgo8L3N2Zz4KCg==';
// image loader helper — redraws composite once each logo is ready
function loadImg(src){ const im=new Image(); im._ready=false; im.onload=()=>{ im._ready=true; if(resultImage) drawComposite('#composer2'); }; im.onerror=()=>{ im._ready=false; }; if(src) im.src=src; return im; }
const LG = (window.LOGOS||{});
// top-left partner logos
const umImg = loadImg(UM_LOGO);
const anthImg = loadImg(LG.anthropic);
// bottom-left sponsor logos
const modalImg = loadImg(LG.modal);
const linkupImg = loadImg(LG.linkup);
const bambuImg = loadImg(LG.bambu);
// header images
const umHeader=document.getElementById('umLogo'); if(umHeader) umHeader.src=UM_LOGO;
const anthHeader=document.getElementById('anthropicLogo'); if(anthHeader && LG.anthropic) anthHeader.src=LG.anthropic;

// draw an image logo scaled to a target height, return width consumed
function drawImgLogo(ctx,img,x,y,h){ if(!img||!img._ready) return 0; const w=h*(img.width/img.height||1); ctx.drawImage(img,x,y,w,h); return w; }

function drawComposite(sel){
  const cv=document.querySelector(sel); if(!resultImage) return;
  const W=1024, H=Math.round(W*(resultImage.height/resultImage.width))||1024;
  cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  ctx.drawImage(resultImage,0,0,W,H);
  const pad=34, gap=20, lh=42;
  // TOP-LEFT: AxioMeta, Anthropic, Unicorn Mafia
  let x=pad;
  x+=drawAxioMeta(ctx,x,pad,lh)+gap;
  x+=drawImgLogo(ctx,anthImg,x,pad,lh)+gap;
  x+=drawImgLogo(ctx,umImg,x,pad-1,lh+2)+gap;
  // BOTTOM-LEFT: Modal, Linkup, Bambu Lab
  const bh=38, by=H-pad-bh; let bx=pad;
  bx+=drawImgLogo(ctx,modalImg,bx,by,bh)+gap;
  bx+=drawImgLogo(ctx,linkupImg,bx,by,bh)+gap;
  bx+=drawImgLogo(ctx,bambuImg,bx,by,bh)+gap;
  cv.toBlob(b=>composedBlob=b,'image/png');
}
function drawAxioMeta(ctx,leftX,top,h){ const w=h,s=w/100;
  ctx.save(); ctx.translate(leftX,top); ctx.scale(s,s); ctx.strokeStyle='#fff'; ctx.lineWidth=8; ctx.lineCap='square';
  L(ctx,26,30,26,58); L(ctx,74,30,74,58); L(ctx,26,30,66,78); L(ctx,74,30,34,78); ctx.restore(); return w; }
function drawAnthropic(ctx,leftX,top,h){ const w=h*0.72,s=h/100;
  ctx.save(); ctx.translate(leftX,top); ctx.scale(s,s); ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.moveTo(6,74); ctx.lineTo(19,26); ctx.lineTo(27,26); ctx.lineTo(14,74); ctx.closePath(); ctx.fill();
  ctx.fillRect(33,26,9,48); ctx.restore(); return w; }
function L(ctx,a,b,c,d){ ctx.beginPath(); ctx.moveTo(a,b); ctx.lineTo(c,d); ctx.stroke(); }

/* 03 share — hype levels + platform, all tags/link inside the message */
// full post body per hype level; {U}=unicorn mafia, {S}=sponsors, {P}=people, {L}=link
const BODY = {
  chill:    t=>`Honored to be invited to the ${t.AX} x ${t.AN} Hackathon, powered by ${t.U}. Got wireframed alongside Axie and ready to build something great. #Axie\n\nHuge thanks to our sponsors ${t.S} and the people who made this happen ${t.P}. Special thanks to ${t.H} for hosting us.\n\n${t.L}`,
  hyped:    t=>`IT'S ON. Just got invited to the ${t.AX} x ${t.AN} Hackathon, powered by ${t.U} — and got wireframed next to Axie while I'm at it. Let's build something legendary. #Axie\n\nPowered by our incredible sponsors ${t.S}, and made real by ${t.P}. Special thanks to ${t.H} for hosting us.\n\n${t.L}`,
  unhinged: t=>`Wired in. Soldered up. Axie riding shotgun. I just scored an invite to the ${t.AX} x ${t.AN} Hackathon powered by ${t.U} and I'm all the way in. Come build the impossible with us. #Axie\n\nMassive shoutout to our sponsors ${t.S} and the crew who made it happen ${t.P}. Special thanks to ${t.H} for hosting us.\n\n${t.L}`
};
// per-platform handles + link. AX=AxioMeta, AN=Anthropic, U=Unicorn Mafia, S=sponsors, P=people, L=link
const PLAT = {
  li: { AX:'@axiometa', AN:'@anthropicresearch', U:'@unicorn-mafia', S:'@modal-labs @linkup-platform @elevenlabs @bambulab', P:'@fatemaalkhalifa @povilasdumcius @lamis-mukta', H:'@oliland from @Halkin', L:'axiometa.io' },
  x:  { AX:'@axiometa', AN:'@AnthropicAI', U:'@unicorn_mafia', S:'@modal @BambulabGlobal linkup', P:'@fatemallk @dumciusP', H:'@oliland from @Halkin', L:'https://t.co/PkQtAArwF1' }
};
let hype='hyped', plat='li';
function buildMsg(){ $('#caption').value = BODY[hype](PLAT[plat]); }
function setActive(container,attr,val){ $(container).querySelectorAll('.hype-btn').forEach(x=>x.classList.toggle('active', x.dataset[attr]===val)); }
$('#hypeSel').addEventListener('click',e=>{ const b=e.target.closest('.hype-btn'); if(!b)return; hype=b.dataset.hype; setActive('#hypeSel','hype',hype); buildMsg(); });
$('#platSel').addEventListener('click',e=>{ const b=e.target.closest('.hype-btn'); if(!b)return; plat=b.dataset.plat; setActive('#platSel','plat',plat); buildMsg(); });
function setPlat(p){ if(plat!==p){ plat=p; setActive('#platSel','plat',p); buildMsg(); } }
$('#tagNote').textContent='Pick a platform to load its handles + link. Everything is in the box — edit before posting if you like.';
buildMsg();

async function ensureBlob(){ if(!composedBlob) drawComposite('#composer2'); return composedBlob; }
function dl(blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='wireframe-axie.png'; a.click(); }

$('#downloadBtn').onclick=async ()=>{ const b=await ensureBlob(); if(b){ dl(b); toast('Downloaded'); } };
$('#nativeShare').onclick=async ()=>{
  const blob=await ensureBlob(); if(!blob) return;
  const file=new File([blob],'wireframe-axie.png',{type:'image/png'});
  if(navigator.canShare && navigator.canShare({files:[file]})){ try{ await navigator.share({files:[file], text:$('#caption').value}); }catch(e){} }
  else toast('Device share not supported — use the buttons');
};
$('#shareX').onclick=async ()=>{
  setPlat('x');
  const blob=await ensureBlob(); if(blob) dl(blob);
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent($('#caption').value),'_blank');
  toast('Image downloaded — attach to post');
};
$('#shareLinkedIn').onclick=async ()=>{
  setPlat('li');
  const blob=await ensureBlob(); if(blob) dl(blob);
  navigator.clipboard && navigator.clipboard.writeText($('#caption').value).catch(()=>{});
  window.open('https://www.linkedin.com/feed/?shareActive=true','_blank');
  toast('Post copied + image downloaded — paste and attach');
};
$('#startOver').onclick=()=>{
  uploadedFile=null; resultImage=null; composedBlob=null; fi.value='';
  $('#uploadPreview').style.display='none';
  $('#composer2').style.display='none';
  $('#ph2').style.display='flex';
  $('#genBtn').disabled=true;
  ['#downloadBtn','#nativeShare','#shareLinkedIn','#shareX'].forEach(s=>$(s).disabled=true);
  const a=$('#s1status'),b=$('#s2status'); a.textContent='STATUS // AWAITING INPUT'; b.textContent='STATUS // AWAITING SOURCE'; a.classList.remove('on'); b.classList.remove('on');
  window.scrollTo({top:0,behavior:'smooth'});
};
