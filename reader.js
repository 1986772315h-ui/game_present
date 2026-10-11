(() => {
  document.documentElement.classList.add('js');
  const headings = [...document.querySelectorAll('article h2, article h3')];
  const links = [...document.querySelectorAll('nav a')];
  const menu = document.querySelector('.mobile-navigation');
  const summary = menu.querySelector('summary');
  const currentLabel = menu.querySelector('.current-chapter');
  let activeId;
  const setCurrent = heading => {
    const section = heading?.dataset.section;
    const id = heading?.id;
    if (activeId === id) return;
    activeId = id;
    document.querySelectorAll('.nav-group').forEach(group => group.classList.toggle('is-current', group.dataset.section === section));
    links.forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    currentLabel.textContent = section ? document.querySelector(`.chapter-link[href="#${section}"]`).textContent.trim().replace(/^(\d{2})/, '$1 · ') : '阅读目录';
  };
  const update = () => {
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reading-offset')) || 32;
    setCurrent(headings.filter(h => h.getBoundingClientRect().top <= offset + 24).at(-1));
  };
  const observer = new IntersectionObserver(update, {rootMargin:'-8% 0px -65% 0px',threshold:[0,1]});
  headings.forEach(h => observer.observe(h));
  // A small reading line sentinel also catches headings crossing the sticky menu.
  const crossing = new IntersectionObserver(update,{rootMargin:'0px 0px -90% 0px',threshold:0});
  headings.forEach(h => crossing.observe(h));
  const moveToHash = () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target?.matches('h2,h3')) setCurrent(target);
  };
  links.forEach(link => link.addEventListener('click', () => {
    menu.open = false;
    const target = document.getElementById(link.hash.slice(1));
    target?.focus({preventScroll:true});
    if (target) setCurrent(target);
  }));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {menu.open=false;summary.focus();}
  });
  window.addEventListener('hashchange', moveToHash);
  window.addEventListener('resize', update);
  window.addEventListener('pageshow', update);
  new ResizeObserver(update).observe(document.querySelector('article'));
  moveToHash();
  if (!location.hash) update();
})();
