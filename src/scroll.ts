import Lenis from 'lenis';

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: !reducedMotion.matches });
let frame = 0;
function raf(time: number) {
  lenis.raf(time);
  frame = requestAnimationFrame(raf);
}
frame = requestAnimationFrame(raf);
function motionChange() { lenis.options.smoothWheel = !reducedMotion.matches; }
reducedMotion.addEventListener('change', motionChange);
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(frame);
  reducedMotion.removeEventListener('change', motionChange);
  lenis.destroy();
});
