import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const baseUrl = "http://localhost:3100";
const env = {
  ...process.env,
  DATABASE_URL: path.resolve("data/e2e-proposals.db"),
  LIBRARY_UPLOAD_DIRECTORY: path.resolve("data/e2e-uploads"),
  E2E_BASE_URL: baseUrl,
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.resolve("tests/fixtures/google-fonts.cjs"),
};

async function responds(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(750) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntilReady(server) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode != null) throw new Error(`The E2E server exited with code ${server.exitCode}.`);
    if (await responds(`${baseUrl}/api/health`)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("The E2E server did not become ready within 120 seconds.");
}

function stopProcessTree(child) {
  if (child.exitCode != null || child.pid == null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  child.kill("SIGTERM");
}

if (await responds(`${baseUrl}/api/health`)) {
  throw new Error(`Port 3100 is already serving an application. Stop it before running the isolated E2E suite.`);
}

// Serves the production build produced by `pretest:e2e` — see the comment
// there for why the suite does not run against `next dev`.
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "localhost", "--port", "3100"],
  { env, stdio: "inherit", windowsHide: true }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopProcessTree(server);
    process.exit(signal === "SIGINT" ? 130 : 143);
  });
}

let exitCode = 1;
try {
  await waitUntilReady(server);
  const tests = spawn(
    process.execPath,
    ["node_modules/playwright/cli.js", "test", ...process.argv.slice(2)],
    { env, stdio: "inherit", windowsHide: true }
  );
  exitCode = await new Promise((resolve, reject) => {
    tests.once("error", reject);
    tests.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  stopProcessTree(server);
}

process.exit(exitCode);
