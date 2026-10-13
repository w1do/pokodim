const SELECTOR = 'img.instruction-card__image, img.instruction-hero__image';

document.documentElement.classList.add('js');

function markLoaded(img: HTMLImageElement): void {
  img.classList.add('is-loaded');
}

for (const img of document.querySelectorAll<HTMLImageElement>(SELECTOR)) {
  if (img.complete && img.naturalWidth > 0) {
    markLoaded(img);
  } else {
    img.addEventListener('load', () => markLoaded(img), { once: true });
    img.addEventListener('error', () => markLoaded(img), { once: true });
  }
}
