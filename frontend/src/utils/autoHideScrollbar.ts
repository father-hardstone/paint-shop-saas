/** Adds `is-scrolling` to <html> while anything on the page is scrolling, and removes it shortly after. */
export function setupAutoHideScrollbar(delayMs = 900): void {
  const root = document.documentElement;
  let timer: number | undefined;
  const onScroll = () => {
    root.classList.add('is-scrolling');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => root.classList.remove('is-scrolling'), delayMs);
  };
  // Scroll events don't bubble, so listen in the capture phase to catch inner scroll areas too.
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('wheel', onScroll, { passive: true });
}
