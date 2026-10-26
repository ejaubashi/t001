// Masonry stays in document order. Each visual column has its own damped
// offset; native scroll, keyboard focus and click targets stay authoritative.
export function mountElasticGallery(root) {
  if (!root) return () => {};
  const grid = root.querySelector('.elastic-grid');
  const cards = [...grid.querySelectorAll('.elastic-card')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let layout = [], columns = 3, springs = [], frame = 0, disposed = false;
  let lastY = scrollY, lastTime = performance.now();
  let velocity = 0;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const enabled = () => innerWidth >= 650 && !reduced.matches;

  function place() {
    if (disposed) return;
    columns = innerWidth < 650 ? 1 : innerWidth < 1100 ? 2 : 3;
    const gap = innerWidth < 650 ? 30 : 28;
    const width = (grid.clientWidth - gap * (columns - 1)) / columns;
    const heights = Array(columns).fill(0);
    springs = Array.from({length: columns}, () => ({offset: 0, speed: 0}));
    layout = cards.map((card, index) => {
      // Round-robin order gives the top row 01, 02, 03 while retaining a
      // predictable keyboard/screen-reader sequence in the original DOM.
      const column = index % columns;
      card.style.width = `${width}px`;
      const item = {card, column, x: column * (width + gap), y: heights[column], height: card.offsetHeight};
      heights[column] += item.height + gap;
      card.dataset.column = String(column);
      card.style.transform = `translate3d(${item.x}px,${item.y}px,0)`;
      return item;
    });
    grid.style.height = `${Math.max(...heights) - gap}px`;
    lastY = scrollY;
    velocity = 0;
    requestTick();
  }
  function tick(time) {
    frame = 0;
    if (disposed) return;
    const step = clamp((time - lastTime) / 16.667, .5, 2);
    lastTime = time;
    const dy = scrollY - lastY;
    lastY = scrollY;
    velocity += (dy / step - velocity) * .24;
    const moving = enabled() && !document.body.classList.contains('project-open');
    const factors = columns === 2 ? [1.1, -.65] : [1.25, -.7, .55];
    let unsettled = Math.abs(velocity) > .08;
    springs.forEach((spring, column) => {
      const target = moving ? clamp(velocity * factors[column] * 1.9, -65, 65) : 0;
      spring.speed += (target - spring.offset) * .065 * step;
      spring.speed *= Math.pow(.77, step);
      spring.offset = clamp(spring.offset + spring.speed * step,-65,65);
      if (Math.abs(spring.offset) < .02 && Math.abs(spring.speed) < .02 && Math.abs(target) < .02) spring.offset = spring.speed = 0;
      if (Math.abs(spring.offset) > .02 || Math.abs(spring.speed) > .02) unsettled = true;
    });
    for (const item of layout) {
      const offset = enabled() ? springs[item.column].offset : 0;
      item.card.style.transform = `translate3d(${item.x}px,${(item.y + offset).toFixed(2)}px,0)`;
    }
    root.dataset.motion = moving && unsettled ? 'moving' : 'rest';
    if (unsettled) requestTick();
  }
  function requestTick() { if (!frame && !disposed) frame = requestAnimationFrame(tick); }
  function onScroll() { requestTick(); }
  function onPreference() { place(); }
  const resize = new ResizeObserver(place);
  resize.observe(grid);
  window.addEventListener('scroll', onScroll, {passive: true});
  reduced.addEventListener('change', onPreference);
  document.fonts.ready.then(() => { if (!disposed) place(); });

  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-revealed');
      reveal.unobserve(entry.target);
    }
  }, {threshold: .03, rootMargin: '0px 0px 40px 0px'});
  cards.forEach(card => {
    if (reduced.matches) card.classList.add('is-revealed'); else reveal.observe(card);
    const image = card.querySelector('img');
    const tint = () => {
      try {
        if (!image.complete || !image.naturalWidth) return;
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');ctx.drawImage(image,0,0,1,1);
        const [r,g,b] = ctx.getImageData(0,0,1,1).data;
        root.style.setProperty('--elastic-glow',`rgb(${r} ${g} ${b} / .16)`);
      } catch { /* A neutral ambient colour is the normal fallback. */ }
    };
    card.addEventListener('pointerenter', tint);
    card.addEventListener('focus', tint);
    card.addEventListener('pointermove', event => {
      if (!enabled()) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--cover-x',`${(x * 5).toFixed(2)}px`);
      card.style.setProperty('--cover-y',`${(y * 5).toFixed(2)}px`);
    }, {passive:true});
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--cover-x','0px');card.style.setProperty('--cover-y','0px');
    });
    card.addEventListener('focus', () => { card.classList.add('is-revealed'); });
  });
  place();
  return () => {
    disposed = true;cancelAnimationFrame(frame);resize.disconnect();reveal.disconnect();
    window.removeEventListener('scroll',onScroll);reduced.removeEventListener('change',onPreference);
  };
}
