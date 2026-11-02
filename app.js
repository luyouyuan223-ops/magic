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

// Silver fluid light: spring-following fog and a soft ribbon, driven by pointer position.
(() => {
  const hero = document.querySelector('.hero');
  const canvas = hero?.querySelector('.fluid-light');
  const ctx = canvas?.getContext('2d', { alpha: false });
  if (!hero || !ctx) return;
  let width = 1, height = 1, dpr = 1, frame = 0, visible = true, active = false;
  let lastMove = performance.now(), previousTime = 0;
  const target = {x: 0, y: 0};
  const chain = Array.from({length: 16}, () => ({x: 0, y: 0}));
  function fog(x,y,radius,strength,stretch=1) {
    ctx.save(); ctx.translate(x,y); ctx.scale(stretch,1);
    const g=ctx.createRadialGradient(0,0,0,0,0,radius);
    g.addColorStop(0,`rgba(225,235,245,${strength})`);
    g.addColorStop(.25,`rgba(180,198,216,${strength*.64})`);
    g.addColorStop(.58,`rgba(140,157,175,${strength*.22})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();
  }
  function paint(time) {
    frame=0;
    if (!visible || document.hidden) return;
    const dt=Math.min(2.5,(time-(previousTime||time))/16.67 || 1); previousTime=time;
    const moving=!reduceMotion.matches;
    const follow=1-Math.pow(.86,dt);
    let displacement=0;
    chain.forEach((p,i)=>{
      const lead=i ? chain[i-1] : target;
      const dx=lead.x-p.x,dy=lead.y-p.y;
      displacement+=Math.abs(dx)+Math.abs(dy);
      if(moving){p.x+=dx*follow;p.y+=dy*follow;}else{p.x=lead.x;p.y=lead.y;}
    });
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation='lighter';
    const radius=Math.min(350,Math.max(190,width*.27));
    const head=chain[0],tail=chain[11];
    fog(head.x,head.y,radius,active ? .25 : .15,1.2);
    fog(tail.x,tail.y,radius*.85,active ? .13 : .08,.8);
    const age=Math.min(1,(time-lastMove)/1600);
    const bend=(1-age)*Math.sin(time*.0018)*radius*.15;
    fog(chain[5].x+radius*.22,chain[5].y-radius*.14+bend,radius*.65,.11,1.5);
    fog(chain[9].x-radius*.2,chain[9].y+radius*.12-bend,radius*.7,.09,.65);
    if (displacement>8 && moving) {
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='rgba(215,230,245,.26)';ctx.shadowBlur=25;
      const grad=ctx.createLinearGradient(tail.x,tail.y,head.x+.01,head.y+.01);
      grad.addColorStop(0,'rgba(160,180,200,0)');grad.addColorStop(.55,'rgba(190,207,224,.055)');grad.addColorStop(1,'rgba(225,235,245,.16)');
      ctx.strokeStyle=grad;ctx.lineWidth=Math.min(32,radius*.1);ctx.beginPath();ctx.moveTo(chain[15].x,chain[15].y);
      for(let i=14;i>0;i--){const p=chain[i],next=chain[i-1];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);}ctx.lineTo(head.x,head.y);ctx.stroke();ctx.restore();
    }
    ctx.globalCompositeOperation='source-over';
    if(moving && (displacement>1 || (active && time-lastMove<1700))) frame=requestAnimationFrame(paint);
  }
  function wake(){if(!frame && visible && !document.hidden)frame=requestAnimationFrame(paint);}
  function resize(){
    const rect=hero.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    if(!active){target.x=width*.5;target.y=height*.43;chain.forEach(p=>{p.x=target.x;p.y=target.y;});}wake();
  }
  hero.addEventListener('pointermove',e=>{
    const r=hero.getBoundingClientRect();target.x=e.clientX-r.left;target.y=e.clientY-r.top;
    active=true;lastMove=performance.now();wake();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{active=false;target.x=width*.5;target.y=height*.43;lastMove=performance.now();wake();});
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){previousTime=0;wake();}else if(frame){cancelAnimationFrame(frame);frame=0;}}).observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else{previousTime=0;wake();}});
  reduceMotion.addEventListener('change',wake);
  resize();
})();
