import {
  moderationPolicyRules,
  type ModerationPolicyRule,
} from '../config/moderation-policy-rules';

export interface ModerationPolicyInput {
  title: string;
  description?: string | null;
}

export interface ModerationPolicyResult {
  status: 'pass' | 'flag';
  reasons: string[];
}

export function isContentPrescreeningEnabled(): boolean {
  return (
    process.env.ENABLE_CONTENT_PRESCREENING?.trim().toLowerCase() === 'true'
  );
}

function matchesRule(content: string, rule: ModerationPolicyRule): boolean {
  return rule.keywords.some((keyword) =>
    content.includes(keyword.toLowerCase())
  );
}

export function moderationPolicyService(
  input: ModerationPolicyInput
): ModerationPolicyResult {
  if (!isContentPrescreeningEnabled()) {
    return {
      status: 'pass',
      reasons: [],
    };
  }

  const content = `${input.title} ${input.description ?? ''}`.toLowerCase();
  const reasons = moderationPolicyRules
    .filter((rule) => matchesRule(content, rule))
    .map((rule) => rule.reasonCode);

  return reasons.length > 0
    ? {
        status: 'flag',
        reasons,
      }
    : {
        status: 'pass',
        reasons: [],
      };
}
