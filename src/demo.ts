import { copy, type Language } from './i18n.ts';
import { icon } from './icons.ts';
import { layouts, screenLabel, screens, transition, type DemoState, type Screen } from './screens.ts';
import { loadScreen, previewPath } from './image-loader.ts';
import { shuffleScreens } from './slideshow.ts';
import { FullscreenPreview } from './fullscreen.ts';

export class LauncherDemo {
  readonly element = document.createElement('div');
  state: DemoState = { screen: 'Home', previous: 'Home', selected: false };
  language: Language;
  private request = 0;
  private ready = false;
  private loading = false;
  private failed: { state: DemoState; language: Language } | null = null;
  private opener = '';
  private fullscreen = new FullscreenPreview();
  private expanded = false;
  private mobile = window.matchMedia('(max-width: 800px), (pointer: coarse) and (max-width: 1100px)');
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private inView = false;
  private observer: IntersectionObserver;
  private preloadObserver: IntersectionObserver;
  private nearby = false;
  private preloadTimer = 0;
  private preloadGeneration = 0;
  private displayedPath = '';
  private displayedScreen: Screen = 'Home';
  private slideTimer = 0;
  private slideRequest = 0;
  private slideHistory: Screen[] = ['Home'];
  private slideIndex = 0;
  private slideQueue: Screen[] = shuffleScreens('Home').filter(screen => screen !== 'Home');
  private slidePaused = false;
  private slideError = false;
  private touchStart: { x: number; y: number } | null = null;

  get inlineMobile() { return this.mobile.matches && !this.expanded; }
  private get slideScreen() { return this.slideHistory[this.slideIndex]; }

  constructor(language: Language) {
    this.language = language;
    this.element.className = 'launcher-demo';
    this.slidePaused = this.reducedMotion.matches;
    this.element.addEventListener('click', event => {
      const target = event.target as Element;
      if (target.closest('[data-fullscreen-open]')) { this.openFullscreen(); return; }
      if (target.closest('[data-fullscreen-close]')) { this.fullscreen.close(); return; }
      if (target.closest('[data-slide-next]')) { void this.changeSlide(1, true); return; }
      if (target.closest('[data-slide-previous]')) { void this.changeSlide(-1, true); return; }
      if (target.closest('[data-slide-pause]')) {
        this.slidePaused = !this.slidePaused;
        this.render();
        this.element.querySelector<HTMLElement>('[data-slide-pause]')?.focus({preventScroll:true});
        this.scheduleSlide();
        return;
      }
      const button = target.closest<HTMLButtonElement>('button[data-target]');
      if (button && !this.inlineMobile) {
        if (button.dataset.target === 'New-Instances') this.opener = button.dataset.key ?? '';
        void this.go(button.dataset.target as Screen | 'close');
      }
      if (target.closest('[data-retry]') && this.failed) {
        if (this.failed.language !== this.language) this.element.dispatchEvent(new CustomEvent('retry-language', {detail:this.failed.language}));
        else void this.show(this.failed.state, this.failed.language);
      }
    });
    this.element.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !this.inlineMobile && this.state.screen === 'New-Instances') {
        event.preventDefault();
        void this.go('close');
      }
      if (this.inlineMobile && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        void this.changeSlide(event.key === 'ArrowLeft' ? -1 : 1, true);
      }
    });
    this.element.addEventListener('pointerdown', event => {
      if (this.inlineMobile && (event.target as Element).closest('.demo-stage')) this.touchStart = {x:event.clientX,y:event.clientY};
    });
    this.element.addEventListener('pointerup', event => {
      if (!this.touchStart) return;
      const dx = event.clientX - this.touchStart.x;
      const dy = event.clientY - this.touchStart.y;
      this.touchStart = null;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.4) void this.changeSlide(dx < 0 ? 1 : -1, true);
    });
    this.element.addEventListener('pointercancel', () => { this.touchStart = null; });
    this.mobile.addEventListener('change', this.viewportChange);
    this.reducedMotion.addEventListener('change', this.motionChange);
    document.addEventListener('visibilitychange', this.visibilityChange);
    this.observer = new IntersectionObserver(entries => {
      this.inView = entries[0]?.isIntersecting ?? false;
      this.scheduleSlide();
    }, {threshold:0.2});
    this.observer.observe(this.element);
    this.preloadObserver = new IntersectionObserver(entries => {
      this.nearby = entries[0]?.isIntersecting ?? false;
      this.schedulePreload();
    }, { rootMargin: '300px' });
    this.preloadObserver.observe(this.element);
    this.render();
    void this.show(this.state, language);
  }

  private viewportChange = () => { this.slideRequest++; this.render(); void this.show(this.state, this.language); };
  private motionChange = () => { if (this.reducedMotion.matches) this.slidePaused = true; this.render(); this.scheduleSlide(); };
  private visibilityChange = () => { this.scheduleSlide(); this.schedulePreload(); };

  destroy() {
    this.fullscreen.close();
    window.clearTimeout(this.slideTimer);
    this.observer.disconnect();
    this.preloadObserver.disconnect();
    window.clearTimeout(this.preloadTimer);
    this.preloadGeneration++;
    this.mobile.removeEventListener('change', this.viewportChange);
    this.reducedMotion.removeEventListener('change', this.motionChange);
    document.removeEventListener('visibilitychange', this.visibilityChange);
    this.request++;
    this.slideRequest++;
  }

  async setLanguage(language: Language): Promise<boolean> { return this.show(this.state, language); }

  private openFullscreen() {
    if (this.expanded || !this.ready) return;
    this.expanded = true;
    this.slideRequest++;
    window.clearTimeout(this.slideTimer);
    // Keep the normal-flow height before the controller moves the element.
    this.fullscreen.open(this.element, copy[this.language].interactive, () => {
      this.expanded = false;
      this.render();
      void this.show(this.state, this.language);
    });
    this.render();
    this.element.querySelector<HTMLElement>('[data-fullscreen-close]')?.focus({preventScroll:true});
    void this.show(this.state, this.language);
  }

  private async go(target: Screen | 'close') {
    if (this.state.screen === 'New-Instances' && target !== 'close') return;
    await this.show(transition(this.state, target), this.language);
  }

  private async show(next: DemoState, language: Language): Promise<boolean> {
    const token = ++this.request;
    this.slideRequest++;
    const oldScreen = this.state.screen;
    const active = document.activeElement as HTMLElement | null;
    const focusKey = this.element.contains(active) ? active?.dataset.key : undefined;
    this.loading = true;
    this.preloadGeneration++;
    window.clearTimeout(this.preloadTimer);
    this.failed = null;
    this.updateStatus();
    try {
      const visible = this.inlineMobile ? this.slideScreen : next.screen;
      const size = this.inlineMobile ? 'mobile' : 'full';
      await loadScreen(visible, language, size);
      if (token !== this.request) return false;
      this.state = next;
      this.language = language;
      this.displayedPath = previewPath(visible, language, size);
      this.displayedScreen = visible;
      this.ready = true;
      this.loading = false;
      this.render();
      let restoreKey = focusKey;
      if (next.screen === 'New-Instances' && oldScreen !== next.screen) restoreKey = 'close';
      else if (oldScreen === 'New-Instances') restoreKey = this.opener;
      if (restoreKey) this.element.querySelector<HTMLElement>(`[data-key="${restoreKey}"]`)?.focus({preventScroll:true});
      this.schedulePreload();
      this.scheduleSlide();
      return true;
    } catch {
      if (token !== this.request) return false;
      this.loading = false;
      this.failed = {state:next,language};
      this.updateStatus();
      return false;
    }
  }

  private schedulePreload() {
    window.clearTimeout(this.preloadTimer);
    const generation = ++this.preloadGeneration;
    if (!this.ready || this.loading || !this.nearby || document.hidden) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
    const language = this.language;
    const size = this.inlineMobile ? 'mobile' : 'full';
    const pending = this.inlineMobile
      ? [this.slideHistory[this.slideIndex + 1] ?? this.slideQueue[0]].filter((screen): screen is Screen => !!screen)
      : ['Library', 'Library_Pressed-Instances', 'Discover', 'S-General', ...screens] as Screen[];
    const queue = [...new Set(pending)].filter(screen => screen !== this.displayedScreen);
    const next = async () => {
      if (generation !== this.preloadGeneration) return;
      const screen = queue.shift();
      if (!screen) return;
      try { await loadScreen(screen, language, size, 'low'); } catch { /* A foreground click can retry. */ }
      if (generation === this.preloadGeneration) this.preloadTimer = window.setTimeout(() => { void next(); }, 250);
    };
    this.preloadTimer = window.setTimeout(() => { void next(); }, 300);
  }

  private scheduleSlide() {
    window.clearTimeout(this.slideTimer);
    if (this.inlineMobile && this.ready && this.inView && !this.slidePaused && !document.hidden && !this.loading) {
      this.slideTimer = window.setTimeout(() => { void this.changeSlide(1); }, 5000);
    }
  }

  private async changeSlide(direction: 1 | -1, manual = false) {
    if (!this.inlineMobile || !this.ready || this.loading) return;
    window.clearTimeout(this.slideTimer);
    if (manual) this.slidePaused = true;
    const index = Math.max(0, this.slideIndex + direction);
    if (index === this.slideIndex) { this.render(); return; }
    if (!this.slideQueue.length) this.slideQueue = shuffleScreens(this.slideScreen);
    const next = this.slideHistory[index] ?? this.slideQueue[0];
    const token = ++this.slideRequest;
    const focus = (document.activeElement as HTMLElement | null)?.dataset.key;
    try {
      await loadScreen(next, this.language, 'mobile');
      if (token !== this.slideRequest || !this.inlineMobile) return;
      if (!this.slideHistory[index]) { this.slideHistory.push(next); this.slideQueue.shift(); }
      this.slideIndex = index;
      this.displayedScreen = next;
      this.displayedPath = previewPath(next, this.language, 'mobile');
      this.slideError = false;
      this.render();
    } catch {
      if (token !== this.slideRequest) return;
      this.slideError = true;
      this.slidePaused = true;
      this.render();
    }
    if (focus) this.element.querySelector<HTMLElement>(`[data-key="${focus}"]`)?.focus({preventScroll:true});
    this.scheduleSlide();
    this.schedulePreload();
  }

  private updateStatus() {
    const status = this.element.querySelector<HTMLElement>('.demo-status');
    if (status) {
      status.innerHTML = this.failed ? `${copy[this.language].error} <button class="text-button" data-retry>${copy[this.language].retry}</button>` : this.loading ? copy[this.language].loading : this.slideError ? `${copy[this.language].error} <button class="text-button" data-slide-next>${copy[this.language].retry}</button>` : '';
      status.hidden = !this.loading && !this.failed && !this.slideError;
    }
    this.element.setAttribute('aria-busy', String(this.loading));
  }

  private render() {
    const t = copy[this.language];
    const mobile = this.inlineMobile;
    const current = this.displayedScreen;
    this.element.classList.toggle('is-fullscreen', this.expanded);
    this.element.classList.toggle('is-slideshow', mobile);
    const hotspots = this.ready && !mobile && current === this.state.screen ? layouts[this.language][current].map(h => {
      const label = h.id === 'settings' ? this.language === 'RU' ? 'Настройки' : 'Settings' : h.target === 'close' ? t.close : screenLabel(h.target, this.language);
      const [x,y,w,height] = h.rect.map(n => n * 100);
      return `<button type="button" data-key="${h.id}" data-target="${h.target}" class="hotspot ${h.kind ?? ''} ${h.active ? 'is-active' : ''}" style="left:${x}%;top:${y}%;width:${w}%;height:${height}%" aria-label="${label}" ${h.kind ? `aria-pressed="${!!h.active}"` : ''}>${h.kind ? `${icon(h.icon!)}<span>${label}</span>` : ''}</button>`;
    }).join('') : '';
    this.element.innerHTML = `
      <div class="demo-toolbar">
        <span class="demo-title"><i class="status-dot"></i>${mobile ? t.screenshots : t.interactive}</span>
        <span class="demo-toolbar-hint">${t.demoHint}</span>
        <span class="demo-language">${this.language}</span>
        ${this.expanded ? `<button class="fullscreen-close" data-fullscreen-close data-key="fullscreen-close" aria-label="${t.exitFullscreen}">${icon('close')}</button>` : `<button class="fullscreen-open" data-fullscreen-open data-key="fullscreen-open" ${this.ready ? '' : 'disabled'}>${icon('fullscreen')}<span>${mobile ? t.fullPreview : t.fullscreen}</span></button>`}
      </div>
      <div class="demo-stage" data-screen="${current}" data-language="${this.language}" role="group" aria-label="${mobile ? t.screenshots : t.interactive}">
        ${this.ready ? `<img class="demo-image" src="${this.displayedPath}" width="2560" height="1355" alt="${screenLabel(current,this.language)} — Smile LauncHer" draggable="false" decoding="async" />` : '<div class="demo-placeholder">SLH</div>'}
        <div class="hotspots">${hotspots}</div>
      </div>
      ${mobile ? `<div class="slideshow-controls" role="group" aria-label="${t.slideshowControls}">
        <button data-slide-previous data-key="slide-previous" aria-label="${t.previousSlide}" ${this.slideIndex === 0 ? 'disabled' : ''}>${icon('previous')}</button>
        <button data-slide-pause data-key="slide-pause" aria-label="${this.slidePaused ? t.playSlides : t.pauseSlides}">${icon(this.slidePaused ? 'play' : 'pause')}</button>
        <span class="slide-counter" aria-hidden="true">${String(this.slideIndex % screens.length + 1).padStart(2,'0')} / ${screens.length}</span>
        <button data-slide-next data-key="slide-next" aria-label="${t.nextSlide}">${icon('next')}</button>
      </div>` : ''}
      <div class="demo-status" role="status" hidden></div>`;
    this.updateStatus();
  }
}
