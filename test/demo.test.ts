import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  layouts,
  screens,
  transition,
  imagePath,
  type Screen,
} from "../src/screens.ts";
import { loadScreen } from "../src/image-loader.ts";
import { shuffleScreens } from "../src/slideshow.ts";

function dimensions(file: Buffer): [number, number] {
  if (file.subarray(1, 4).toString() === "PNG")
    return [file.readUInt32BE(16), file.readUInt32BE(20)];
  // Some supplied .png files contain JPEG data. Read SOF rather than trust the extension.
  assert.equal(file.readUInt16BE(0), 0xffd8, "Expected PNG or JPEG");
  let offset = 2;
  while (offset < file.length) {
    assert.equal(file[offset++], 0xff);
    while (file[offset] === 0xff) offset++;
    const marker = file[offset++];
    const length = file.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker))
      return [file.readUInt16BE(offset + 5), file.readUInt16BE(offset + 3)];
    offset += length;
  }
  throw new Error("JPEG dimensions not found");
}

test("Every provided screen is reachable, with in-bounds hit areas in both languages", () => {
  for (const language of ["RU", "EN"] as const) {
    const reachable = new Set<Screen>(["Home"]);
    const pending: Screen[] = ["Home"];
    while (pending.length) {
      const screen = pending.pop()!;
      const ids = new Set<string>();
      for (const hotspot of layouts[language][screen]) {
        assert.ok(!ids.has(hotspot.id), `${screen}: duplicate ID`);
        ids.add(hotspot.id);
        const [x, y, w, h] = hotspot.rect;
        assert.ok(
          x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1 && y + h <= 1,
          `${language}/${screen}/${hotspot.id}`,
        );
        if (hotspot.target !== "close" && !reachable.has(hotspot.target)) {
          reachable.add(hotspot.target);
          pending.push(hotspot.target);
        }
      }
    }
    assert.equal(reachable.size, 17);
    for (const screen of screens) {
      assert.ok(reachable.has(screen));
      const file = readFileSync(
        new URL(`../public${imagePath(screen, language)}`, import.meta.url),
      );
      assert.deepEqual(
        dimensions(file),
        [2560, 1355],
        `${language}/${screen} dimensions`,
      );
    }
  }
});

test("New instance returns to the exact previous screen, including selected library", () => {
  for (const screen of screens.filter((s) => s !== "New-Instances")) {
    const previous = { screen, previous: "Home" as Screen, selected: screen === 'Library_Pressed-Instances' };
    const opened = transition(previous, "New-Instances");
    assert.equal(opened.previous, screen);
    assert.deepEqual(
      transition(opened, "New-Instances"),
      opened,
      "Opening twice must not lose the return screen",
    );
    assert.equal(transition(opened, "close").screen, screen);
  }
});

test("Library selection survives repeat clicks, navigation and instance creation", () => {
  const state = { screen: "Library" as Screen, previous: "Home" as Screen, selected: false };
  const selected = transition(
    state,
    layouts.RU.Library.find((h) => h.id === "instance")!.target,
  );
  assert.equal(selected.screen, "Library_Pressed-Instances");
  const repeated = transition(
    selected,
    layouts.RU["Library_Pressed-Instances"].find((h) => h.id === "instance")!
      .target,
  );
  assert.equal(repeated.screen, "Library_Pressed-Instances");
  assert.equal(repeated.selected, true);
  const viaNavigation = transition(
    selected,
    layouts.RU["Library_Pressed-Instances"].find((h) => h.id === "Library")!
      .target,
  );
  assert.equal(viaNavigation.screen, "Library_Pressed-Instances");
  for (const other of ['Discover', 'Home', 'S-Appearance'] as Screen[]) {
    const away = transition(selected, other);
    const returned = transition(away, 'Library');
    assert.equal(returned.screen, 'Library_Pressed-Instances');
    assert.equal(returned.selected, true);
  }
  const created = transition(transition(selected, 'New-Instances'), 'close');
  assert.equal(created.selected, true);
  assert.equal(created.screen, 'Library_Pressed-Instances');
  assert.equal(transition(state, 'Library').screen, 'Library', 'Unselected library stays unselected until the first selection');
});

test('Shuffled screenshot cycles include every image once and do not repeat at the boundary', () => {
  let previous: Screen = 'Home';
  for (let seed = 0; seed < 40; seed++) {
    const order = shuffleScreens(previous, () => seed / 40);
    assert.equal(order.length, 17);
    assert.deepEqual([...order].sort(), [...screens].sort());
    assert.notEqual(order[0], previous);
    previous = order.at(-1)!;
  }
});

test("Creation screenshot exposes only close and no background navigation", () => {
  for (const language of ["RU", "EN"] as const) {
    assert.deepEqual(
      layouts[language]["New-Instances"].map((h) => h.target),
      ["close"],
    );
  }
});

test("Image loading shares successful requests and allows retry after failure or timeout", async () => {
  const oldImage = Object.getOwnPropertyDescriptor(globalThis, "Image");
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let fail = false;
  let stalled = false;
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_path: string) {
      if (!stalled)
        queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
    }
  }
  Object.defineProperty(globalThis, "Image", {
    value: FakeImage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: { setTimeout, clearTimeout },
    configurable: true,
  });
  try {
    const first = loadScreen("Home", "RU");
    assert.equal(
      first,
      loadScreen("Home", "RU"),
      "Concurrent requests must reuse an image",
    );
    await first;
    assert.equal(
      first,
      loadScreen("Home", "RU"),
      "Successful images remain cached",
    );
    fail = true;
    const failed = loadScreen("Library", "RU");
    await assert.rejects(failed, /Image unavailable/);
    fail = false;
    const retried = loadScreen("Library", "RU");
    assert.notEqual(retried, failed, "Failure must not poison the image cache");
    await retried;
    stalled = true;
    Object.defineProperty(globalThis, "window", {
      value: {
        setTimeout: (fn: () => void) => setTimeout(fn, 1),
        clearTimeout,
      },
      configurable: true,
    });
    await assert.rejects(
      loadScreen("Discover", "RU"),
      /Image unavailable/,
      "Stalled requests must time out",
    );
    stalled = false;
    await loadScreen("Discover", "RU");
  } finally {
    if (oldImage) Object.defineProperty(globalThis, "Image", oldImage);
    else Reflect.deleteProperty(globalThis, "Image");
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
