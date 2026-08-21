import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PREVIEW_URL = "http://localhost:3000/preview/full-proposal";
const OUTPUT_PATH = path.join(process.cwd(), "output", "full-proposal.pdf");

async function main() {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();

    try {
      await page.goto(PREVIEW_URL, { waitUntil: "networkidle", timeout: 60000 });
    } catch {
      throw new Error(
        `No se pudo conectar a ${PREVIEW_URL}. Asegurate de tener "npm run dev" corriendo antes de ejecutar este script.`
      );
    }

    await page.pdf({
      path: OUTPUT_PATH,
      format: "Letter",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    console.log(`PDF generado en ${OUTPUT_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
