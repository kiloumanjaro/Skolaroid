'use client';

import { useState, useMemo, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { RemoveMemberDialog } from '@/components/groups/RemoveMemberDialog';
import {
  useRemoveGroupMember,
  useTransferGroupOwnership,
  useUpdateGroupMemberRole,
} from '@/lib/hooks/useGroupMembers';
import { type GroupMember, type GroupMemberRole } from '@/lib/types/group';
import { cn } from '@/lib/utils';
import {
  Crown,
  ShieldCheck,
  UserMinus,
  Search,
  Users,
  Eye,
  Mail,
  Calendar,
  X,
} from 'lucide-react';

interface MembersTabProps {
  members: GroupMember[];
  canManageMembers: boolean;
  canChangeRoles: boolean;
  currentUserId: string;
  groupId: string;
  onMembersChanged?: (
    action: 'removed' | 'role-updated' | 'ownership-transferred'
  ) => void;
}

type RoleFilterType = 'ALL' | GroupMemberRole;

export function MembersTab({
  members,
  canManageMembers,
  canChangeRoles,
  currentUserId,
  groupId,
  onMembersChanged,
}: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('ALL');
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(
    null
  );
  const [memberToView, setMemberToView] = useState<GroupMember | null>(null);
  const [memberToTransfer, setMemberToTransfer] = useState<GroupMember | null>(
    null
  );
  const [roleUpdatingMemberId, setRoleUpdatingMemberId] = useState<
    string | null
  >(null);

  const removeMember = useRemoveGroupMember();
  const updateMemberRole = useUpdateGroupMemberRole();
  const transferOwnership = useTransferGroupOwnership();

  const filteredMembers = useMemo(() => {
    let filtered = members;

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'ALL') {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    return filtered;
  }, [members, searchQuery, roleFilter]);

  const handleConfirmRemove = useCallback(() => {
    if (!memberToRemove) return;

    removeMember.mutate(
      { groupId, email: memberToRemove.email },
      {
        onSuccess: () => {
          setMemberToRemove(null);
          onMembersChanged?.('removed');
        },
        onError: () => {
          // Keep dialog open so user can retry or cancel
        },
      }
    );
  }, [memberToRemove, groupId, removeMember, onMembersChanged]);

  const handleRoleChange = useCallback(
    (member: GroupMember, role: 'ADMIN' | 'MEMBER') => {
      setRoleUpdatingMemberId(member.id);

      updateMemberRole.mutate(
        {
          groupId,
          email: member.email,
          role,
        },
        {
          onSuccess: () => {
            onMembersChanged?.('role-updated');
          },
          onSettled: () => {
            setRoleUpdatingMemberId(null);
          },
        }
      );
    },
    [groupId, onMembersChanged, updateMemberRole]
  );

  const handleConfirmOwnershipTransfer = useCallback(() => {
    if (!memberToTransfer) return;

    transferOwnership.mutate(
      { groupId, email: memberToTransfer.email },
      {
        onSuccess: () => {
          setMemberToTransfer(null);
          setMemberToView(null);
          onMembersChanged?.('ownership-transferred');
        },
        onError: () => {
          // Keep dialog open so user can retry or cancel
        },
      }
    );
  }, [memberToTransfer, groupId, transferOwnership, onMembersChanged]);

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMemberInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: GroupMemberRole) => {
    if (role === 'OWNER') {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-amber-200 bg-amber-50 text-amber-700"
        >
          <Crown className="h-3 w-3" />
          Owner
        </Badge>
      );
    }
    if (role === 'ADMIN') {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-blue-200 bg-blue-50 text-blue-700"
        >
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-border bg-secondary text-muted-foreground"
      >
        Member
      </Badge>
    );
  };

  return (
    <>
      <div className="flex flex-col">
        {/* Header with member count */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Members
            </span>
            <span className="bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
              {members.length}
            </span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Role:
            </span>
            <div className="flex gap-1">
              {(['ALL', 'OWNER', 'ADMIN', 'MEMBER'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    roleFilter === role
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {role === 'ALL'
                    ? 'All'
                    : role.charAt(0) + role.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-x-auto">
          {filteredMembers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Member
                  </th>
                  <th className="px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Role
                  </th>
                  <th className="hidden px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">
                    Joined
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => {
                  const isCurrentUser = member.id === currentUserId;
                  const canRemove =
                    canManageMembers &&
                    !isCurrentUser &&
                    member.role !== 'OWNER';
                  const canEditRole =
                    canChangeRoles && !isCurrentUser && member.role !== 'OWNER';
                  const canTransferOwnership =
                    canChangeRoles && !isCurrentUser && member.role !== 'OWNER';
                  const isUpdatingRole = roleUpdatingMemberId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-secondary/50"
                    >
                      {/* Member info */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.avatarUrl ? (
                              <AvatarImage
                                src={member.avatarUrl}
                                alt={member.name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-skolaroid-blue to-blue-600 text-xs text-white">
                              {getMemberInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {member.name}
                              {isCurrentUser && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="space-y-1 px-3 py-3">
                        {getRoleBadge(member.role)}
                        {canEditRole && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant={
                                member.role === 'ADMIN'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="h-7 px-2.5 text-xs"
                              disabled={
                                isUpdatingRole || updateMemberRole.isPending
                              }
                              onClick={() => handleRoleChange(member, 'ADMIN')}
                            >
                              Admin
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                member.role === 'MEMBER'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="h-7 px-2.5 text-xs"
                              disabled={
                                isUpdatingRole || updateMemberRole.isPending
                              }
                              onClick={() => handleRoleChange(member, 'MEMBER')}
                            >
                              Member
                            </Button>
                          </div>
                        )}
                      </td>

                      {/* Joined date */}
                      <td className="hidden px-3 py-3 md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {formatJoinDate(member.joinedAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canTransferOwnership && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={transferOwnership.isPending}
                              onClick={() => setMemberToTransfer(member)}
                              title="Transfer ownership"
                            >
                              <Crown className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setMemberToView(member)}
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setMemberToRemove(member)}
                              title="Remove member"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-secondary p-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h4 className="mt-3 text-sm font-medium text-foreground">
                No members found
              </h4>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {searchQuery.trim()
                  ? `No members match "${searchQuery}"`
                  : 'No members with this role'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Remove Member Confirmation */}
      <RemoveMemberDialog
        open={!!memberToRemove}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
        memberName={memberToRemove?.name ?? ''}
        isLoading={removeMember.isPending}
        onConfirm={handleConfirmRemove}
      />

      {/* Member Detail Dialog */}
      <Dialog
        open={!!memberToView}
        onOpenChange={(open) => {
          if (!open) setMemberToView(null);
        }}
      >
        <DialogContent
          className="max-w-sm gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {memberToView?.name ?? 'Member'} Details
          </DialogTitle>

          {memberToView && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">
                  Member Details
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMemberToView(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center px-6 py-6">
                <Avatar className="h-16 w-16">
                  {memberToView.avatarUrl ? (
                    <AvatarImage
                      src={memberToView.avatarUrl}
                      alt={memberToView.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-skolaroid-blue to-blue-600 text-lg text-white">
                    {getMemberInitials(memberToView.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                  {memberToView.name}
                </h3>
                <div className="mt-1.5">{getRoleBadge(memberToView.role)}</div>
              </div>

              {/* Details */}
              <div className="space-y-3 border-t border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <Mail size={15} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-muted-foreground">
                    {memberToView.email}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar
                    size={15}
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="text-sm text-muted-foreground">
                    Joined {formatJoinDate(memberToView.joinedAt)}
                  </span>
                </div>
              </div>

              {memberToView.id !== currentUserId &&
                memberToView.role !== 'OWNER' &&
                (canManageMembers || canChangeRoles) && (
                  <div className="space-y-2 border-t border-border px-6 py-4">
                    {canChangeRoles && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled={transferOwnership.isPending}
                        onClick={() => setMemberToTransfer(memberToView)}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Transfer Ownership
                      </Button>
                    )}
                    {canManageMembers && (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setMemberToRemove(memberToView);
                          setMemberToView(null);
                        }}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove from Group
                      </Button>
                    )}
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!memberToTransfer}
        onOpenChange={(open) => {
          if (!open) setMemberToTransfer(null);
        }}
      >
        <DialogContent
          className="max-w-sm gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Transfer ownership</DialogTitle>

          {memberToTransfer && (
            <div className="flex flex-col">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-kalam text-lg font-semibold text-foreground">
                  Transfer Ownership?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {memberToTransfer.name} will become the new owner and you will
                  be changed to admin.
                </p>
              </div>

              <div className="bg-secondary/40 px-6 py-4 text-sm text-muted-foreground">
                Group memories remain in this group after ownership changes.
              </div>

              <div className="flex justify-end gap-2 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setMemberToTransfer(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  disabled={transferOwnership.isPending}
                  onClick={handleConfirmOwnershipTransfer}
                >
                  Transfer Ownership
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
