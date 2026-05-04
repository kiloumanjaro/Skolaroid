'use client';

import { useState, useMemo, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
          className="flex items-center gap-1 border-2 border-black bg-[#f6cb48] font-semibold text-black"
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
          className="flex items-center gap-1 border-2 border-black bg-[#4384dc] font-semibold text-white"
        >
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-2 border-black bg-white font-semibold text-black"
      >
        Member
      </Badge>
    );
  };

  return (
    <>
      <div className="flex flex-col bg-[#f8f4ea]">
        {/* Search and Filter Controls */}
        <div className="bg-[#fffdf8] px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full border-2 border-black bg-card py-3 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-black focus:outline-none focus:ring-1 focus:ring-skolaroid-blue"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 py-3">
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'OWNER', 'ADMIN', 'MEMBER'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    'border-2 border-black px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
                    roleFilter === role
                      ? 'bg-[#f6cb48] text-black'
                      : 'bg-white text-black hover:bg-[#f7d6d5]'
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
        <div className="flex-1 overflow-x-auto bg-[#fffdf8] px-3 pt-1">
          {filteredMembers.length > 0 ? (
            <table className="w-full border-2 border-black">
              <thead>
                <tr className="border-b-2 border-black bg-[#4384dc] text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    Member
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    Role
                  </th>
                  <th className="hidden px-3 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white md:table-cell">
                    Joined
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
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
                      className="border-b-2 border-black transition-colors hover:bg-[#fff1bf]"
                    >
                      {/* Member info */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-black bg-white">
                            {member.avatarUrl ? (
                              <AvatarImage
                                src={member.avatarUrl}
                                alt={member.name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-white text-xs font-bold text-black">
                              {getMemberInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-black">
                              {member.name}
                              {isCurrentUser && (
                                <span className="ml-1 text-xs font-medium uppercase tracking-[0.08em] text-[#5a5a5a]">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-[#5a5a5a]">
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
                              className={cn(
                                'h-7 border-2 border-black px-2.5 text-xs font-semibold uppercase tracking-[0.08em]',
                                member.role === 'ADMIN'
                                  ? 'bg-[#4384dc] text-white hover:bg-[#3772c4]'
                                  : 'bg-white text-black hover:bg-[#dbe8ff]'
                              )}
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
                              className={cn(
                                'h-7 border-2 border-black px-2.5 text-xs font-semibold uppercase tracking-[0.08em]',
                                member.role === 'MEMBER'
                                  ? 'bg-[#f6cb48] text-black hover:bg-[#e5ba2d]'
                                  : 'bg-white text-black hover:bg-[#fff1bf]'
                              )}
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
                        <span className="text-xs font-medium text-[#5a5a5a]">
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
                              className="h-8 w-8 border-2 border-black bg-white hover:bg-[#f6cb48]"
                              disabled={transferOwnership.isPending}
                              onClick={() => setMemberToTransfer(member)}
                              title="Transfer ownership"
                            >
                              <Crown className="h-3.5 w-3.5 text-black" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 border-2 border-black bg-white hover:bg-[#dbe8ff]"
                            onClick={() => setMemberToView(member)}
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5 text-black" />
                          </Button>
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 border-2 border-black bg-white text-[#7a1111] hover:bg-[#f7d6d5] hover:text-[#7a1111]"
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
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="border-2 border-black bg-[#fff1bf] p-4">
                <Search className="h-6 w-6 text-black" />
              </div>
              <h4 className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-black">
                No members found
              </h4>
              <p className="mt-1 text-center text-sm text-[#5a5a5a]">
                {searchQuery.trim()
                  ? `No members match "${searchQuery}"`
                  : 'No members with this role'}
              </p>
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
          className="max-w-sm gap-0 overflow-hidden border-2 border-black p-0 shadow-none"
          showCloseButton={false}
          style={{ borderRadius: 0 }}
        >
          <DialogTitle className="sr-only">
            {memberToView?.name ?? 'Member'} Details
          </DialogTitle>

          {memberToView && (
            <div className="flex flex-col bg-[#fffdf8]">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black bg-[#4384dc] px-5 py-3.5 text-white">
                <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">
                  Member Details
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 border-2 border-black bg-[#f7d6d5] text-[#7a1111] hover:bg-[#efc1bf]"
                  onClick={() => setMemberToView(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center bg-[#fffdf8] px-6 py-6">
                <Avatar className="h-16 w-16 border-2 border-black bg-white">
                  {memberToView.avatarUrl ? (
                    <AvatarImage
                      src={memberToView.avatarUrl}
                      alt={memberToView.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-white text-lg font-bold text-black">
                    {getMemberInitials(memberToView.name)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 text-base font-semibold text-black">
                  {memberToView.name}
                </h3>
                <div className="mt-1.5">{getRoleBadge(memberToView.role)}</div>
              </div>

              {/* Details */}
              <div className="space-y-3 border-t-2 border-black px-6 py-4">
                <div className="flex items-center gap-3 border-2 border-black bg-white px-3 py-2">
                  <Mail size={15} className="shrink-0 text-black" />
                  <span className="truncate text-sm text-black">
                    {memberToView.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 border-2 border-black bg-white px-3 py-2">
                  <Calendar size={15} className="shrink-0 text-black" />
                  <span className="text-sm text-black">
                    Joined {formatJoinDate(memberToView.joinedAt)}
                  </span>
                </div>
              </div>

              {memberToView.id !== currentUserId &&
                memberToView.role !== 'OWNER' &&
                (canManageMembers || canChangeRoles) && (
                  <div className="space-y-2 border-t-2 border-black bg-[#fffdf8] px-6 py-4">
                    {canChangeRoles && (
                      <Button
                        variant="secondary"
                        className="w-full border-2 border-black bg-[#f6cb48] font-semibold text-black hover:bg-[#e5ba2d]"
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
                        className="w-full border-2 border-black bg-[#f7d6d5] font-semibold text-[#7a1111] hover:bg-[#efc1bf] hover:text-[#7a1111]"
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
          className="max-w-sm gap-0 overflow-hidden border-2 border-black p-0 shadow-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Transfer ownership</DialogTitle>

          {memberToTransfer && (
            <div className="flex flex-col bg-[#fffdf8]">
              <div className="border-b-2 border-black bg-[#f6cb48] px-6 py-4">
                <h2 className="font-kalam text-lg font-semibold text-black">
                  Transfer Ownership?
                </h2>
                <p className="mt-1 text-sm text-black">
                  {memberToTransfer.name} will become the new owner and you will
                  be changed to admin.
                </p>
              </div>

              <div className="border-b-2 border-black bg-[#fffdf8] px-6 py-4 text-sm text-[#5a5a5a]">
                Group memories remain in this group after ownership changes.
              </div>

              <div className="flex justify-end gap-2 px-6 py-4">
                <Button
                  variant="outline"
                  className="border-2 border-black bg-white font-semibold text-black hover:bg-[#dbe8ff]"
                  onClick={() => setMemberToTransfer(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  className="border-2 border-black bg-[#4384dc] font-semibold text-white hover:bg-[#3772c4]"
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
