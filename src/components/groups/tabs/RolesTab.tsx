'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  type GroupMemberRole,
  type GroupPermissionKey,
  type GroupRolePrivileges,
} from '@/lib/group-permissions';
import { useUpdateGroupRolePrivileges } from '@/lib/hooks/useGroupRolePrivileges';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    description: string;
  }
> = {
  OWNER: {
    label: 'Owner',
    description: 'Controls group settings and role policy.',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Helps moderate members and keep the group active.',
  },
  MEMBER: {
    label: 'Member',
    description: 'Contributes content and joins day-to-day activity.',
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

  return (
    <div className="space-y-4">
      <Card style={{ borderRadius: '1rem' }}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Role Privileges</CardTitle>
              <CardDescription>
                Define what each role can do. Changes apply to everyone with
                that role.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="gap-1"
              style={{ borderRadius: 0 }}
            >
              <Lock className="h-3 w-3" />
              Owner Settings
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {roleOrder.map((role) => (
        <Card key={role} style={{ borderRadius: '1rem' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{roleMeta[role].label}</span>
              <Badge variant="outline" style={{ borderRadius: 0 }}>
                {role}
              </Badge>
            </CardTitle>
            <CardDescription>{roleMeta[role].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {permissionMeta.map(({ key, label, description, Icon }) => {
              const locked = role === 'OWNER' && isOwnerPermissionLocked(key);
              const disabled = !isOwner || locked || updatePrivileges.isPending;

              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 border-2 border-border/40 bg-secondary/30 px-3 py-2"
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 text-skolaroid-blue" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                      {locked && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Locked for owner safety.
                        </p>
                      )}
                    </div>
                  </div>

                  <Checkbox
                    checked={draft[role][key]}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      updatePermission(role, key, checked === true);
                    }}
                    aria-label={`${role} ${label}`}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {updatePrivileges.isError && (
          <p className="mr-auto text-sm text-red-500">
            {updatePrivileges.error.message}
          </p>
        )}
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!isDirty || updatePrivileges.isPending}
          style={{ borderRadius: 0 }}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isOwner || !isDirty || updatePrivileges.isPending}
          style={{ borderRadius: 0 }}
        >
          {updatePrivileges.isPending && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Save Privileges
        </Button>
      </div>

      {!isOwner && (
        <p className="text-xs text-muted-foreground">
          Only the group owner can modify role privileges.
        </p>
      )}
    </div>
  );
}
