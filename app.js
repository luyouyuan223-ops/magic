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
