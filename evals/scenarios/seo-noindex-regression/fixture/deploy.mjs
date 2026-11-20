// Production deploy step used by CI: build, then upload dist/ (upload omitted here).
import { spawnSync } from 'node:child_process';

const r = spawnSync(process.execPath, ['build.mjs'], { stdio: 'inherit', env: { ...process.env, SITE_ENVIRONMENT: 'production' } });
process.exit(r.status ?? 1);
