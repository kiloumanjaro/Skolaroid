'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  type GroupMemberRole,
  type GroupPermissionKey,
  type GroupRolePrivileges,
} from '@/lib/group-permissions';
import { useUpdateGroupRolePrivileges } from '@/lib/hooks/useGroupRolePrivileges';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  PencilLine,
  Shield,
  BarChart3,
  Mail,
  Lock,
  Crown,
  Sparkles,
} from 'lucide-react';

interface RolesTabProps {
  groupId: string;
  rolePrivileges: GroupRolePrivileges;
  currentUserRole?: GroupMemberRole;
  onPrivilegesSaved?: (rolePrivileges: GroupRolePrivileges) => void;
}

const roleOrder: GroupMemberRole[] = ['OWNER', 'ADMIN', 'MEMBER'];

const roleMeta: Record<
  GroupMemberRole,
  {
    label: string;
  }
> = {
  OWNER: {
    label: 'Owner',
  },
  ADMIN: {
    label: 'Admin',
  },
  MEMBER: {
    label: 'Member',
  },
};

const permissionMeta: Array<{
  key: GroupPermissionKey;
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  {
    key: 'editContent',
    label: 'Edit content',
    description: 'Create and update group memories and posts.',
    Icon: PencilLine,
  },
  {
    key: 'manageMembers',
    label: 'Manage members',
    description: 'Add, remove, and adjust member roles.',
    Icon: Shield,
  },
  {
    key: 'viewAnalytics',
    label: 'View analytics',
    description: 'Access engagement stats and group activity insights.',
    Icon: BarChart3,
  },
  {
    key: 'sendInvitations',
    label: 'Send invitations',
    description: 'Invite new people into the group.',
    Icon: Mail,
  },
];

function isOwnerPermissionLocked(permission: GroupPermissionKey) {
  return permission === 'manageMembers' || permission === 'sendInvitations';
}

const rolePanelStyles: Record<
  GroupMemberRole,
  {
    panel: string;
    header: string;
    badge: string;
  }
> = {
  OWNER: {
    panel: 'bg-[#efece9]',
    header: 'bg-[#f6cb48]',
    badge: 'border-black bg-white text-black',
  },
  ADMIN: {
    panel: 'bg-[#efece9]',
    header: 'bg-[#4384dc]',
    badge: 'border-black bg-white text-black',
  },
  MEMBER: {
    panel: 'bg-[#efece9]',
    header: 'bg-[#c78ae6]',
    badge: 'border-black bg-white text-black',
  },
};

function getRoleIcon(role: GroupMemberRole) {
  if (role === 'OWNER') return Crown;
  if (role === 'ADMIN') return Shield;
  return Sparkles;
}

export function RolesTab({
  groupId,
  rolePrivileges,
  currentUserRole,
  onPrivilegesSaved,
}: RolesTabProps) {
  const [draft, setDraft] = useState<GroupRolePrivileges>(rolePrivileges);
  const updatePrivileges = useUpdateGroupRolePrivileges(groupId);
  const isOwner = currentUserRole === 'OWNER';

  useEffect(() => {
    setDraft(rolePrivileges);
  }, [rolePrivileges]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(rolePrivileges),
    [draft, rolePrivileges]
  );

  const updatePermission = (
    role: GroupMemberRole,
    permission: GroupPermissionKey,
    checked: boolean
  ) => {
    setDraft((previous) => ({
      ...previous,
      [role]: {
        ...previous[role],
        [permission]: checked,
      },
    }));
  };

  const handleSave = () => {
    updatePrivileges.mutate(draft, {
      onSuccess: (result) => {
        setDraft(result.rolePrivileges);
        onPrivilegesSaved?.(result.rolePrivileges);
      },
    });
  };

  const handleReset = () => {
    setDraft(rolePrivileges);
  };

  const enabledCounts = useMemo(() => {
    return roleOrder.reduce(
      (acc, role) => {
        acc[role] = permissionMeta.filter(({ key }) => draft[role][key]).length;
        return acc;
      },
      {} as Record<GroupMemberRole, number>
    );
  }, [draft]);

  return (
    <div className="flex flex-col bg-[#f8f4ea]">
      <div className="space-y-4 px-3 py-3 sm:px-4 sm:py-4">
        <section className="overflow-hidden border-2 border-black bg-[#fffdf8]">
          <div className="border-b-2 border-black bg-[#efece9] px-4 py-2.5 text-black sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Role Privileges
                </h2>
              </div>
              <Badge
                className="w-fit rounded-none border-2 border-black bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-black"
                style={{ borderRadius: 0 }}
              >
                <Lock className="mr-1 h-3 w-3" />
                Owner Settings
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 bg-[#fffdf8] p-3 sm:grid-cols-3">
            {roleOrder.map((role) => (
              <div
                key={`${role}-summary`}
                className={cn(
                  'border-2 border-black px-4 py-3',
                  rolePanelStyles[role].panel
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-black/70">
                  {roleMeta[role].label}
                </p>
                <p className="mt-1 text-2xl font-black text-black">
                  {enabledCounts[role]}
                </p>
                <p className="text-xs font-medium text-black/70">
                  active permissions
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {roleOrder.map((role, index) => {
            const RoleIcon = getRoleIcon(role);

            return (
              <section
                key={role}
                className={cn(
                  'overflow-hidden border-2 border-black',
                  rolePanelStyles[role].panel,
                  index % 2 === 0 ? 'rotate-[0.2deg]' : '-rotate-[0.2deg]'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col gap-2 border-b-2 border-black px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                    rolePanelStyles[role].header,
                    role === 'ADMIN' ? 'text-white' : 'text-black'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <RoleIcon className="h-3.5 w-3.5" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em]">
                      {roleMeta[role].label}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'w-fit rounded-none border-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]',
                      rolePanelStyles[role].badge
                    )}
                    style={{ borderRadius: 0 }}
                  >
                    {enabledCounts[role]} of {permissionMeta.length} enabled
                  </Badge>
                </div>

                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  {permissionMeta.map(({ key, label, description, Icon }) => {
                    const locked =
                      role === 'OWNER' && isOwnerPermissionLocked(key);
                    const disabled =
                      !isOwner || locked || updatePrivileges.isPending;

                    return (
                      <div
                        key={key}
                        className={cn(
                          'flex items-start justify-between gap-3 border-2 border-black bg-white px-3 py-3',
                          disabled && 'opacity-80'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 border-2 border-black bg-[#fff1bf] p-1.5">
                            <Icon className="h-3.5 w-3.5 text-black" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-black">
                              {label}
                            </p>
                            <p className="text-xs text-[#5a5a5a]">
                              {description}
                            </p>
                            {locked && (
                              <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#7a1111]">
                                Locked for owner safety.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Checkbox
                            checked={draft[role][key]}
                            disabled={disabled}
                            onCheckedChange={(checked) => {
                              updatePermission(role, key, checked === true);
                            }}
                            aria-label={`${role} ${label}`}
                            className="h-5 w-5 rounded-none border-2 border-black data-[state=checked]:border-black data-[state=checked]:bg-[#4384dc] data-[state=checked]:text-white"
                          />
                          <span
                            className={cn(
                              'text-[11px] font-semibold uppercase tracking-[0.08em]',
                              draft[role][key] ? 'text-black' : 'text-[#5a5a5a]'
                            )}
                          >
                            {draft[role][key] ? 'On' : 'Off'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="flex flex-col gap-3 border-2 border-black bg-[#f8f4ea] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {updatePrivileges.isError ? (
                <p className="text-sm font-semibold text-[#7a1111]">
                  {updatePrivileges.error.message}
                </p>
              ) : (
                <p className="text-sm font-medium text-black">
                  {isOwner
                    ? 'Review the matrix, then save when the permissions look right.'
                    : 'Only the group owner can change role privileges.'}
                </p>
              )}
              <p className="text-xs uppercase tracking-[0.08em] text-[#5a5a5a]">
                {isDirty ? 'Unsaved changes' : 'Everything is up to date'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty || updatePrivileges.isPending}
                className="border-2 border-black bg-white font-semibold text-black hover:bg-[#dbe8ff]"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isOwner || !isDirty || updatePrivileges.isPending}
                className="border-2 border-black bg-[#4384dc] font-semibold text-white hover:bg-[#3772c4]"
              >
                {updatePrivileges.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save Privileges
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
