'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const contact = document.getElementById('contact-dialog');
const viewer = document.getElementById('photo-dialog');
const photos = [...document.querySelectorAll('[data-photo]')];
let photoIndex = 0;
function openDialog(dialog, opener) { dialog._opener = opener; dialog.showModal(); dialog.scrollTop = 0; }
function closeDialog(dialog) { dialog.close(); }
for (const dialog of [contact, viewer]) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => dialog._opener?.focus({preventScroll:true}));
}
contact.addEventListener('click', event => {
  if (event.target !== contact) return;
  const r = contact.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(contact);
});
document.querySelectorAll('[data-contact]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); contact.querySelector('.contact-status').textContent = ''; openDialog(contact, link);
}));
document.querySelectorAll('.copy-number').forEach(button => button.addEventListener('click', async () => {
  const status = button.closest('section,dialog').querySelector('.contact-status');
  try { await navigator.clipboard.writeText('13543052633'); status.textContent = '号码已复制：13543052633'; }
  catch { status.textContent = '请选中号码手动复制：13543052633'; }
}));
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const source = photos[photoIndex].querySelector('img');
  const image = viewer.querySelector('figure img');
  image.classList.remove('changing');
  image.src = source.getAttribute('src'); image.alt = source.alt;
  image.style.setProperty('--viewer-tone', getComputedStyle(source).filter);
  viewer.querySelector('figcaption').textContent = source.alt;
  viewer.querySelector('.photo-count').textContent = `${photoIndex + 1} / ${photos.length}`;
  if (!reduceMotion.matches) { void image.offsetWidth; image.classList.add('changing'); }
}
photos.forEach((button,index) => button.addEventListener('click', () => {
  showPhoto(index); openDialog(viewer,button);
}));
viewer.querySelector('.photo-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
viewer.querySelector('.photo-next').addEventListener('click', () => showPhoto(photoIndex + 1));
viewer.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(photoIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(photoIndex + 1); }
});
viewer.addEventListener('click', e => { if (e.target === viewer) closeDialog(viewer); });
// Animate only the answer being opened or closed; preserve native keyboard behavior.
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('.answer');
  let motion;
  summary.addEventListener('click', event => {
    if (reduceMotion.matches || !answer.animate) return;
    event.preventDefault();
    if (motion) return;
    const opening = !details.open;
    if (opening) details.open = true;
    const height = answer.getBoundingClientRect().height;
    motion = answer.animate([{height: opening ? '0px' : `${height}px`, opacity: opening ? 0 : 1}, {height: opening ? `${height}px` : '0px', opacity: opening ? 1 : 0}], {duration:220,easing:'ease-out'});
    motion.onfinish = () => { if (!opening) details.open = false; motion = null; };
    motion.oncancel = () => { motion = null; };
  });
});

// Autonomous silver mist. A low-resolution, domain-warped field keeps the motion soft.
(() => {
  const hero=document.querySelector('.hero');
  const canvas=hero?.querySelector('.fluid-light');
  const ctx=canvas?.getContext('2d',{alpha:false});
  if(!ctx)return;
  const field=document.createElement('canvas');
  const fieldCtx=field.getContext('2d',{alpha:false});
  if(!fieldCtx)return;
  let width=1,height=1,frame=0,visible=true,last=0,elapsed=0,pixels;
  const fract=x=>x-Math.floor(x);
  const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
  const mix=(a,b,t)=>a+(b-a)*t;
  function noise(x,y){
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
    const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
    return mix(mix(hash(ix,iy),hash(ix+1,iy),ux),mix(hash(ix,iy+1),hash(ix+1,iy+1),ux),uy);
  }
  function fbm(x,y){let v=0,a=.56;for(let k=0;k<3;k++){v+=noise(x,y)*a;const xx=x*1.65-y*.85+3.1;y=x*.85+y*1.65+1.7;x=xx;a*=.5;}return v;}
  function draw(t){
    const fw=field.width,fh=field.height,aspect=width/height;
    const data=pixels.data;
    for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){
      const u=x/(fw-1),v=y/(fh-1),px=(u-.5)*aspect,py=v-.46;
      const qx=fbm(px*1.45+t*.12,py*1.45-t*.08);
      const qy=fbm(px*1.45+7.2-t*.09,py*1.45+3.1+t*.11);
      const flow=fbm(px*1.9+qx*2.8+t*.13,py*1.9+qy*2.8-t*.1);
      const fold=Math.pow(Math.max(0,1-Math.abs(flow-.48)*3.8),2.5);
      const mist=Math.max(0,(flow-.19)*.28);
      const envelope=Math.exp(-px*px*.95-py*py*2.5);
      const edge=Math.pow(Math.max(0,Math.sin(Math.PI*u)*Math.sin(Math.PI*v)),.5);
      const light=(mist+fold*.19)*envelope*edge;
      const shade=Math.min(74,Math.max(0,light*255));
      const i=(y*fw+x)*4;data[i]=shade;data[i+1]=shade;data[i+2]=shade;data[i+3]=255;
    }
    fieldCtx.putImageData(pixels,0,0);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(field,0,0,width,height);
  }
  function paint(now){
    frame=0;if(!visible||document.hidden)return;
    if(last===0||now-last>=1000/24){
      if(last)elapsed+=Math.min(now-last,100);
      last=now;draw(reduceMotion.matches?0:elapsed*.00012);
    }
    if(!reduceMotion.matches)frame=requestAnimationFrame(paint);
  }
  function wake(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(paint);}}
  function pause(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  function resize(){const r=hero.getBoundingClientRect();width=Math.max(1,Math.round(r.width));height=Math.max(1,Math.round(r.height));canvas.width=width;canvas.height=height;field.width=140;field.height=Math.max(64,Math.round(140*height/width));pixels=fieldCtx.createImageData(field.width,field.height);draw(reduceMotion.matches?0:elapsed*.00012);wake();}
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else pause();}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else wake();});
  reduceMotion.addEventListener('change',()=>{pause();draw(reduceMotion.matches?0:elapsed*.00012);wake();});
  resize();
})();
