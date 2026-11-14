import { writeFile } from "node:fs/promises";
import { RELEASES_API, selectRelease } from "../src/releases.ts";

try {
  const response = await fetch(RELEASES_API, { headers: { Accept: "application/vnd.github+json" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`GitHub: ${response.status}`);
  const data = await response.json();
  const release = selectRelease(data);
  // Keep only the selected raw release and fields needed by the shared parser.
  const raw = data.find((r: { tag_name: string }) => r.tag_name.replace(/^v/, "") === release.version);
  const snapshot = [{ tag_name: raw.tag_name, published_at: raw.published_at, prerelease: raw.prerelease, draft: false,
    assets: raw.assets.map((a: { name: string; size: number; browser_download_url: string; state: string }) => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url, state: a.state })) }];
  await writeFile(new URL("../src/release-snapshot.json", import.meta.url), JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`Release snapshot: SLH ${release.version}`);
} catch (error) {
  console.warn("Could not refresh releases; keeping the checked-in snapshot.", error instanceof Error ? error.message : error);
}
