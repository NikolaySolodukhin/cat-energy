const navMain = document.querySelector('.main-nav');
const navToggle = document.querySelector('.main-nav__toggle');

navMain.classList.remove('main-nav--nojs');

navToggle.addEventListener('click', () => {
  if (navMain.classList.contains('main-nav--open')) {
    navMain.classList.remove('main-nav--open');
  } else {
    navMain.classList.add('main-nav--open');
  }
});
