const MIN_VISIBLE_MS = 900;
const FADE_OUT_MS = 400;

const startedAt = performance.now();

document.documentElement.classList.add('js');

const loader = document.querySelector<HTMLElement>('.page-loader');

if (loader) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove();
  } else {
    let pageLoaded = document.readyState === 'complete';
    let minimumElapsed = false;
    let hidden = false;

    const hide = (): void => {
      if (hidden || !pageLoaded || !minimumElapsed) return;
      hidden = true;
      loader.classList.add('is-hidden');
      window.setTimeout(() => loader.remove(), FADE_OUT_MS);
    };

    if (!pageLoaded) {
      window.addEventListener(
        'load',
        () => {
          pageLoaded = true;
          hide();
        },
        { once: true },
      );
    }

    const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
    window.setTimeout(() => {
      minimumElapsed = true;
      hide();
    }, remaining);
  }
}
