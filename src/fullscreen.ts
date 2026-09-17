import { lenis } from './scroll.ts';

/** Native fullscreen when available, an accessible viewport overlay otherwise. */
export class FullscreenPreview {
  private overlay: HTMLDivElement | null = null;
  private placeholder: HTMLDivElement | null = null;
  private content: HTMLElement | null = null;
  private inertElements: Array<[HTMLElement, boolean]> = [];
  private originalOverflow = '';
  private nativeEntered = false;
  private onClosed: (() => void) | null = null;
  private focusBefore: HTMLElement | null = null;

  open(content: HTMLElement, title: string, onClosed: () => void) {
    if (this.overlay) return;
    this.content = content;
    this.onClosed = onClosed;
    this.focusBefore = document.activeElement as HTMLElement;
    this.placeholder = document.createElement('div');
    this.placeholder.style.height = `${content.getBoundingClientRect().height}px`;
    content.before(this.placeholder);
    this.overlay = document.createElement('div');
    this.overlay.className = 'preview-fullscreen';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', title);
    const surface = document.createElement('div');
    surface.className = 'fullscreen-surface';
    surface.append(content);
    this.overlay.append(surface);
    for (const child of document.body.children) {
      if (child instanceof HTMLElement) { this.inertElements.push([child, child.inert]); child.inert = true; }
    }
    this.originalOverflow = document.body.style.overflow;
    lenis.stop();
    document.body.style.overflow = 'hidden';
    document.body.append(this.overlay);
    this.overlay.addEventListener('keydown', this.keydown);
    document.addEventListener('fullscreenchange', this.fullscreenChange);
    const overlay = this.overlay;
    content.querySelector<HTMLButtonElement>('[data-fullscreen-close]')?.focus({ preventScroll: true });
    // Preserve the click's activation context; the overlay never depends on API support.
    if (overlay.requestFullscreen) {
      void overlay.requestFullscreen().then(async () => {
        if (this.overlay !== overlay) {
          if (document.fullscreenElement === overlay) await document.exitFullscreen().catch(() => {});
          return;
        }
        this.nativeEntered = true;
        const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
        if (window.matchMedia('(max-width: 800px), (pointer: coarse)').matches) {
          try { await orientation?.lock?.('landscape'); } catch { /* CSS rotates the surface on portrait-only browsers. */ }
          if (this.overlay !== overlay) orientation?.unlock?.();
        }
      }).catch(() => { /* The viewport overlay remains fully interactive. */ });
    }
  }

  private fullscreenChange = () => {
    if (document.fullscreenElement === this.overlay) this.nativeEntered = true;
    else if (this.nativeEntered && this.overlay) this.close();
  };

  private keydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key !== 'Tab' || !this.overlay) return;
    const focusable = [...this.overlay.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], select, [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  close() {
    if (!this.overlay) return;
    const overlay = this.overlay;
    this.overlay = null;
    document.removeEventListener('fullscreenchange', this.fullscreenChange);
    if (document.fullscreenElement === overlay) void document.exitFullscreen().catch(() => {});
    try { screen.orientation?.unlock?.(); } catch { /* Orientation API is optional. */ }
    if (this.content && this.placeholder) this.placeholder.replaceWith(this.content);
    overlay.remove();
    for (const [element, inert] of this.inertElements) element.inert = inert;
    this.inertElements = [];
    document.body.style.overflow = this.originalOverflow;
    lenis.start();
    this.nativeEntered = false;
    this.onClosed?.();
    const focus = this.content?.querySelector<HTMLElement>('[data-fullscreen-open]') ?? this.focusBefore;
    focus?.focus({ preventScroll: true });
    this.onClosed = null;
    this.content = null;
  }
}
