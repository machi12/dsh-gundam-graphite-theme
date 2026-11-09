export function graphiteTokens(opacity) {
  const surface = `rgba(19,22,27,${opacity})`
  const values = {
    '--dsw-alias-bg-base': '#0c0e12',
    '--dsw-alias-bg-layer-1': surface,
    '--dsw-alias-bg-layer-2': '#1c2027',
    '--dsw-alias-bg-layer-3': '#262c35',
    '--dsw-alias-bg-module-platform': '#20252c',
    '--dsw-alias-bg-overlay': '#20242b',
    '--dsw-alias-bg-mask-1': 'rgba(0,0,0,0.72)',
    '--dsw-alias-bg-mask-2': 'rgba(0,0,0,0.5)',
    '--dsw-alias-border-l1': 'rgba(218,226,237,0.09)',
    '--dsw-alias-border-l2': 'rgba(218,226,237,0.15)',
    '--dsw-alias-border-l3': 'rgba(218,226,237,0.21)',
    '--dsw-alias-border-l4': 'rgba(218,226,237,0.3)',
    '--dsw-alias-brand-primary': '#c6cdd8',
    '--dsw-alias-brand-primary-new-colorprimary-new-color': '#c6cdd8',
    '--dsw-alias-brand-text': '#dce2eb',
    '--dsw-alias-label-primary': '#eceff4',
    '--dsw-alias-label-primary-inverted': '#12151a',
    '--dsw-alias-label-secondary': '#bbc2cd',
    '--dsw-alias-label-tertiary': '#939daa',
    '--dsw-alias-label-caption': '#a0a9b7',
    '--dsw-alias-markdown-code-block-banner': '#15191f',
    '--dsw-alias-state-business-primary': '#c6cdd8',
    '--dsw-alias-state-business-tertiary': 'rgba(197,207,224,0.16)',
    '--dsw-alias-button-primary-fill': '#b8c1cf',
    '--dsw-alias-button-primary-hover': '#d2d9e3',
    '--dsw-alias-button-info-fill': '#515e70',
    '--dsw-alias-button-info-hover': '#65758b',
    '--dsw-alias-button-elevated-fill': '#2a303a',
    '--dsw-alias-button-floating-fill': '#252a32',
    '--dsw-alias-button-floating-hover': '#363d48',
    '--dsw-alias-interactive-bg-hover': 'rgba(218,226,237,0.08)',
    '--dsw-alias-interactive-bg-active': 'rgba(218,226,237,0.14)',
    '--dsw-alias-interactive-bg-hover-solid': '#2c333d',
    '--dsw-alias-scrollbar-bg-l1': '#353d49',
    '--dsw-alias-scrollbar-bg-l2': '#46505e',
    '--dsw-alias-scrollbar-hover-l1': '#626d7e',
    '--dsw-alias-scrollbar-hover-l2': '#7b8798',
    '--dsw-alias-tooltip-bg': '#272c34',
    '--dsw-alias-toast-bg': '#252b33',
    '--dsw-specific-bubble': surface,
    '--dsw-specific-bubble-highlight': '#343c49',
    '--dsw-specific-sidebar-fill': `rgba(12,14,18,${opacity})`,
    '--dsw-specific-selector': '#252b34',
    '--dsw-specific-tip': '#20262f',
  }
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { light: value, dark: value }]))
}

export const THEME_CSS = `
html[data-gundam-graphite] { background: #0c0e12; color-scheme: dark !important; }
html[data-gundam-graphite] body { isolation: isolate; background: #0c0e12; color-scheme: dark !important; }
.gg-background { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none !important; user-select: none; }
.gg-background[hidden] { display: none; }
.gg-wallpaper { position: absolute; inset: -32px; }
/* The artboard matches background-size: cover for the 1672x941 image and 32px overscan. */
.gg-wallpaper-art { position: absolute; left: 72%; top: 50%; width: max(100%, calc(177.68vh + 114px)); aspect-ratio: 1672 / 941; transform: translate(-72%, -50%); background-image: url('__WALLPAPER__'); background-size: 0 0; }
.gg-wallpaper-art::before,.gg-wallpaper-art::after { content: ''; position: absolute; inset: 0; background-image: inherit; background-size: 100% 100%; }
.gg-wallpaper-art::before { z-index: 0; filter: blur(var(--gg-blur, 0px)); transform: translate3d(var(--gg-far-x, 0px), var(--gg-far-y, 0px), 0); transition: transform .28s ease-out; }
.gg-wallpaper-art::after { z-index: 1; -webkit-mask-image: linear-gradient(to right, transparent 38%, black 63%); mask-image: linear-gradient(to right, transparent 38%, black 63%); transform: translate3d(var(--gg-near-x, 0px), var(--gg-near-y, 0px), 0); transition: transform .28s ease-out; }
.gg-wallpaper-glow { position: absolute; inset: 0; z-index: 2; background: radial-gradient(ellipse 4% 3% at 64.5% 32%, rgba(255,38,52,.8), transparent), radial-gradient(ellipse 4% 4% at 79.8% 60.4%, rgba(255,31,46,.65), transparent), radial-gradient(ellipse 5% 3% at 66.6% 75.5%, rgba(255,37,49,.65), transparent); mix-blend-mode: screen; transform: translate3d(var(--gg-near-x, 0px), var(--gg-near-y, 0px), 0); transition: transform .28s ease-out; animation: gg-glow 5.8s ease-in-out infinite; }
.gg-wallpaper-shade { position: absolute; inset: 0; background: linear-gradient(to right, rgba(4,6,9,.42), rgba(4,6,9,.28) 30%, transparent 62%), rgba(4,6,9,var(--gg-dim)); }
.gg-background[data-glow='paused'] .gg-wallpaper-glow { animation: none; opacity: 0; }
.gg-background[data-parallax='paused'] .gg-wallpaper-art::before,.gg-background[data-parallax='paused'] .gg-wallpaper-art::after,.gg-background[data-parallax='paused'] .gg-wallpaper-glow { transition: none; }
@keyframes gg-glow { 0%,100% { opacity: .3; } 50% { opacity: .8; } }
@media (prefers-reduced-motion: reduce) { .gg-wallpaper-glow { animation: none; opacity: 0; } .gg-wallpaper-art::before,.gg-wallpaper-art::after,.gg-wallpaper-glow { transition: none; } }
.gg-background canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none !important; }
html[data-gundam-graphite] #root,
html[data-gundam-graphite] [class$='_frame'],
html[data-gundam-graphite] [class*='_frame '],
html[data-gundam-graphite] [class$='_centerCol'],
html[data-gundam-graphite] [class*='_centerCol '],
html[data-gundam-graphite] [class$='_centerCol'] > [class$='_root'],
html[data-gundam-graphite] [class$='_centerCol'] [class$='_root']:has(> [class$='_body'] > [class$='_scrollBody']) { background-color: transparent !important; }
html[data-gundam-graphite] [class$='_sidebarCol'],
html[data-gundam-graphite] [data-rightbar-col] { background: rgba(12,14,18,var(--gg-surface)) !important; }
html[data-gundam-graphite] [data-composer-seat] [class$='_card'] { background: rgba(19,22,27,var(--gg-surface)); backdrop-filter: blur(12px); }
html[data-gundam-graphite] [class*='_markdown_'],
html[data-gundam-graphite] [class*='_flowItem'] { text-shadow: 0 1px 5px rgba(0,0,0,0.8); }
html[data-gundam-graphite] ::selection { background: #a9b5c7; color: #101319; }
.gg-settings { padding: 20px 0; border-bottom: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.gg-heading { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.gg-heading strong { font-size: 16px; font-weight: 600; }
.gg-heading span { font-size: 10px; letter-spacing: .16em; opacity: .6; }
.gg-description { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.7; margin: 0 0 16px; }
.gg-fields { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px 24px; }
.gg-control { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; min-height: 28px; }
.gg-slider { display: grid; grid-template-columns: 1fr auto; gap: 8px; font-size: 12px; }
.gg-slider input { grid-column: 1 / -1; width: 100%; margin: 0; accent-color: #9daabb; }
.gg-control input { accent-color: #9daabb; width: 16px; height: 16px; }
.gg-choice { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; }
.gg-choice select { min-width: 96px; padding: 5px 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font: inherit; }
.gg-slider output { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.gg-settings input:disabled,.gg-settings select:disabled { opacity: .4; }
.gg-settings input:focus-visible,.gg-settings select:focus-visible,.gg-settings button:focus-visible { outline: 2px solid #a9b9d1; outline-offset: 4px; }
.gg-status { font-size: 12px; color: var(--dsw-alias-label-secondary); margin-top: 12px; }
.gg-reset { margin-top: 16px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l2); padding: 7px 12px; border-radius: 7px; font: inherit; font-size: 12px; cursor: pointer; }
@media(max-width:600px) { .gg-fields { grid-template-columns: minmax(0,1fr); } }
`
