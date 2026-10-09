'use strict';
const { spawnSync } = require('node:child_process');
const ui = process.argv.includes('--ui');
const result = spawnSync(process.execPath, ui ? ['tests/ui.test.cjs'] : ['--test', 'tests/api.test.cjs', 'tests/mysql.test.cjs'], {
  stdio: 'inherit', env: { ...process.env, CONNECTNET_TEST_MODE: 'mysql' },
});
if (result.error) { console.error(result.error.message); process.exitCode = 1; }
else process.exitCode = result.status ?? 1;
