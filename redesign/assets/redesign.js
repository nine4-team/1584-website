const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');

if (toggle && menu) {
  const setMenuOpen = (isOpen, returnFocus = false) => {
    menu.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);

    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) setMenuOpen(false, true);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && menu.classList.contains('open')) setMenuOpen(false);
  });
}
