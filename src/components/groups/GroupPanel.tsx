'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GroupSwitcher, useGroupToast } from '@/components/groups';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { InviteMembersModal } from '@/components/groups/InviteMembersModal';
import { ShareGroupModal } from '@/components/groups/ShareGroupModal';
import { LeaveGroupModal } from '@/components/groups/LeaveGroupModal';
import { DeleteGroupModal } from '@/components/groups/DeleteGroupModal';
import { EditGroupModal } from '@/components/groups/EditGroupModal';
import { EditGroupMessageModal } from '@/components/groups/EditGroupMessageModal';
import { MembersTab } from '@/components/groups/tabs/MembersTab';
import { MediaTab } from '@/components/groups/tabs/MediaTab';
import { AboutTab } from '@/components/groups/tabs/AboutTab';
import { RolesTab } from '@/components/groups/tabs/RolesTab';
import { SettingsTab } from '@/components/groups/tabs/SettingsTab';
import { type Group, type GroupMember } from '@/lib/types/group';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import {
  type GroupResponse,
  type GroupMembershipResponse,
  type GroupMemberResponse,
} from '@/lib/hooks/useCreateGroup';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import { useGroupById } from '@/lib/hooks/useGroupById';
import { useDeleteGroup } from '@/lib/hooks/useDeleteGroup';
import { useRemoveGroupMember } from '@/lib/hooks/useGroupMembers';
import {
  canRoleUsePermission,
  normaliseGroupRolePrivileges,
} from '@/lib/group-permissions';
import { cn } from '@/lib/utils';
import {
  X,
  MoreHorizontal,
  Users,
  Image as ImageIcon,
  Info,
  Settings,
  UserPlus,
  Share2,
  Trash2,
  LogOut,
  Globe,
  Lock,
  Loader2,
  Shield,
  Pencil,
  MessageSquare,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface GroupPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'members' | 'media' | 'settings' | 'about' | 'roles';
type MemberChangeAction = 'removed' | 'role-updated' | 'ownership-transferred';

/** Transform an API member response to the frontend GroupMember shape. */
function toGroupMember(
  m: GroupMemberResponse,
  creatorId: string | null,
  membership?: GroupMembershipResponse
): GroupMember {
  return {
    id: m.id,
    name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email,
    email: m.email,
    role:
      m.role ??
      (m.id === creatorId
        ? ('OWNER' as const)
        : (membership?.role ?? 'MEMBER')),
    joinedAt: m.joinedAt ?? membership?.joinedAt ?? new Date().toISOString(),
  };
}

/** Transform an API GroupResponse to the frontend Group shape. */
function toGroup(g: GroupResponse): Group {
  const membershipByUser = new Map(
    (g.groupMemberships ?? []).map((membership) => [
      membership.userId,
      membership,
    ])
  );

  return {
    id: g.id,
    name: g.name,
    description: g.description ?? undefined,
    message: g.message ?? undefined,
    privacy: 'PRIVATE',
    visibility: 'VISIBLE',
    coverPhotoUrl: undefined,
    memberCount: g._count.members,
    postCount: g._count.memories,
    ownerId: g.creatorId ?? '',
    members: g.members.map((m) =>
      toGroupMember(m, g.creatorId, membershipByUser.get(m.id))
    ),
    rolePrivileges: normaliseGroupRolePrivileges(g.rolePrivileges),
    currentUserRole: g.currentUserRole,
    createdAt: g.createdAt,
  };
}

export function GroupPanel({ open, onOpenChange }: GroupPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editMessageModalOpen, setEditMessageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('members');

  const { showSuccess, showError, ToastPortal } = useGroupToast();
  const { user } = useUserAuth();
  const currentUserId = user?.id ?? '';

  // ─── Data fetching ───────────────────────────────────────────────
  const { data: groupsRaw, isLoading: isLoadingGroups } = useUserGroups();

  const { data: groupDetailRaw, refetch: refetchGroupDetail } = useGroupById(
    selectedGroupId ?? ''
  );

  const deleteGroup = useDeleteGroup();
  const leaveGroup = useRemoveGroupMember();

  // ─── Derived state ───────────────────────────────────────────────
  const groups: Group[] = useMemo(() => {
    if (!groupsRaw) return [];
    return groupsRaw.map(toGroup);
  }, [groupsRaw]);

  // Auto-select first group when list loads
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Build the selected group from either the detail query or the list
  const selectedGroup: Group | null = useMemo(() => {
    if (groupDetailRaw) return toGroup(groupDetailRaw);
    return groups.find((g) => g.id === selectedGroupId) ?? null;
  }, [groupDetailRaw, groups, selectedGroupId]);

  const currentUserMember = selectedGroup?.members.find(
    (m) => m.id === currentUserId
  );
  // Prefer the server-resolved role from the member list; fall back to ownerId
  // comparison when the detail query hasn't loaded yet (e.g. list-only data).
  const currentUserRole =
    currentUserMember?.role ??
    (selectedGroup?.ownerId === currentUserId
      ? ('OWNER' as const)
      : ('MEMBER' as const));
  const isOwner = currentUserRole === 'OWNER';
  const rolePrivileges = selectedGroup?.rolePrivileges;
  const canManageMembers =
    !!selectedGroup &&
    canRoleUsePermission(rolePrivileges, currentUserRole, 'manageMembers');
  const canSendInvitations =
    !!selectedGroup &&
    canRoleUsePermission(rolePrivileges, currentUserRole, 'sendInvitations');
  const canEditMessage =
    !!selectedGroup &&
    (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN');

  // ─── Handlers ────────────────────────────────────────────────────
  const handleSelectGroup = useCallback((group: Group) => {
    setSelectedGroupId(group.id);
  }, []);

  const handleGroupCreated = useCallback(
    (groupResponse: GroupResponse) => {
      setSelectedGroupId(groupResponse.id);
      showSuccess(`Group "${groupResponse.name}" created successfully!`);
    },
    [showSuccess]
  );

  const handleGroupDeleted = useCallback(() => {
    if (!selectedGroup) return;

    deleteGroup.mutate(selectedGroup.id, {
      onSuccess: () => {
        showSuccess(`Group "${selectedGroup.name}" deleted.`);
        setSelectedGroupId(
          groups.find((g) => g.id !== selectedGroup.id)?.id ?? null
        );
        onOpenChange(false);
      },
      onError: (err) => {
        showError(err.message);
      },
    });
  }, [
    selectedGroup,
    groups,
    deleteGroup,
    onOpenChange,
    showSuccess,
    showError,
  ]);

  const handleGroupLeft = useCallback(() => {
    if (!selectedGroup || !user?.email) return;
    const leavingAsOwner = selectedGroup.ownerId === currentUserId;

    leaveGroup.mutate(
      { groupId: selectedGroup.id, email: user.email },
      {
        onSuccess: () => {
          showSuccess(
            leavingAsOwner
              ? `You left "${selectedGroup.name}" and ownership was transferred.`
              : `You left "${selectedGroup.name}".`
          );
          setSelectedGroupId(
            groups.find((g) => g.id !== selectedGroup.id)?.id ?? null
          );
        },
        onError: (err) => {
          showError(err.message);
        },
      }
    );
  }, [
    selectedGroup,
    user?.email,
    currentUserId,
    groups,
    leaveGroup,
    showSuccess,
    showError,
  ]);

  const handleMembersChanged = useCallback(
    (action: MemberChangeAction) => {
      refetchGroupDetail();
      if (action === 'removed') {
        showSuccess('Member removed successfully.');
        return;
      }

      if (action === 'role-updated') {
        showSuccess('Member role updated successfully.');
        return;
      }

      showSuccess('Ownership transferred successfully.');
    },
    [refetchGroupDetail, showSuccess]
  );

  const handlePrivilegesSaved = useCallback(() => {
    refetchGroupDetail();
    showSuccess('Role privileges updated successfully.');
  }, [refetchGroupDetail, showSuccess]);

  const handleGroupUpdated = useCallback(() => {
    refetchGroupDetail();
    showSuccess('Group updated successfully.');
  }, [refetchGroupDetail, showSuccess]);

  const handleMessageUpdated = useCallback(() => {
    refetchGroupDetail();
    showSuccess('Group message updated.');
  }, [refetchGroupDetail, showSuccess]);

  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute left-1/2 z-20 flex w-[calc(100%-1.5rem)] -translate-x-1/2 justify-center transition-[top,bottom,transform] duration-300 ease-out sm:w-[calc(100%-2.5rem)]',
          open ? 'top-[47%] -translate-y-1/2' : 'bottom-0',
          open && 'pointer-events-auto'
        )}
      >
        <section
          aria-label={selectedGroup?.name ?? 'Groups'}
          className={cn(
            'pointer-events-auto flex w-full max-w-[64rem] flex-col overflow-hidden border-[3px] border-[#1f1f1f] bg-[#f0eeec] shadow-none transition-transform duration-300 ease-out sm:w-[min(64rem,calc(100vw-3rem))]',
            'h-[min(84vh,52rem)]',
            open ? 'translate-y-0' : 'translate-y-[calc(100%-2.75rem)]'
          )}
        >
          <div
            className="flex cursor-pointer items-center justify-between gap-3 border-b-[3px] border-b-[#1f1f1f] bg-[#4384dc] px-3 py-2 text-white"
            onClick={() => {
              if (!open) onOpenChange(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!open) onOpenChange(true);
              }
            }}
          >
            <div className="min-w-0">
              <p className="truncate text-base font-medium tracking-[0.01em] sm:text-lg">
                Campus Group Window
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Share group"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!selectedGroup) return;
                  if (!open) onOpenChange(true);
                  setShareModalOpen(true);
                }}
                className="grid h-6 w-6 place-items-center border-2 border-[#062a63] bg-[#f2f6fd] text-[#0b2e67] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#7f9db9]"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Leave group"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!selectedGroup) return;
                  if (!open) onOpenChange(true);
                  setLeaveModalOpen(true);
                }}
                className="grid h-6 w-6 place-items-center border-2 border-[#062a63] bg-[#f2f6fd] text-[#0b2e67] shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#7f9db9]"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Close groups panel"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                }}
                className="grid h-6 w-6 place-items-center border-2 border-[#5d0d0d] bg-[#f7d6d5] text-[#7a1111] shadow-[inset_1px_1px_0_#fff8f7,inset_-1px_-1px_0_#c68787]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-[#f7f4ea]">
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="flex w-full shrink-0 flex-col border-b border-[#c6c0b2] bg-[#f0eeec] md:w-60 md:border-b-0 md:border-r">
                <div className="border-b border-[#c6c0b2] px-2 py-3">
                  <GroupSwitcher
                    groups={groups}
                    selectedGroup={selectedGroup}
                    onSelectGroup={(group) => {
                      handleSelectGroup(group);
                      if (!open) onOpenChange(true);
                    }}
                    onCreateGroup={() => {
                      onOpenChange(true);
                      setCreateModalOpen(true);
                    }}
                  />
                </div>

                {selectedGroup && (
                  <div className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden px-2 py-2 md:overflow-y-auto">
                    <nav className="flex gap-1 md:flex-col">
                      <button
                        onClick={() => setActiveTab('members')}
                        className={cn(
                          'flex shrink-0 items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm font-medium shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#b9b2a1] md:w-full',
                          activeTab === 'members'
                            ? 'border-[#7f9db9] bg-[#fff7d6] text-[#1f1f1f]'
                            : 'border-[#b8b1a3] bg-[#f0eeec] text-[#5a5a5a] hover:bg-[#f5f1e3]'
                        )}
                      >
                        <Users className="h-4 w-4" />
                        <span>Members</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('media')}
                        className={cn(
                          'flex shrink-0 items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm font-medium shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#b9b2a1] md:w-full',
                          activeTab === 'media'
                            ? 'border-[#7f9db9] bg-[#fff7d6] text-[#1f1f1f]'
                            : 'border-[#b8b1a3] bg-[#f0eeec] text-[#5a5a5a] hover:bg-[#f5f1e3]'
                        )}
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>Media</span>
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => setActiveTab('settings')}
                          className={cn(
                            'flex shrink-0 items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm font-medium shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#b9b2a1] md:w-full',
                            activeTab === 'settings'
                              ? 'border-[#7f9db9] bg-[#fff7d6] text-[#1f1f1f]'
                              : 'border-[#b8b1a3] bg-[#f0eeec] text-[#5a5a5a] hover:bg-[#f5f1e3]'
                          )}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab('about')}
                        className={cn(
                          'flex shrink-0 items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm font-medium shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#b9b2a1] md:w-full',
                          activeTab === 'about'
                            ? 'border-[#7f9db9] bg-[#fff7d6] text-[#1f1f1f]'
                            : 'border-[#b8b1a3] bg-[#f0eeec] text-[#5a5a5a] hover:bg-[#f5f1e3]'
                        )}
                      >
                        <Info className="h-4 w-4" />
                        <span>About</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('roles')}
                        className={cn(
                          'flex shrink-0 items-center gap-2 rounded-sm border-2 px-3 py-2 text-left text-sm font-medium shadow-[inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#b9b2a1] md:w-full',
                          activeTab === 'roles'
                            ? 'border-[#7f9db9] bg-[#fff7d6] text-[#1f1f1f]'
                            : 'border-[#b8b1a3] bg-[#f0eeec] text-[#5a5a5a] hover:bg-[#f5f1e3]'
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Roles</span>
                      </button>
                    </nav>
                  </div>
                )}
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                {selectedGroup ? (
                  <>
                    <div className="flex items-start justify-between gap-3 border-b border-[#c6c0b2] bg-white px-4 py-3 md:px-5">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-[#1f1f1f]">
                              {selectedGroup.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-[#7f9db9] bg-[#f4f8ff] text-[11px] text-[#24426c]"
                            >
                              {selectedGroup.privacy === 'PUBLIC' ? (
                                <>
                                  <Globe className="h-3 w-3" />
                                  Public
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  Private
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-[#5a5a5a]">
                            {selectedGroup.memberCount} members ·{' '}
                            {selectedGroup.postCount} posts
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="group relative h-8 w-8 shrink-0 overflow-hidden border-2 border-border transition-all hover:translate-x-px hover:translate-y-px active:translate-x-[2px] active:translate-y-[2px]"
                              aria-label="Open group actions"
                            >
                              <div className="absolute inset-0 bg-card transition-all group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
                              <span className="relative flex h-full w-full items-center justify-center text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {isOwner && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setEditGroupModalOpen(true)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Group
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {canSendInvitations && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setInviteModalOpen(true)}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Invite Members
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => setShareModalOpen(true)}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Group
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canEditMessage && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setEditMessageModalOpen(true)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Edit Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => setLeaveModalOpen(true)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <LogOut className="mr-2 h-4 w-4" />
                              Leave Group
                            </DropdownMenuItem>
                            {isOwner && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteModalOpen(true)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Group
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="scrollbar-hide flex-1 overflow-y-auto bg-white">
                      {activeTab === 'members' && (
                        <MembersTab
                          members={selectedGroup.members}
                          canManageMembers={canManageMembers}
                          canChangeRoles={isOwner}
                          currentUserId={currentUserId}
                          groupId={selectedGroup.id}
                          onMembersChanged={handleMembersChanged}
                        />
                      )}
                      {activeTab === 'media' && (
                        <MediaTab group={selectedGroup} />
                      )}
                      {activeTab === 'settings' && isOwner && (
                        <SettingsTab
                          group={selectedGroup}
                          onUpdated={() => refetchGroupDetail()}
                        />
                      )}
                      {activeTab === 'about' && (
                        <AboutTab group={selectedGroup} />
                      )}
                      {activeTab === 'roles' &&
                        selectedGroup.rolePrivileges && (
                          <RolesTab
                            groupId={selectedGroup.id}
                            rolePrivileges={selectedGroup.rolePrivileges}
                            currentUserRole={currentUserRole}
                            onPrivilegesSaved={handlePrivilegesSaved}
                          />
                        )}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-5 py-8">
                    {isLoadingGroups ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Users className="mb-3 h-12 w-12 text-muted-foreground" />
                        <h3 className="text-base font-semibold text-foreground">
                          No Group Selected
                        </h3>
                        <p className="mt-1 text-center text-sm text-muted-foreground">
                          Select a group from the switcher or create a new one
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Nested Modals */}
      <CreateGroupModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={handleGroupCreated}
      />

      {selectedGroup && (
        <>
          <InviteMembersModal
            open={inviteModalOpen}
            onOpenChange={setInviteModalOpen}
            groupName={selectedGroup.name}
            groupId={selectedGroup.id}
            showSuccess={showSuccess}
          />

          <ShareGroupModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            groupName={selectedGroup.name}
            groupId={selectedGroup.id}
            showSuccess={showSuccess}
          />

          <LeaveGroupModal
            open={leaveModalOpen}
            onOpenChange={setLeaveModalOpen}
            groupName={selectedGroup.name}
            isOwner={isOwner}
            onConfirmLeave={handleGroupLeft}
          />

          <DeleteGroupModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            groupName={selectedGroup.name}
            onConfirmDelete={handleGroupDeleted}
          />

          {isOwner && (
            <EditGroupModal
              open={editGroupModalOpen}
              onOpenChange={setEditGroupModalOpen}
              group={selectedGroup}
              onUpdated={handleGroupUpdated}
            />
          )}

          {canEditMessage && (
            <EditGroupMessageModal
              open={editMessageModalOpen}
              onOpenChange={setEditMessageModalOpen}
              group={selectedGroup}
              onUpdated={handleMessageUpdated}
            />
          )}
        </>
      )}

      <ToastPortal />
    </>
  );
}
