import { detectMacArchitecture } from "./mac-architecture.ts";
import "./downloads.css";
import { copy, type Language } from "./i18n.ts";
import { icon } from "./icons.ts";
import { detectOS, fetchRelease, orderedSystems, RELEASES_URL, selectRelease, type Download, type OS, type Release } from "./releases.ts";
import bundledReleases from "./release-snapshot.json";

const systemNames = { windows: "Windows", macos: "macOS", linux: "Linux" };
const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);


function platformIcon(os: OS) {
  if (os === "macos") return icon("apple").replace("<path", '<defs><linearGradient id="mac-rainbow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#65a640"/><stop offset="28%" stop-color="#65a640"/><stop offset="28%" stop-color="#f2cd32"/><stop offset="43%" stop-color="#f2cd32"/><stop offset="43%" stop-color="#ed8a28"/><stop offset="58%" stop-color="#ed8a28"/><stop offset="58%" stop-color="#d94b32"/><stop offset="73%" stop-color="#d94b32"/><stop offset="73%" stop-color="#875391"/><stop offset="86%" stop-color="#875391"/><stop offset="86%" stop-color="#398ac0"/></linearGradient></defs><path fill="url(#mac-rainbow)"');
  if (os === "linux") return icon("linux").replace("</svg>", '<path fill="#fff3d8" d="M9 8h6v2h2v8h-2v2H9v-2H7v-8h2z"/><path fill="#211b16" d="M9 6h2v2H9zm4 0h2v2h-2z"/><path fill="#f3bd36" d="M10 9h4v2h-4zM3 19h6v3H2v-2h1zm12 0h6v1h1v2h-7z"/></svg>');
  return icon("windows");
}

export class Downloads {
  readonly element = document.createElement("div");
  private language: Language;
  private os: OS | null;
  private release: Release | null = null;
  private loading = true;
  private failed = false;
  private macArch = "Apple Silicon";
  private macArchSelected = false;
  private events = new AbortController();

  constructor(language: Language) {
    this.language = language;
    this.os = detectOS(navigator);
    this.element.className = "downloads";
    this.element.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-release-retry]")) void this.load();
      const arch = target.closest<HTMLButtonElement>("[data-mac-arch]");
      if (arch) {
        this.macArchSelected = true;
        this.macArch = arch.dataset.macArch!;
        this.render();
        this.element.querySelector<HTMLButtonElement>(`[data-mac-arch="${this.macArch}"]`)?.focus({ preventScroll: true });
      }
      if (target.closest("[data-linux-toggle]")) this.toggleLinux();
    });
    document.addEventListener("pointerdown", (event) => {
      if (!(event.target as Element).closest(".linux-installer")) this.closeLinux();
    }, { signal: this.events.signal });
    this.element.addEventListener("keydown", (event) => {
      const toggle = this.element.querySelector<HTMLButtonElement>("[data-linux-toggle]");
      if (event.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
        event.preventDefault(); this.closeLinux(); toggle.focus();
      }
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && (event.target as Element).closest(".linux-installer")) {
        event.preventDefault(); this.toggleLinux(true);
        const links = [...this.element.querySelectorAll<HTMLAnchorElement>(".linux-menu a")];
        const index = links.indexOf(document.activeElement as HTMLAnchorElement);
        const next = index < 0 ? (event.key === "ArrowDown" ? 0 : links.length - 1) : (index + (event.key === "ArrowDown" ? 1 : links.length - 1)) % links.length;
        links[next]?.focus();
      }
    });
    this.element.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget as Element | null)?.closest(".linux-installer")) this.closeLinux();
    });
    this.render();
    void this.load();
    if (this.os === "macos") void detectMacArchitecture().then(arch => {
      if (arch && !this.macArchSelected && !this.events.signal.aborted) {
        this.macArch = arch;
        this.render();
      }
    });
  }

  destroy() { this.events.abort(); }
  setLanguage(language: Language) { this.language = language; this.render(); }

  private toggleLinux(open?: boolean) {
    const toggle = this.element.querySelector<HTMLButtonElement>("[data-linux-toggle]");
    const menu = this.element.querySelector<HTMLElement>(".linux-menu");
    if (!toggle || !menu) return;
    const expanded = open ?? toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(expanded));
    menu.hidden = !expanded;
  }
  private closeLinux() { this.toggleLinux(false); }

  private async load() {
    const retryFocused = document.activeElement?.hasAttribute("data-release-retry");
    this.loading = true;
    this.render();
    try { this.release = await fetchRelease(); this.failed = false; }
    catch {
      this.failed = true;
      if (!this.release) {
        try { this.release = selectRelease(bundledReleases); } catch { /* Recovery links remain available. */ }
      }
    } finally {
      this.loading = false;
      this.render();
      if (retryFocused) this.element.querySelector<HTMLElement>("[data-release-retry], .download-release-links a")?.focus({ preventScroll: true });
    }
  }

  private packageLink(file: Download | undefined, portable = false) {
    const t = copy[this.language].downloads;
    const label = portable ? t.portable : t.action;
    const className = `button ${portable ? "secondary" : "primary"} package-link`;
    const content = `${icon(portable ? "archive" : "down")}<span>${label}</span>`;
    if (!file) return `<span class="${className} is-unavailable" aria-disabled="true" title="${t.missing}">${content}</span>`;
    const name = `${systemNames[file.os]} ${file.arch}: ${label}, ${file.format}, SLH ${this.release!.version}`;
    const size = new Intl.NumberFormat(this.language === "RU" ? "ru" : "en", { maximumFractionDigits: 1 }).format(file.size / 1048576);
    return `<a class="${className}" href="${escape(file.url)}" aria-label="${escape(name)}" title="${escape(`${file.format} · ${size} ${t.mb}`)}">${content}</a>`;
  }

  private system(os: OS, release: Release) {
    const t = copy[this.language].downloads;
    const files = release.downloads.filter((a) => a.os === os && (os !== "macos" || a.arch === this.macArch));
    const installer = files.find((a) => !a.portable && a.format !== "MSI") ?? files.find((a) => !a.portable);
    const portable = files.find((a) => a.portable);
    const linux = files.filter((a) => a.format === "DEB" || a.format === "RPM");
    const recommended = os === this.os;
    const arch = installer?.arch ?? portable?.arch ?? "";
    return `<section class="download-system${recommended ? " is-recommended" : ""}" aria-labelledby="download-${os}">
      <div class="download-card-top"><span class="download-os-mark ${os}">${platformIcon(os)}<span class="windows-colors" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span>${recommended ? `<span class="download-recommended">${t.forDevice}</span>` : ""}</div>
      <h3 id="download-${os}">${systemNames[os]}</h3>
      <div class="download-platform-options">${os === "macos" ? `<div class="mac-architecture" role="group" aria-label="${t.architecture}">${["Apple Silicon", "Intel"].map((a) => `<button type="button" data-mac-arch="${a}" aria-pressed="${this.macArch === a}">${a === "Apple Silicon" ? "Silicon" : a}</button>`).join("")}</div>` : `<span>${os === "windows" ? `${t.bit64} · ${escape(arch)}` : `DEB / RPM · ${escape(arch)}`}</span>`}</div>
      <div class="download-card-actions">${os === "linux" && linux.length ? `<div class="linux-installer"><button type="button" class="button primary package-link" data-linux-toggle aria-label="Linux: ${t.action} ${t.installer.toLowerCase()}" aria-expanded="false" aria-controls="linux-package-menu">${icon("down")}<span>${t.action}</span>${icon("chevronDown")}</button><div class="linux-menu" id="linux-package-menu" role="group" aria-label="${t.linuxFormat}" hidden><span>${t.linuxFormat}</span>${linux.map((a) => `<a href="${escape(a.url)}" aria-label="Linux ${escape(a.arch)}, ${a.format}, SLH ${escape(release.version)}"><span>${a.format}</span>${icon("down")}</a>`).join("")}</div></div>` : this.packageLink(installer)}${this.packageLink(portable, true)}</div>
    </section>`;
  }

  private render() {
    const t = copy[this.language].downloads;
    const r = this.release;
    const alternatives = orderedSystems(this.os).filter((os) => os !== this.os);
    const systems: OS[] = this.os ? [alternatives[0], this.os, alternatives[1]] : orderedSystems(null);
    this.element.setAttribute("aria-busy", String(this.loading));
    this.element.innerHTML = `
      ${this.failed ? `<p class="download-warning" role="status">${r ? t.cached : t.error}</p>` : ""}
      <div class="download-meta"><p class="download-version" role="status">${this.loading ? t.loading : r ? `${t.version} <strong>${escape(r.version)}</strong>${r.prerelease ? ` · ${t.prerelease}` : ""}` : t.unavailable}</p>
      <div class="download-release-links">${this.failed ? `<button class="button secondary" data-release-retry ${this.loading ? "disabled" : ""}><span>${this.loading ? t.loading : t.retry}</span></button>` : ""}<a href="${escape(r?.url ?? RELEASES_URL)}"><span>${t.releaseNotes}</span>${icon("arrow")}</a></div></div>
      ${r ? `<div class="download-systems${this.os ? " has-recommended" : ""}">${systems.map((os) => this.system(os, r)).join("")}</div>` : this.loading ? `<div class="download-skeleton" aria-hidden="true"><div></div><div></div><div></div></div>` : ""}`;
  }
}
