import type { Language } from "./i18n.ts";

export const settings = [
  ["General", "Основные", "General", "general"],
  ["Appearance", "Внешний вид", "Appearance", "appearance"],
  ["Minecraft", "Minecraft", "Minecraft", "minecraft"],
  ["Java", "Java", "Java", "java"],
  ["Accounts", "Аккаунты", "Accounts", "accounts"],
  ["Storage", "Хранилище", "Storage", "storage"],
  ["Downloads", "Загрузки", "Downloads", "down"],
  ["Notifications", "Уведомления", "Notifications", "bell"],
  ["Sync", "Синхронизация", "Sync", "sync"],
  ["Console", "Консоль", "Console", "console"],
  ["Privacy", "Приватность", "Privacy", "shield"],
  ["Advanced", "Дополнительно", "Advanced", "lock"],
] as const;
export type Setting = (typeof settings)[number][0];
export type Screen =
  | "Home"
  | "Library"
  | "Library_Pressed-Instances"
  | "Discover"
  | "New-Instances"
  | `S-${Setting}`;
export const screens: Screen[] = [
  "Home",
  "Library",
  "Library_Pressed-Instances",
  "Discover",
  "New-Instances",
  ...settings.map(([id]) => `S-${id}` as Screen),
];
export interface DemoState {
  screen: Screen;
  previous: Screen;
  selected: boolean;
}
export function transition(
  state: DemoState,
  target: Screen | "close",
): DemoState {
  if (target === "close")
    return state.screen === "New-Instances"
      ? { ...state, screen: state.previous }
      : state;
  if (target === "New-Instances")
    return state.screen === target
      ? state
      : { ...state, screen: target, previous: state.screen };
  const selected = state.selected || target === "Library_Pressed-Instances";
  return { ...state, selected, screen: target === 'Library' && selected ? 'Library_Pressed-Instances' : target };
}
export function screenLabel(screen: Screen, language: Language): string {
  const ru = language === "RU";
  const basic: Record<string, string> = {
    Home: ru ? "Главная" : "Home",
    Library: ru ? "Библиотека" : "Library",
    Discover: ru ? "Обзор" : "Discover",
    "Library_Pressed-Instances": ru ? "Сборка 26.2" : "Instance 26.2",
    "New-Instances": ru ? "Новая сборка" : "New instance",
  };
  return (
    basic[screen] ??
    settings.find(([id]) => screen === `S-${id}`)?.[ru ? 1 : 2] ??
    screen
  );
}
export function imagePath(screen: Screen, language: Language): string {
  return `/assets/preview/${language}/${screen}.png`;
}
export interface Hotspot {
  id: string;
  target: Screen | "close";
  rect: [number, number, number, number];
  kind?: "nav" | "setting";
  icon?: string;
  active?: boolean;
}
// Measured against the 2048 × 1084 display of the original 2560 × 1355 screenshots.
// Store normalized rectangles so CSS scales every hit area with the image, not the viewport.
function rect(x: number, y: number, w: number, h: number): Hotspot["rect"] {
  return [x / 2048, y / 1084, w / 2048, h / 1084];
}
function makeLayout(screen: Screen, language: Language): Hotspot[] {
  if (screen === "New-Instances")
    return [{ id: "close", target: "close", rect: rect(1740, 57, 49, 46) }];
  const isSettings = screen.startsWith("S-");
  const result: Hotspot[] = [
    ...(["Home", "Library", "Discover"] as const).map((target, i): Hotspot => ({
      id: target,
      target,
      kind: "nav",
      icon: ["home", "cube", "search"][i],
      rect: rect(12, 146 + i * 56, 256, 52),
      active:
        target === screen ||
        (target === "Library" && screen === "Library_Pressed-Instances"),
    })),
    {
      id: "settings",
      target: "S-General",
      kind: "nav",
      icon: "settings",
      rect: rect(12, 980, 256, 52),
      active: isSettings,
    },
    {
      id: "new-top",
      target: "New-Instances",
      rect: language === "RU" ? rect(1584, 5, 190, 38) : rect(1594, 5, 185, 38),
    },
    { id: "account", target: "S-Accounts", rect: rect(20, 914, 235, 52) },
  ];
  if (isSettings)
    result.push(
      ...settings.map(([id, , , glyph], i): Hotspot => ({
        id: `setting-${id}`,
        target: `S-${id}`,
        kind: "setting",
        icon: glyph,
        active: screen === `S-${id}`,
        rect: rect(293, 146 + i * 46.4, 232, 46.4),
      })),
    );
  if (screen === "Home")
    result.push(
      {
        id: "new-home",
        target: "New-Instances",
        rect:
          language === "RU" ? rect(1793, 82, 220, 45) : rect(1799, 82, 214, 45),
      },
      {
        id: "recent-instance",
        target: "Library_Pressed-Instances",
        rect: rect(334, 293, 1095, 59),
      },
      {
        id: "quick-new",
        target: "New-Instances",
        rect: rect(317, 645, 557, 94),
      },
      {
        id: "quick-discover",
        target: "Discover",
        rect: rect(887, 645, 557, 94),
      },
      { id: "quick-java", target: "S-Java", rect: rect(1456, 645, 557, 94) },
      {
        id: "status-account",
        target: "S-Accounts",
        rect: rect(1483, 290, 510, 64),
      },
      { id: "status-java", target: "S-Java", rect: rect(1483, 355, 510, 64) },
      {
        id: "status-downloads",
        target: "S-Downloads",
        rect: rect(1483, 420, 510, 70),
      },
    );
  if (screen === "Library")
    result.push({
      id: "instance",
      target: "Library_Pressed-Instances",
      rect: rect(313, 274, 232, 237),
    });
  if (screen === "Library_Pressed-Instances")
    result.push({
      id: "instance",
      target: "Library_Pressed-Instances",
      rect: rect(313, 315, 209, 237),
    });
  return result;
}
export const layouts = Object.fromEntries(
  (["RU", "EN"] as const).map((language) => [
    language,
    Object.fromEntries(
      screens.map((screen) => [screen, makeLayout(screen, language)]),
    ),
  ]),
) as Record<Language, Record<Screen, Hotspot[]>>;
