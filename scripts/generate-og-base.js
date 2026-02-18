const path = require("path");
const https = require("https");

// Popular movie backdrops from TMDB (publicly accessible CDN, no API key needed)
const BACKDROP_URLS = [
  "https://image.tmdb.org/t/p/w780/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Interstellar
  "https://image.tmdb.org/t/p/w780/ilRyazdMJwN05exqhwK4tMKBYZs.jpg", // Blade Runner 2049
  "https://image.tmdb.org/t/p/w780/iopYFB1b6Bh7FWZh3onQhph1sih.jpg", // Dune (2021)
  "https://image.tmdb.org/t/p/w780/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg", // The Dark Knight
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(download(res.headers.location));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  // sharp is available in the Next.js install (no separate install needed)
  const sharp = require("sharp");
  const outFile = path.join(__dirname, "..", "public", "og-base.png");

  console.log("Downloading backdrops...");
  const buffers = await Promise.all(BACKDROP_URLS.map(download));

  console.log("Processing with sharp...");
  // Each backdrop: resize to 600x315, apply heavy blur, darken
  const CELL_W = 600, CELL_H = 315;
  const processed = await Promise.all(
    buffers.map((buf) =>
      sharp(buf)
        .resize(CELL_W, CELL_H, { fit: "cover", position: "centre" })
        .blur(28)
        .modulate({ brightness: 0.45 })
        .toBuffer()
    )
  );

  // Composite 4 cells into 1200x630 (2x2 grid)
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } },
  })
    .composite([
      { input: processed[0], top: 0, left: 0 },
      { input: processed[1], top: 0, left: 600 },
      { input: processed[2], top: 315, left: 0 },
      { input: processed[3], top: 315, left: 600 },
    ])
    .png()
    .toFile(outFile);

  console.log(`Generated ${outFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
