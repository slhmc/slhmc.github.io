# SLH website interface

Focused download-flow extension of the existing pixel-art launcher site. Preserve Pixeloid, the dark brown panel, orange actions, corner marks and existing page composition.

## Download system

- Font: existing local Pixeloid with monospace fallback. Body/control 13px, metadata 11px, platform heading 18px; inherited line heights and weight.
- Colors reuse `--surface` #161413, `--muted` #a49b94, `--fire` #ff983c, `--line` #2b2522 and page text #f5efe9. Primary and secondary buttons reuse `.button` variants. Secondary interactive borders use existing #895034; selected platform boundary uses `--fire` and an explicit device label.
- Gaps: 8px within headings/files, 12px between file buttons and platform groups, 16px between architecture groups, 24px between major regions. Platform padding 24px desktop / 16px phone. Border 1px, radius 5px. Maximum download width 960px.
- Three platforms stay visible. Detected desktop OS comes first and has primary installer actions. Phone/tablet/unknown devices get Windows, macOS, Linux with equal emphasis. macOS architectures are explicit, since browser CPU detection is unreliable.
- Three columns at >=1100px, one column below. File controls fill their group; text can wrap. Shared heading and content alignment; no absolute positioning in file lists. Minimum control height 52px, inherited padding 12px 23px and gap 12px. Pixelarticons 20px in downloads; metadata is a separate line inside each link.
- Loading reserves three platform shapes with static skeleton blocks. Failure uses saved real release metadata, a warning and retry. Published version and pre-release state are visible. Missing packages are explicit, never substituted with old packages from another release.
- Existing button transitions are 0.2s; press response is .05s with #895034 fill and .98 scale. Reduced motion retains background feedback with no transform. Desktop platform heading area reserves 64px for aligned architecture/file starts; stacked groups use their content height. Content entry fades over .2s, disabled under reduced motion. No looping skeleton animation.
- RU/EN use concise action labels. File labels distinguish installer/portable, format, architecture and size. Accessible link names include OS and launcher version.

## Scope and checks

Only downloads are extended. Existing page typography and decorative brand choices are inherited. Validate 320/375/768/1440/2560px widths, keyboard focus, OS ordering, RU/EN, loading, rate-limit recovery and reduced motion. Layout checks inspect platform edges, button padding, overflow and alignment; browser validation is recorded in the task report.
