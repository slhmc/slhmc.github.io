import { copy, type Language } from './i18n.ts';
import { icon } from './icons.ts';

type Status = 'yes' | 'no' | 'partial' | 'limited' | 'java' | 'wip' | 'unknown' | 'millidaSource';
const rows: { icon: string; values: [Status, Status, Status, Status] }[] = [
  { icon: 'minecraft', values: ['yes', 'java', 'java', 'yes'] },
  { icon: 'unlock', values: ['yes', 'no', 'yes', 'no'] },
  { icon: 'users', values: ['yes', 'partial', 'partial', 'partial'] },
  { icon: 'appearance', values: ['wip', 'limited', 'limited', 'no'] },
  { icon: 'briefcase', values: ['yes', 'yes', 'no', 'no'] },
  { icon: 'github', values: ['yes', 'yes', 'millidaSource', 'no'] },
  { icon: 'shield', values: ['no', 'no', 'yes', 'yes'] },
];

export function comparisonTable(language: Language): string {
  const t = copy[language].comparison;
  const launchers = [
    { name: 'SLH', logo: '/assets/Smile_LauncHer_logo.png' },
    { name: 'Prism Launcher', logo: '/assets/launchers/prism.png' },
    { name: 'Millida Launcher', logo: '/assets/launchers/millida.svg' },
    { name: 'Minecraft Launcher', logo: '/assets/launchers/minecraft.png' },
  ];
  function status(value: Status) {
    if (value === 'millidaSource') return `<span class="comparison-status status-source-question" tabindex="0" role="img" aria-label="${t.millidaSource}" title="${t.millidaSource}">?</span>`;
    if (value === 'unknown') return `<span class="comparison-status status-unknown" role="img" aria-label="${t.unknown}" title="${t.unknown}">?</span>`;
    const label = value === 'yes' ? t.yes : value === 'no' ? t.no : value === 'java' ? t.onlyJava : value === 'wip' ? t.wip : t[value];
    const glyph = value === 'yes' ? 'check' : value === 'no' || value === 'java' ? 'close' : value === 'wip' ? 'general' : 'alert';
    const text = value === 'java' ? 'Java' : value === 'wip' ? 'W.I.P.' : value === 'partial' || value === 'limited' ? t[value] : '';
    return `<span class="comparison-status status-${value}" role="img" aria-label="${label}" title="${label}">${icon(glyph)}${text ? `<span>${text}</span>` : ''}</span>`;
  }
  return `<div class="launcher-comparison reveal">
    <div class="comparison-scroll" tabindex="0" role="region" aria-labelledby="comparison-title" data-lenis-prevent-horizontal>
      <table class="launcher-table">
        <caption class="visually-hidden">${t.caption}</caption>
        <colgroup><col class="feature-column"/><col class="slh-column"/><col/><col/><col/></colgroup>
        <thead><tr><th scope="col" class="feature-heading">${t.feature}</th>${launchers.map((launcher, i) => `<th scope="col" ${i === 0 ? 'class="slh-column"' : ''}><div class="comparison-launcher"><img src="${launcher.logo}" alt="" width="48" height="48" loading="lazy"/><span>${launcher.name}</span></div></th>`).join('')}</tr></thead>
        <tbody>${rows.map((row, i) => `<tr><th scope="row"><span class="comparison-feature">${icon(row.icon)}<span>${t.rows[i].split(' ').map(word => `<span class="${word === '/' || word === '+' ? 'comparison-separator' : 'comparison-word'}">${word}</span>`).join(' ')}</span></span></th>${row.values.map((value, col) => `<td ${col === 0 ? 'class="slh-column"' : ''}>${status(value)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="comparison-scroll-hint">${icon('arrow')}${t.swipe}</p>
  </div>
  <p class="comparison-note telemetry-note">${t.telemetryNote}</p>
  <p class="comparison-credit"><a href="https://github.com/PrismLauncher/prismlauncher.org/blob/main/public/img/logo.svg">${t.logoCredit}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a></p>`;
}
