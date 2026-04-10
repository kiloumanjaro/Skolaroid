import assert from 'node:assert/strict';
import { moderationPolicyService } from '../src/services/moderation-policy-service';

const originalEnableContentPrescreening =
  process.env.ENABLE_CONTENT_PRESCREENING;

function restoreFeatureFlag() {
  if (originalEnableContentPrescreening === undefined) {
    delete process.env.ENABLE_CONTENT_PRESCREENING;
    return;
  }

  process.env.ENABLE_CONTENT_PRESCREENING = originalEnableContentPrescreening;
}

function runTest(name: string, assertion: () => void) {
  try {
    assertion();
    console.log(`PASS ${name}`);
  } finally {
    restoreFeatureFlag();
  }
}

runTest('flags content when a configured moderation rule is triggered', () => {
  process.env.ENABLE_CONTENT_PRESCREENING = 'true';

  const result = moderationPolicyService({
    title: 'White power rally flyer',
    description: 'Sharing materials for the event.',
  });

  assert.deepEqual(result, {
    status: 'flag',
    reasons: ['HATE_SPEECH'],
  });
});

runTest('passes content when no moderation rules are triggered', () => {
  process.env.ENABLE_CONTENT_PRESCREENING = 'true';

  const result = moderationPolicyService({
    title: 'Campus lantern parade',
    description: 'Photos from the alumni reunion at the oval.',
  });

  assert.deepEqual(result, {
    status: 'pass',
    reasons: [],
  });
});

runTest('bypasses moderation checks when the feature flag is disabled', () => {
  process.env.ENABLE_CONTENT_PRESCREENING = 'false';

  const result = moderationPolicyService({
    title: 'White power rally flyer',
    description: 'This would normally trigger a configured rule.',
  });

  assert.deepEqual(result, {
    status: 'pass',
    reasons: [],
  });
});
