import { test, expect } from '@playwright/test';
import {
  toGroup,
  toGroupMember,
} from '../src/components/groups/GroupPanel.helpers';
import type {
  GroupResponse,
  GroupMemberResponse,
} from '../src/lib/hooks/useCreateGroup';

/**
 * Post-refactor structural test for GroupPanel. Asserts that the API → frontend
 * transforms extracted into GroupPanel.helpers.ts produce the same shape the
 * inline versions used to produce.
 */
test.describe('GroupPanel — post-refactor helpers', () => {
  const baseMember: GroupMemberResponse = {
    id: 'u1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'MEMBER',
    joinedAt: '2025-01-02T00:00:00.000Z',
  } as unknown as GroupMemberResponse;

  test('toGroupMember composes a display name from first + last', () => {
    const result = toGroupMember(baseMember, null);
    expect(result.id).toBe('u1');
    expect(result.name).toBe('Ada Lovelace');
    expect(result.email).toBe('ada@example.com');
    expect(result.role).toBe('MEMBER');
    expect(result.joinedAt).toBe('2025-01-02T00:00:00.000Z');
  });

  test('toGroupMember promotes the member to OWNER when id matches creatorId', () => {
    const noRole = {
      ...baseMember,
      role: undefined,
    } as unknown as GroupMemberResponse;
    const result = toGroupMember(noRole, 'u1');
    expect(result.role).toBe('OWNER');
  });

  test('toGroupMember falls back to email when names are missing', () => {
    const noName = {
      ...baseMember,
      firstName: null,
      lastName: null,
    } as unknown as GroupMemberResponse;
    const result = toGroupMember(noName, null);
    expect(result.name).toBe('ada@example.com');
  });

  test('toGroup maps an API response into the frontend Group shape', () => {
    const apiGroup = {
      id: 'g1',
      name: 'Mathletes',
      description: 'A group',
      message: 'Welcome',
      creatorId: 'u1',
      members: [baseMember],
      groupMemberships: [
        { userId: 'u1', role: 'OWNER', joinedAt: '2025-01-02T00:00:00.000Z' },
      ],
      rolePrivileges: [],
      currentUserRole: 'OWNER',
      createdAt: '2025-01-01T00:00:00.000Z',
      _count: { members: 1, memories: 4 },
    } as unknown as GroupResponse;

    const result = toGroup(apiGroup);
    expect(result.id).toBe('g1');
    expect(result.name).toBe('Mathletes');
    expect(result.privacy).toBe('PRIVATE');
    expect(result.visibility).toBe('VISIBLE');
    expect(result.memberCount).toBe(1);
    expect(result.postCount).toBe(4);
    expect(result.ownerId).toBe('u1');
    expect(result.members).toHaveLength(1);
    expect(result.members[0].name).toBe('Ada Lovelace');
  });
});
