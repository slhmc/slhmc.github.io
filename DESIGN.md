# SLH website interface

The user-provided second image is the download-region reference: a quiet dark frame with three compact platform cards, the detected OS larger in the center. Keep the existing Pixeloid font, orange actions and pixel corners. Work remains local until publication is requested.

## Download composition

- Centered heading «Скачать лаунчер» / «Download the launcher»: 28px (24px below 760px), 1.5 line height, weight 400; accent word uses --fire, weight 700. Bottom gap 28px.
- Frame inherits the 7px radius and corner marks; dark #100e0c canvas with the existing warm radial accent. Minimum height 400px; padding 64px 36px, below 1050px 56px 24px 28px, below 760px 32px 20px 24px.
- Cards max-width 1100px (1200px above 1600px). Three grid columns .85fr / 1.15fr / .85fr when a desktop OS is detected; otherwise three equal columns. Gaps 20px, 12px below 1050px. Center-align cards vertically. Below 760px stack at max-width 380px with 16px gaps, recommended card first.
- Alternative cards: 16px padding, 10px radius, 1px #53301c border, brown gradient #2a1d16 to #15110f. Main card: 20px padding, #df7748 border, #392115 to #1a130f background, subtle 24px #cd491e14 glow. The reference explicitly authorizes this warm card treatment.
- Headings: 18px alternatives, 22px main, line height 1.5. Supporting architecture/format 11px #b1a093; option area min-height 36px, 8px bottom gap. Badge 10px (9px tablet), #edaa77 text, #895034 border, 12px radius, 3px 8px padding.
- OS marks use bundled Pixelarticons solid Apple/Linux shapes. Apple gets six rainbow bands; Linux uses black silhouette, cream body and yellow beak/feet. Windows uses four colored panes. Cream tile #f2e4cd, 44px square (50px main), 9px radius; inner symbol 32px. Windows panes: #f35325, #81bc06, #05a6f0, #ffba08. Icons are decorative and hidden from assistive technology.
- Exactly two card actions: installer and portable. Windows installer chooses EXE, with MSI fallback only if needed. Mac switches both DMG and App ZIP between Apple Silicon and Intel; toggle selection survives language changes. Linux installer opens a popover above the button with actual DEB/RPM files; AppImage is portable.
- Action grid: two equal columns, 8px gap. Buttons minimum 40px, main 44px; padding 8px 10px; 11px type, main 12px; 16px icons, 8px gap. Tablet uses 10px / 11px type and 6px gaps. Phones restore 44px targets / 12px type. Radius 5px. Use inherited primary button; secondary background #110f0c, #895034 border, hover #2a201a / #df7748.
- Mac toggle: 5px outer radius, 2px inset/gaps, 1px #53301c border; buttons 26px minimum, 3px 8px padding, 10px type; selected #53301c / #f5efe9, hover --fire. Combined option target remains accessible; keyboard operates both buttons.
- Linux popover: absolute bottom 100% + 8px, z-index 10, 8px padding, 7px radius, #1b1714 surface, #895034 border, 0 8px 24px #0008 shadow. Links 36px targets and 12px type; 16px icons. Escape/outside pointer/focus departure close it. Arrow keys navigate formats.
- Version/status and release link form a centered metadata row, 24px above, gaps 8px 16px, 11px text. Keep real version/pre-release status; do not copy invented safety/star counts from references. Community links remain in the page footer, outside the download frame.
- Loading: three static 200px skeleton blocks, 10px radius, 20px gaps. Failure preserves real snapshot downloads, explains the failed check and offers retry.
- Motion: inherited .2s hover and release; .05s press with .98 scale and #895034 fill; Mac toggle .96 scale. Reduced motion retains color feedback without transforms. No automatic content-reveal animation.

## Validation scope

Validate 320/375/768/1280/1440 widths, RU/EN, device ordering, Mac link changes, Linux top-opening popup, Escape/outside/focus recovery, loading and API failure. Preserve other sections. Local server: http://127.0.0.1:3001/. Do not push or deploy without a new user request.

Latest spacing revision: metadata sits directly below the heading, before cards; heading gap 8px, metadata bottom gap 20px. Frame has no minimum height; padding 36px desktop, 28px 24px tablet, 24px 20px phone. Center card is determined by detectOS; unknown devices use equal cards.

Footer author link: local 24px Minecraft head for UUID f3bc3d6b898e48f78373f6e8866909cc (confirmed from grld.pages.dev), 3px radius, pixelated rendering; 12px text, 8px gap, 32px target. Link «Автор — Gareld» / «Author — Gareld» opens https://grld.pages.dev/. Inherits muted text, bright author name, orange hover and .2s transition; press .98, disabled for reduced motion.

Footer refinement: replace the redundant slogan with the author credit beneath the brand, keeping two lines. Identity gap 6px, author image 20px and 24px minimum link height. Header adds the supplied gareld-smile.svg after GitHub, linking to grld.pages.dev; 24px icon (20px mobile), pixelated, opacity .75 to 1 on hover, .92 press scale without motion under reduced motion.

Footer final grouping: social links form a vertical column of 32px targets / 12px type; author sits to their right with a 48px head above the 11px caption, 8px gap. Group uses 28px horizontal gap (32px phone). Desktop footer columns 1fr / 1.4fr / 1fr, 32px gaps; below 1000px legal text moves below identity and connection group; below 600px center all three groups. Both author links open grld.pages.dev in a new tab with noopener noreferrer.

Footer brand mirrors the author: 48px logo above 12px name, 8px gap, centered. OS symbol containers now have transparent backgrounds; dimensions and inner colors stay unchanged. Comparison: Rust is an orange underlined external link; Minecraft game-support cell is yellow #dba95e with «Кроме Rust» / «Except Rust» tooltip and keyboard focus. Local servers row uses yes for SLH and no for all other columns, per author instructions.

Comparison refinement: local servers row follows full customization in both languages. Rust inherits the row text color at rest; orange underline appears only on hover/keyboard focus, bright underline on press.
