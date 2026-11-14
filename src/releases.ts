export type OS = "windows" | "macos" | "linux";
export type Download = { name: string; url: string; size: number; os: OS; arch: string; format: string; portable: boolean };
export type Release = { version: string; url: string; published: string; prerelease: boolean; downloads: Download[] };
export const RELEASES_URL = "https://github.com/slhmc/slh/releases";
export const RELEASES_API = "https://api.github.com/repos/slhmc/slh/releases?per_page=100";

type Device = { userAgent?: string; platform?: string; maxTouchPoints?: number; userAgentData?: { mobile?: boolean; platform?: string } };
export function detectOS(device: Device): OS | null {
  const ua = device.userAgent ?? "";
  const platform = device.userAgentData?.platform || device.platform || "";
  if (device.userAgentData?.mobile || /Android|iPhone|iPad|iPod|Mobile|CrOS|Windows Phone/i.test(ua) ||
      (/Mac/i.test(platform) && (device.maxTouchPoints ?? 0) > 1)) return null;
  if (/Win/i.test(platform) || /Windows NT/i.test(ua)) return "windows";
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return "macos";
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return "linux";
  return null;
}

export function orderedSystems(os: OS | null): OS[] {
  const systems: OS[] = ["windows", "macos", "linux"];
  return os ? [os, ...systems.filter((item) => item !== os)] : systems;
}

function downloadAsset(asset: unknown): Download | null {
  if (!asset || typeof asset !== "object") return null;
  const a = asset as Record<string, unknown>;
  if (typeof a.name !== "string" || typeof a.browser_download_url !== "string" ||
      typeof a.size !== "number" || a.size <= 0 || (a.state !== undefined && a.state !== "uploaded")) return null;
  // Accept only packages uploaded to this repository, never updater metadata/signatures.
  let url: URL;
  try { url = new URL(a.browser_download_url); } catch { return null; }
  if (url.origin !== "https://github.com" || !url.pathname.startsWith("/slhmc/slh/releases/download/")) return null;
  const name = a.name;
  let os: OS, arch: string, format: string, portable = false;
  if (/-pc-windows-msvc/i.test(name)) {
    os = "windows";
    arch = /aarch64|arm64/i.test(name) ? "ARM64" : /x86_64/i.test(name) ? "x64" : "x86";
    if (/-setup\.exe$/i.test(name)) format = "EXE";
    else if (/\.msi$/i.test(name)) format = "MSI";
    else if (/-portable\.zip$/i.test(name)) { format = "ZIP"; portable = true; }
    else return null;
  } else if (/-apple-darwin/i.test(name)) {
    os = "macos";
    arch = /aarch64|arm64/i.test(name) ? "Apple Silicon" : "Intel";
    if (/\.dmg$/i.test(name)) format = "DMG";
    else if (/-app\.zip$/i.test(name)) { format = "App ZIP"; portable = true; }
    else return null;
  } else if (/-unknown-linux-/i.test(name)) {
    os = "linux";
    arch = /aarch64|arm64/i.test(name) ? "ARM64" : "x64";
    if (/\.deb$/i.test(name)) format = "DEB";
    else if (/\.rpm$/i.test(name)) format = "RPM";
    else if (/\.AppImage$/i.test(name)) { format = "AppImage"; portable = true; }
    else return null;
  } else return null;
  return { name, url: url.href, size: a.size, os, arch, format, portable };
}

export function selectRelease(data: unknown): Release {
  if (!Array.isArray(data)) throw new Error("Invalid releases response");
  const releases: Release[] = [];
  for (const raw of data) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    // The launcher-updates tag is an updater feed, not a downloadable release.
    if (r.draft || typeof r.tag_name !== "string" || !/^v?\d+\.\d+\.\d+(?:\.\d+)*(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(r.tag_name) ||
        typeof r.published_at !== "string" || !Number.isFinite(Date.parse(r.published_at)) || !Array.isArray(r.assets)) continue;
    const downloads = r.assets.map(downloadAsset).filter((a): a is Download => a !== null);
    if (!downloads.length) continue;
    releases.push({ version: r.tag_name.replace(/^v/, ""), url: `${RELEASES_URL}/tag/${encodeURIComponent(r.tag_name)}`,
      published: r.published_at, prerelease: r.prerelease === true, downloads });
  }
  releases.sort((a, b) => Date.parse(b.published) - Date.parse(a.published));
  if (!releases[0]) throw new Error("No downloadable release");
  return releases[0];
}

export async function fetchRelease(fetcher: typeof fetch = fetch): Promise<Release> {
  const response = await fetcher(RELEASES_API, {
    headers: { Accept: "application/vnd.github+json" }, cache: "no-cache", signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`GitHub: ${response.status}`);
  return selectRelease(await response.json());
}
