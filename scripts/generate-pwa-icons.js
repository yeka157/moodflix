/**
 * Moodflix PWA icon generator
 *
 * Generates all required PWA icon sizes from a programmatically built SVG
 * matching the MoodflixIcon component design (components/brand/moodflix-icon.tsx).
 *
 * Design:
 *   - Background: #09090b (Moodflix dark)
 *   - M letterform: #FB2C36 (brand crimson)
 *   - Film-strip perforations: cut-out rects on the left stroke of the M
 *   - Subtle crimson radial glow behind the M for cinematic depth
 *
 * Usage:
 *   node scripts/generate-pwa-icons.js
 *
 * Output files:
 *   public/icon-192.png       — 192×192  standard PWA icon
 *   public/icon-512.png       — 512×512  standard PWA icon
 *   public/icon-maskable.png  — 512×512  maskable icon (safe-zone compliant)
 *   public/apple-touch-icon.png — 180×180  Apple touch icon
 */

"use strict";

const path = require("path");
const fs = require("fs").promises;

// ---------------------------------------------------------------------------
// SVG source builders
// ---------------------------------------------------------------------------

/**
 * Build the Moodflix icon SVG.
 *
 * @param {object} opts
 * @param {number} opts.size         Canvas size in viewBox units (always 100)
 * @param {number} opts.scale        Scale factor for the artwork (1.0 = 70%, 0.857 = 60%)
 * @param {boolean} opts.glow        Whether to include the crimson radial glow
 * @returns {string} SVG markup
 */
function buildIconSvg({ scale, glow }) {
  // All artwork is designed on a 100×100 viewBox.
  // We shift/scale the artwork group to achieve the desired canvas fill %.
  const BG = "#09090b";
  const CRIMSON = "#FB2C36";
  const CUT = "#09090b"; // cut-out colour (must match background)

  // Translation to keep artwork centred after scaling
  const translate = (100 - 100 * scale) / 2;
  const transform = `translate(${translate}, ${translate}) scale(${scale})`;

  const glowDefs = glow
    ? `
  <defs>
    <radialGradient id="glow" cx="50%" cy="55%" r="42%" gradientUnits="userSpaceOnUse">
      <stop offset="0%"  stop-color="${CRIMSON}" stop-opacity="0.28"/>
      <stop offset="60%" stop-color="${CRIMSON}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${CRIMSON}" stop-opacity="0"/>
    </radialGradient>
  </defs>`
    : "";

  const glowEllipse = glow
    ? `<ellipse cx="50" cy="55" rx="42" ry="38" fill="url(#glow)"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <!-- Background -->
  <rect width="100" height="100" fill="${BG}"/>
  ${glowDefs}
  <g transform="${transform}">
    ${glowEllipse}
    <!-- Bold M letterform — inner corners at y=46 for thick diagonals -->
    <path
      d="M8 88 L8 12 L50 58 L92 12 L92 88 L80 88 L80 46 L50 70 L20 46 L20 88 Z"
      fill="${CRIMSON}"
    />
    <!-- 2px separation gap between film strip and M body -->
    <rect x="20" y="10" width="2" height="80" fill="${CUT}"/>
    <!-- Film-strip: 6 cut-out holes on the left stroke (x: 9–19) -->
    <rect x="9" y="15" width="10" height="10" fill="${CUT}"/>
    <rect x="9" y="27" width="10" height="10" fill="${CUT}"/>
    <rect x="9" y="39" width="10" height="10" fill="${CUT}"/>
    <rect x="9" y="51" width="10" height="10" fill="${CUT}"/>
    <rect x="9" y="63" width="10" height="10" fill="${CUT}"/>
    <rect x="9" y="75" width="10" height="10" fill="${CUT}"/>
  </g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Icon specs
// ---------------------------------------------------------------------------

const ICON_SPECS = [
  {
    name: "icon-192.png",
    px: 192,
    scale: 0.7,  // M fills ~70% of canvas
    glow: true,
  },
  {
    name: "icon-512.png",
    px: 512,
    scale: 0.7,  // M fills ~70% of canvas
    glow: true,
  },
  {
    name: "icon-maskable.png",
    px: 512,
    scale: 0.6,  // M at 60% — subject fits within inner 80% safe-zone circle
    glow: true,
  },
  {
    name: "apple-touch-icon.png",
    px: 180,
    scale: 0.7,  // Same design as icon-192
    glow: true,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // sharp is bundled with Next.js — no separate install needed
  const sharp = require("sharp");
  const PUBLIC_DIR = path.join(__dirname, "..", "public");

  console.log("Generating Moodflix PWA icons...\n");

  for (const spec of ICON_SPECS) {
    const svg = buildIconSvg({ scale: spec.scale, glow: spec.glow });
    const svgBuf = Buffer.from(svg);

    const outPath = path.join(PUBLIC_DIR, spec.name);

    await sharp(svgBuf)
      .resize(spec.px, spec.px)
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(outPath);

    // Verify dimensions
    const meta = await sharp(outPath).metadata();
    console.log(
      `  ${spec.name.padEnd(24)} ${meta.width}x${meta.height}px  (scale=${spec.scale})`
    );
  }

  console.log("\nDone. All icons written to public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
