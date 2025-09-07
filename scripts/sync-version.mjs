// scripts/sync-version.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const appJsonPath = path.join(root, 'app.json');
const appConfigJsonPath = path.join(root, 'app.config.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function syncAppJsonVersion() {
  const pkg = readJson(pkgPath);
  const pkgVersion = pkg.version?.toString() ?? '0.0.0';

  let targetPath = null;
  if (fs.existsSync(appJsonPath)) targetPath = appJsonPath;
  else if (fs.existsSync(appConfigJsonPath)) targetPath = appConfigJsonPath;

  if (!targetPath) {
    console.warn('[version sync] No app.json or app.config.json found. Skipping Expo version sync.');
    return;
  }

  const app = readJson(targetPath);
  if (!app.expo) app.expo = {};
  app.expo.version = pkgVersion;

  writeJson(targetPath, app);
  console.log(`[version sync] Set expo.version to ${pkgVersion} in ${path.basename(targetPath)}`);
}

try {
  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found at project root.');
  }
  syncAppJsonVersion();
  console.log('[version sync] Completed successfully.');
} catch (err) {
  console.error('[version sync] FAILED:', err.message);
  process.exit(1);
}

