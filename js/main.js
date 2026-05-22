/* ============================================================
   MAIN — page-agnostic orchestration
   - scroll progress bar
   - reveal-on-scroll IntersectionObserver
   - smooth in-page anchor scrolling with nav offset
   - modal close handlers (used on index.html)
============================================================ */
(function () {

  // -----------------------------------------------------------
  //  progress bar
  // -----------------------------------------------------------
  const progressEl = document.getElementById('navProgress');
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progressEl) progressEl.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // -----------------------------------------------------------
  //  smooth scroll w/ nav offset — only for SAME-PAGE anchors
  // -----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      const navH = 64;
      const y = el.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // also handle anchor in URL on page load (after fonts/layout settle)
  if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const navH = 64;
        const y = el.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 250);
  }

  // -----------------------------------------------------------
  //  reveal on scroll
  // -----------------------------------------------------------
  const revealTargets = document.querySelectorAll(
    '.section__title, .prose, .embed, .bc, .formal, .gallery, .nature, .callout, .dim-intuition, ' +
    '.tda-cards, .metrics, .net-types, .cases, .ws, .why-grid, .section__sub-title, ' +
    '.branch-hero__toc, .branch-next__cards'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  if (revealTargets.length) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(el => revealObs.observe(el));
  }

  // -----------------------------------------------------------
  //  MODAL — Sistemas Complejos explainer (index.html only)
  // -----------------------------------------------------------
  const modal = document.getElementById('modalSC');
  if (modal) {
    modal.addEventListener('click', (ev) => {
      if (ev.target.hasAttribute('data-close')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

})();
