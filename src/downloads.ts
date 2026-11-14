import { copy, type Language } from "./i18n.ts";
import { icon } from "./icons.ts";
import { detectOS, fetchRelease, orderedSystems, RELEASES_URL, selectRelease, type OS, type Release } from "./releases.ts";
import bundledReleases from "./release-snapshot.json";

const systemNames = { windows: "Windows", macos: "macOS", linux: "Linux" };
const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export class Downloads {
  readonly element = document.createElement("div");
  private language: Language;
  private os: OS | null;
  private release: Release | null = null;
  private loading = true;
  private failed = false;

  constructor(language: Language) {
    this.language = language;
    this.os = detectOS(navigator);
    this.element.className = "downloads";
    this.element.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest("[data-release-retry]")) void this.load();
    });
    this.render();
    void this.load();
  }

  setLanguage(language: Language) { this.language = language; this.render(); }

  private async load() {
    if (!this.loading) { this.loading = true; this.render(); }
    try {
      this.release = await fetchRelease();
      this.failed = false;
    } catch {
      this.failed = true;
      // Build-time snapshot keeps real download links available during outages/rate limits.
      if (!this.release) {
        try { this.release = selectRelease(bundledReleases); } catch { /* Show recovery links. */ }
      }
    } finally {
      this.loading = false;
      this.render();
      // Preserve keyboard focus when retry replaces its own control.
      if (this.retryFocused) this.element.querySelector<HTMLElement>("[data-release-retry], .download-release-links a")?.focus({ preventScroll: true });
      this.retryFocused = false;
    }
  }

  private retryFocused = false;
  private render() {
    const t = copy[this.language].downloads;
    const r = this.release;
    this.retryFocused ||= this.element.contains(document.activeElement) && document.activeElement?.hasAttribute("data-release-retry") === true;
    this.element.setAttribute("aria-busy", String(this.loading));
    this.element.innerHTML = `
      <p class="download-version" role="status">${this.loading ? t.loading : r ? `${t.version} <strong>${escape(r.version)}</strong>${r.prerelease ? ` · ${t.prerelease}` : ""}` : t.unavailable}</p>
      ${this.failed ? `<p class="download-warning">${r ? t.cached : t.error}</p>` : ""}
      ${r ? `<div class="download-systems">${orderedSystems(this.os).map((os) => {
        const packages = r.downloads.filter((a) => a.os === os);
        const arches = [...new Set(packages.map((a) => a.arch))];
        if (os === "macos") arches.sort((a) => a === "Apple Silicon" ? -1 : 1);
        return `<section class="download-system${os === this.os ? " is-recommended" : ""}" aria-labelledby="download-${os}">
          <div class="download-system-heading"><h3 id="download-${os}">${systemNames[os]}</h3>${os === this.os ? `<span class="download-recommended">${icon("check")}${t.forDevice}</span>` : ""}</div>
          ${packages.length ? arches.map((arch) => `<div class="download-architecture"><h4>${escape(arch)}</h4><div class="download-files">${packages.filter((a) => a.arch === arch).sort((a, b) => {
            const rank = (format: string) => ["EXE", "DMG", "DEB", "MSI", "RPM", "ZIP", "App ZIP", "AppImage"].indexOf(format);
            return rank(a.format) - rank(b.format);
          }).map((a, i) => `<a class="button ${os === this.os && i === 0 ? "primary" : "secondary"} package-link" href="${escape(a.url)}" aria-label="${escape(`${systemNames[os]} ${arch}: ${a.portable ? t.portable : t.installer} ${a.format}, SLH ${r.version}`)}">${icon("down")}<span><span>${a.portable ? t.portable : t.installer} · ${a.format}</span><small>${new Intl.NumberFormat(this.language === "RU" ? "ru" : "en", { maximumFractionDigits: 1 }).format(a.size / 1048576)} ${t.mb}</small></span></a>`).join("")}</div></div>`).join("") : `<p class="download-warning">${t.noPackages}</p>`}
        </section>`;
      }).join("")}</div>` : this.loading ? `<div class="download-skeleton" aria-hidden="true">${orderedSystems(this.os).map(() => '<div></div>').join("")}</div>` : ""}
      <div class="download-release-links">${this.failed || this.loading ? `<button class="button secondary" data-release-retry ${this.loading ? "disabled" : ""}>${this.loading ? t.loading : t.retry}</button>` : ""}<a class="button secondary" href="${escape(r?.url ?? RELEASES_URL)}">${t.releaseNotes}${icon("arrow")}</a></div>`;
  }
}
