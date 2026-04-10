export interface ModerationPolicyRule {
  reasonCode: string;
  keywords: string[];
}

export const moderationPolicyRules: ModerationPolicyRule[] = [
  {
    reasonCode: 'HATE_SPEECH',
    keywords: ['racial slur', 'ethnic cleansing', 'white power'],
  },
  {
    reasonCode: 'EXPLICIT_CONTENT',
    keywords: ['porn', 'nude', 'sex tape'],
  },
  {
    reasonCode: 'VIOLENCE',
    keywords: ['kill them all', 'massacre', 'beheading'],
  },
];
