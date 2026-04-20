import assert from 'node:assert/strict';

type ReportState = 'OPEN' | 'RESOLVED' | 'DISMISSED';
type ResolveAction = 'RESOLVED' | 'DISMISSED';

/** Mirrors the guard in /api/prisma/report/admin/resolve/route.ts */
function canResolve(state: ReportState): { allowed: boolean; message: string } {
  if (state === 'OPEN') return { allowed: true, message: '' };
  return {
    allowed: false,
    message: 'Report has already been resolved or dismissed',
  };
}

const ACTION_MAP: Record<ResolveAction, string> = {
  RESOLVED: 'REPORT_RESOLVED',
  DISMISSED: 'REPORT_DISMISSED',
};

function runTest(name: string, assertion: () => void) {
  try {
    assertion();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

runTest('allows transition when report is OPEN', () => {
  assert.deepEqual(canResolve('OPEN'), { allowed: true, message: '' });
});

runTest('blocks transition when report is already RESOLVED', () => {
  const result = canResolve('RESOLVED');
  assert.equal(result.allowed, false);
  assert.ok(result.message.length > 0);
});

runTest('blocks transition when report is already DISMISSED', () => {
  const result = canResolve('DISMISSED');
  assert.equal(result.allowed, false);
  assert.ok(result.message.length > 0);
});

runTest('ACTION_MAP maps RESOLVED to REPORT_RESOLVED', () => {
  assert.equal(ACTION_MAP['RESOLVED'], 'REPORT_RESOLVED');
});

runTest('ACTION_MAP maps DISMISSED to REPORT_DISMISSED', () => {
  assert.equal(ACTION_MAP['DISMISSED'], 'REPORT_DISMISSED');
});
