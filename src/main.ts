import "./style.css";
import "lenis/dist/lenis.css";
import { lenis, reducedMotion } from "./scroll.ts";
import { copy, type Language } from "./i18n.ts";
import { icon } from "./icons.ts";
import { LauncherDemo } from "./demo.ts";


function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem("slh-language");
    if (saved === "RU" || saved === "EN") return saved;
  } catch {
    /* Storage may be unavailable. */
  }

  const browserLang = (
    typeof navigator !== "undefined"
      ? navigator.language || (navigator.languages && navigator.languages[0]) || ""
      : ""
  ).toLowerCase();

  if (browserLang.startsWith("ru")) {
    return "RU";
  }
  return "EN";
}

let language: Language = detectLanguage();
const demo = new LauncherDemo(language);
const app = document.querySelector<HTMLDivElement>("#app")!;
const sectionIds = ["about", "preview", "benefits", "download"];
let revealObserver: IntersectionObserver;
let navObserver: IntersectionObserver;
demo.element.addEventListener("retry-language", (event) => {
  void changeLanguage((event as CustomEvent<Language>).detail);
});

async function changeLanguage(next: Language) {
  const button = document.querySelector<HTMLButtonElement>("#language-switch")!;
  button.disabled = true;
  if (await demo.setLanguage(next)) {
    language = next;
    try {
      localStorage.setItem("slh-language", language);
    } catch {
      /* Keep session language. */
    }
    const scroll = window.scrollY;
    render();
    window.scrollTo({ top: scroll, behavior: "instant" });
    document
      .querySelector<HTMLButtonElement>("#language-switch")!
      .focus({ preventScroll: true });
  } else button.disabled = false;
}

function render() {
  const t = copy[language];
  document.documentElement.lang = language.toLowerCase();
  document.title = "SLH";
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", t.intro);
  app.innerHTML = `
    <a class="skip-link" href="#about">${t.skip}</a>
    <header class="site-header" id="site-header">
      <div class="header-inner">
        <a class="brand" href="#about" aria-label="Smile LauncHer"><img src="/assets/Smile_LauncHer_logo.png" width="44" height="44" alt=""/><span>Smile LauncHer</span></a>
        <nav class="site-nav" aria-label="${language === "RU" ? "Навигация по странице" : "Page navigation"}">${sectionIds.map((id, i) => `<a href="#${id}" ${i === 0 ? 'class="active" aria-current="location"' : ""}>${t.nav[i]}</a>`).join("")}</nav>
        <div class="header-actions"><a class="community-link" href="https://discord.gg/yhTvuB6U8n" aria-label="Discord" title="Discord">${icon("discord")}</a><a class="github-link" href="https://github.com/slhmc/slh" aria-label="GitHub" title="GitHub">${icon("github")}</a><span class="header-divider"></span><button class="language-switch" aria-label="${t.language}" id="language-switch">${language}<span aria-hidden="true">⌄</span></button></div>
      </div>
    </header>
    <main>
      <section id="about" class="hero section">
        <div class="hero-stage" id="hero-stage">
          <div class="hero-aura" aria-hidden="true"></div>
          <div class="hero-content" id="hero-content">
            <p class="eyebrow hero-eyebrow hero-reveal-item" id="hero-eyebrow"><span class="tiny-square"></span>${t.tagline}</p>
            <div class="hero-logo-box" id="hero-logo-box">
              <img class="hero-logo" id="hero-logo" src="/assets/SLHmain.png" alt="Smile LauncHer — SLH" width="1682" height="500" fetchpriority="high" />
            </div>
            <div class="hero-reveal-block" id="hero-reveal-block">
              <h1>${t.title}<br/><span>${t.titleAccent}</span></h1>
              <p class="hero-description">${t.intro}</p>
              <div class="hero-buttons"><a class="button primary" href="#download">${icon("down")}${t.download}</a><a class="button secondary" href="#preview">${t.try}${icon("arrow")}</a></div>
              <ul class="trust-line"><li>${icon("check")}${t.free}</li><li>${icon("check")}${t.noAds}</li><li>${icon("check")}${t.open}</li></ul>
            </div>
          </div>
          <button class="hero-scroll-hint" id="hero-scroll-hint" type="button" aria-label="${t.scrollHint}">
            <span class="scroll-hint-arrow" aria-hidden="true">${icon("arrowDown")}</span>
          </button>
        </div>
        <div class="intro-features content-width">${t.featureTitles.map((title, i) => `<article><span class="feature-icon">${icon(["cube", "bolt", "java"][i])}</span><h2>${title}</h2><p>${t.featureTexts[i]}</p></article>`).join("")}</div>
      </section>
      <section id="preview" class="section preview-section content-width">
        <div class="section-heading reveal"><p class="eyebrow">${t.previewEyebrow}</p><h2>${t.previewTitle}<span>${t.previewAccent}</span></h2><p>${t.previewText}</p></div>
        <div id="demo-mount"></div>
      </section>
      <section id="benefits" class="section benefits-section content-width">
        <div class="section-heading reveal"><p class="eyebrow">${t.benefitsEyebrow}</p><h2>${t.benefitsTitle}<br/><span>${t.benefitsAccent}</span></h2><p>${t.benefitsText}</p></div>
        <div class="comparison-grid reveal">
          <article class="memory-card"><div class="card-top"><span class="eyebrow">RAM / ${language === "RU" ? "ОЗУ" : "MEMORY"}</span>${icon("appearance")}</div><h3>${t.memory}</h3><p class="muted small">${t.homeTab}</p>
            <div class="memory-row slh-memory"><div class="memory-label"><span><img src="/assets/Smile_LauncHer_logo.png" width="25" height="25" alt=""/>Smile LauncHer</span><strong>≈10 <small>${t.mb}</small></strong></div><div class="bar-track"><div class="bar slh-bar"></div></div></div>
            <div class="memory-row prism-memory"><div class="memory-label"><span>Prism Launcher</span><strong>≈70 <small>${t.mb}</small></strong></div><div class="bar-track"><div class="bar prism-bar"></div></div></div>
            <div class="memory-footnote">${icon("bolt")} ${t.memoryNote}</div>
          </article>
          <div class="benefit-cards">${t.benefitTitles.map((title, i) => `<article class="benefit-card"><div class="benefit-glyph">${i === 0 ? '<span class="speed-number">≈30<span>%</span></span>' : icon(["", "bolt", "home", "general"][i])}${i === 3 ? `<span class="progress-tag">${t.progress}</span>` : ""}</div><h3>${title}</h3><p>${t.benefitTexts[i]}</p></article>`).join("")}</div>
        </div>
        <p class="data-note">${t.dataNote}</p>
      </section>
      <section id="download" class="section download-section content-width">
        <div class="download-panel reveal"><span class="corner corner-tl"></span><span class="corner corner-tr"></span><span class="corner corner-bl"></span><span class="corner corner-br"></span>
          <img class="download-logo" src="/assets/Smile_LauncHer_logo.png" alt="" width="76" height="76" loading="lazy"/>
          <p class="eyebrow">${t.downloadEyebrow}</p><h2>${t.downloadTitle}<br/><span>${t.downloadAccent}</span></h2><p class="download-description">${t.downloadText}</p>
          <a class="button primary download-cta" href="https://github.com/slhmc/slh/releases">${icon("down")}${t.release}${icon("arrow")}</a>
          <p class="release-note">${icon("windows")}${t.releaseNote}</p>
          <div class="download-community"><a class="source-link" href="https://github.com/slhmc/slh">${icon("github")}${t.source}</a><a class="source-link" href="https://discord.gg/yhTvuB6U8n">${icon("discord")}Discord</a></div>
        </div>
      </section>
    </main>
    <footer class="site-footer content-width"><div class="footer-identity"><a class="footer-brand" href="#about"><img src="/assets/Smile_LauncHer_logo.png" width="36" height="36" alt=""/>Smile LauncHer</a><span>${t.footer}</span></div><p>${t.independent}</p><nav class="footer-links" aria-label="${language === 'RU' ? 'Сообщество и исходный код' : 'Community and source code'}"><a href="https://discord.gg/yhTvuB6U8n">${icon('discord')}Discord</a><a href="https://github.com/slhmc/slh">${icon('github')}GitHub</a></nav></footer>`;
  document.querySelector("#demo-mount")!.replaceWith(demo.element);
  document.querySelector("#language-switch")!.addEventListener("click", () => {
    void changeLanguage(language === "RU" ? "EN" : "RU");
  });
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((el) => revealObserver.observe(el));
  navObserver?.disconnect();
  navObserver = new IntersectionObserver(() => updateNav(), {
    rootMargin: "-15% 0px -60% 0px",
    threshold: 0,
  });
  sectionIds.forEach((id) => navObserver.observe(document.getElementById(id)!));
  updateHeroScrollFn = initHeroScroll();
  updateHeroScrollFn();
  updateNav();
}

let updateHeroScrollFn: (() => void) | null = null;
let introCompleted = false;
try {
  if (sessionStorage.getItem("slh-intro-seen") === "true" || window.scrollY > 100) {
    introCompleted = true;
  }
} catch {
  /* Storage may be unavailable. */
}

function initHeroScroll(): () => void {
  const heroStage = document.getElementById("hero-stage");
  const logoBox = document.getElementById("hero-logo-box");
  const logo = document.getElementById("hero-logo");
  const siteHeader = document.getElementById("site-header");
  const eyebrow = document.getElementById("hero-eyebrow");
  const revealBlock = document.getElementById("hero-reveal-block");
  const hint = document.getElementById("hero-scroll-hint");

  if (
    !heroStage ||
    !logoBox ||
    !logo ||
    !siteHeader ||
    !eyebrow ||
    !revealBlock ||
    !hint
  ) {
    return () => {};
  }

  function setFullyRevealed() {
    logo!.style.transform = "none";
    siteHeader!.style.transform = "none";
    siteHeader!.style.opacity = "1";
    siteHeader!.style.pointerEvents = "auto";
    eyebrow!.style.transform = "none";
    eyebrow!.style.opacity = "1";
    revealBlock!.style.transform = "none";
    revealBlock!.style.opacity = "1";
    hint!.style.opacity = "0";
    hint!.style.pointerEvents = "none";
    hint!.style.display = "none";
    document.body.classList.add("intro-completed");
  }

  hint.onclick = () => {
    lenis.scrollTo(Math.min(280, window.innerHeight * 0.4), { immediate: reducedMotion.matches });
  };

  function update() {
    if (introCompleted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFullyRevealed();
      return;
    }

    const scrollY = window.scrollY;
    const revealThreshold = Math.min(280, window.innerHeight * 0.4);
    const p = Math.min(1, Math.max(0, scrollY / revealThreshold));

    if (p >= 1) {
      introCompleted = true;
      try {
        sessionStorage.setItem("slh-intro-seen", "true");
      } catch {
        /* Storage may be unavailable. */
      }
      setFullyRevealed();
      return;
    }

    const vh = window.innerHeight;
    const boxRect = logoBox!.getBoundingClientRect();
    const untransformedViewportY = boxRect.top + boxRect.height / 2;
    const startViewportY = vh / 2;
    const desiredViewportY = startViewportY * (1 - p) + untransformedViewportY * p;
    const currentTy = desiredViewportY - untransformedViewportY;

    const targetWidth = Math.min(
      window.innerWidth * 0.86,
      920,
      vh * 0.42 * (1682 / 500),
    );
    const baseWidth = boxRect.width || 430;
    const maxScale = Math.max(1, targetWidth / baseWidth);

    const t = 1 - p;
    const currentScale = 1 + (maxScale - 1) * t;

    const hdrP = Math.min(1, Math.max(0, (p - 0.15) / 0.65));
    const hdrTy = (1 - hdrP) * -20;

    const uiP = Math.min(1, Math.max(0, (p - 0.25) / 0.7));
    const uiTy = (1 - uiP) * 20;

    const hintOpacity = Math.max(0, 1 - p / 0.15);

    logo!.style.transform = `translate3d(0, ${currentTy.toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`;

    siteHeader!.style.opacity = hdrP.toFixed(3);
    siteHeader!.style.transform = `translate3d(0, ${hdrTy.toFixed(2)}px, 0)`;
    siteHeader!.style.pointerEvents = hdrP > 0.4 ? "auto" : "none";

    eyebrow!.style.opacity = uiP.toFixed(3);
    eyebrow!.style.transform = `translate3d(0, ${uiTy.toFixed(2)}px, 0)`;

    revealBlock!.style.opacity = uiP.toFixed(3);
    revealBlock!.style.transform = `translate3d(0, ${uiTy.toFixed(2)}px, 0)`;

    hint!.style.opacity = hintOpacity.toFixed(3);
    hint!.style.pointerEvents = hintOpacity > 0.1 ? "auto" : "none";
  }

  return update;
}

function updateNav() {
  let active = sectionIds[0];
  for (const id of sectionIds)
    if (
      document.getElementById(id)!.getBoundingClientRect().top <=
      window.innerHeight * 0.4
    )
      active = id;
  if (
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 8
  )
    active = "download";
  document
    .querySelectorAll<HTMLAnchorElement>(".site-nav a")
    .forEach((link) => {
      const selected = link.hash === `#${active}`;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
}
render();
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    demo.destroy();
  });
}

let scrollQueued = false;
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(() => {
        updateHeroScrollFn?.();
        updateNav();
        scrollQueued = false;
      });
    }
  },
  { passive: true },
);

window.addEventListener(
  "resize",
  () => {
    lenis.resize();
    updateHeroScrollFn?.();
    updateNav();
  },
  { passive: true },
);

document.addEventListener("click", (e) => {
  const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (anchor) {
    const href = anchor.getAttribute("href");
    if (href && href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, {
          offset: href === "#about" ? 0 : -20,
          immediate: reducedMotion.matches,
        });
      }
    }
  }
});
