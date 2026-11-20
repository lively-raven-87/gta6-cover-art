// Vice Cover Lab — the entry program (Node 22, standard library only).
//
// It hands the app in: copies this repository's app/ and screenshots/ into the
// output folder and writes dossier.json there with the vendored make.fun
// library, so the judge can read the app and its screenshots.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shots = join(repoRoot, 'screenshots');
if (existsSync(shots)) copyTree(shots, join(outputDir, 'screenshots'));

// The scorer's own caps: only text_max_bytes shapes the dossier's bytes; the
// rest refuse an entry the scorer would refuse — more than 4 screenshots or
// one over 256 KiB, more than 993 files in app/ or 48 MiB of app files in all,
// or a path under app/ over 1000 bytes.
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierLimits));
console.log(`dossier written to ${join(outputDir, 'dossier.json')}`);
console.log(`app/ and screenshots/ copied to ${outputDir}`);
