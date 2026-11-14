import { writeFileSync } from "node:fs";
import path from "node:path";
import { renderSiteShareImage } from "@/modules/share-images/share-image-renderer";

/**
 * Writes the site-wide Open Graph card to web/public/og.png. The card is
 * static, so it is rendered once and committed rather than served by the API.
 */
async function main() {
  const target = path.resolve(__dirname, "../../../web/public/og.png");
  writeFileSync(target, await renderSiteShareImage());
  console.log(`Wrote ${target}`);
}

main();
