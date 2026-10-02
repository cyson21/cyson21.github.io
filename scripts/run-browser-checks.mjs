import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { changedPaths, testPlan } from './ci-test-scope.mjs';
const plan = process.env.CI_BROWSER_PLAN ? JSON.parse(process.env.CI_BROWSER_PLAN) : testPlan(changedPaths(process.argv[2]));
if (plan.scope === 'docs') { console.log('Documentation only: no browser checks.'); process.exit(0); }
const files = plan.scope === 'full' ? [] : plan.files.map(file => `tests/e2e/${file}`);
console.log(`Browser checks: ${plan.scope}; routes: ${plan.routes?.join(', ') ?? 'all'}`);
const result = spawnSync(process.execPath, [resolve('node_modules/@playwright/test/cli.js'), 'test', ...files], {
  stdio: 'inherit', env: { ...process.env, CI_TEST_SCOPE: plan.scope, CI_AUDIT_ROUTES: JSON.stringify(plan.routes) },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
