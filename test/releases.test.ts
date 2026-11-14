import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectOS, orderedSystems, selectRelease, fetchRelease } from "../src/releases.ts";

const snapshot = JSON.parse(readFileSync(new URL("./fixtures/releases.json", import.meta.url), "utf8"));

test("Desktop OS detection prioritizes client hints and excludes mobile/ChromeOS/iPad desktop mode", () => {
  const cases = [
    [{ platform: "Win32", userAgent: "Windows NT 10.0" }, "windows"],
    [{ platform: "Linux x86_64", userAgentData: { platform: "Windows" } }, "windows"],
    [{ platform: "MacIntel", maxTouchPoints: 0 }, "macos"],
    [{ platform: "Linux x86_64" }, "linux"],
    [{ platform: "Linux armv8l", userAgent: "Linux; Android 14" }, null],
    [{ platform: "MacIntel", maxTouchPoints: 5, userAgent: "Macintosh" }, null],
    [{ userAgent: "iPhone; CPU iPhone OS 18_0 like Mac OS X" }, null],
    [{ userAgent: "X11; CrOS x86_64" }, null],
    [{ platform: "Win32", userAgentData: { mobile: true, platform: "Windows" } }, null],
    [{ platform: "FreeBSD" }, null], [{}, null],
  ] as const;
  for (const [device, expected] of cases) assert.equal(detectOS(device), expected);
  for (const os of ["windows", "macos", "linux", null] as const) {
    const order = orderedSystems(os);
    assert.equal(new Set(order).size, 3);
    if (os) assert.equal(order[0], os);
  }
});

test("Real release provides all manual installer/portable formats and excludes updater files", () => {
  const release = selectRelease(snapshot);
  assert.equal(release.version, "0.2.3");
  assert.equal(release.prerelease, true);
  assert.equal(release.downloads.length, 10);
  for (const os of ["windows", "macos", "linux"] as const) {
    const files = release.downloads.filter(a => a.os === os);
    assert.ok(files.some(a => a.portable));
    assert.ok(files.some(a => !a.portable));
    for (const a of files) assert.ok(a.url.includes("/v0.2.3/"));
  }
  assert.deepEqual(release.downloads.filter(a => a.os === "macos").map(a => a.arch).sort(), ["Apple Silicon", "Apple Silicon", "Intel", "Intel"]);
  assert.ok(!release.downloads.some(a => /\.sig$|\.tar\.gz$|latest\.json|SHA256/.test(a.name)));
});

test("Latest means newest published version including prereleases, excluding drafts and updater feeds", () => {
  const base = snapshot[0];
  const newer = { ...base, tag_name: "v0.2.4", published_at: "2026-11-15T00:00:00Z" };
  const draft = { ...newer, tag_name: "v0.3.0", published_at: "2026-11-16T00:00:00Z", draft: true };
  const feed = { ...newer, tag_name: "launcher-updates", published_at: "2026-11-17T00:00:00Z" };
  const noAssets = { ...newer, tag_name: "v0.4.0", published_at: "2026-11-18T00:00:00Z", assets: [] };
  assert.equal(selectRelease([feed, draft, noAssets, base, newer]).version, "0.2.4");
  assert.equal(selectRelease([{ ...base, tag_name: "v0.2.2.1" }]).version, "0.2.2.1");
  assert.throws(() => selectRelease([]));
  assert.throws(() => selectRelease({ message: "rate limited" }));
});

test("Release parser rejects unsafe URLs and missing packages without mixing release versions", () => {
  const base = snapshot[0];
  const asset = base.assets.find((a: { name: string }) => a.name.endsWith("-setup.exe"));
  const data = [{ ...base, assets: [asset, { ...asset, browser_download_url: "https://evil.example/setup.exe" },
    { ...asset, browser_download_url: "https://github.com/other/repo/releases/download/v1/setup.exe" },
    { ...asset, state: "new" }, { ...asset, size: 0 }] }];
  const release = selectRelease(data);
  assert.equal(release.downloads.length, 1);
  assert.equal(release.downloads[0].os, "windows");
});

test("Fetch failures and invalid API bodies surface as errors for fallback/retry", async () => {
  assert.equal((await fetchRelease(async () => new Response(JSON.stringify(snapshot)))).version, "0.2.3");
  await assert.rejects(() => fetchRelease(async () => new Response("rate limited", { status: 403 })));
  await assert.rejects(() => fetchRelease(async () => new Response("not json")));
  await assert.rejects(() => fetchRelease(async () => { throw new Error("offline"); }));
});
