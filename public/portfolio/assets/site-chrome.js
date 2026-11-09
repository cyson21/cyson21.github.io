const button = document.querySelector('.site-chrome-toggle');
const menu = document.querySelector('#site-chrome-menu');
if (button && menu) {
  const mobile = matchMedia('(max-width: 740px)');
  const setOpen = open => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '주 메뉴 닫기' : '주 메뉴 열기');
    button.textContent = open ? '닫기' : '메뉴';
    menu.hidden = mobile.matches && !open;
  };
  const reset = () => { button.hidden = !mobile.matches; setOpen(false); };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { setOpen(false); button.focus(); } });
  mobile.addEventListener('change', reset);
  reset();
}
