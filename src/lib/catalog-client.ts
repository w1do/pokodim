export function applyCatalogFilters(): void {
  const params = new URLSearchParams(window.location.search);
  const tool = params.get('tool') ?? '';
  const level = params.get('level') ?? '';
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const query = (input?.value ?? '').trim().toLowerCase();
  let visible = 0;

  document.querySelectorAll<HTMLElement>('[data-material-card]').forEach((card) => {
    const haystack = (card.dataset.search ?? card.textContent ?? '').toLowerCase();
    const shown =
      (!tool || card.dataset.tool === tool) &&
      (!level || card.dataset.level === level) &&
      (!query || haystack.includes(query));
    card.hidden = !shown;
    if (shown) visible += 1;
  });

  const empty = document.querySelector<HTMLElement>('[data-empty-message]');
  if (empty) empty.hidden = visible > 0;
}
