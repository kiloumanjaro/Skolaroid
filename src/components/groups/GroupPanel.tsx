'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GroupSwitcher, useGroupToast } from '@/components/groups';
import { usePanelOpenEffects } from '@/components/main-shell-sidebar-action';
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
  usePanelOpenEffects(open);

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
  const hasMoreActions = isOwner || canSendInvitations || canEditMessage;

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

  const openNestedModal = useCallback(
    (setOpen: (open: boolean) => void) => {
      onOpenChange(false);
      setOpen(true);
    },
    [onOpenChange]
  );

  const visibleTabs = [
    {
      id: 'members' as const,
      label: 'Members',
      icon: Users,
      onClick: () => setActiveTab('members'),
    },
    {
      id: 'media' as const,
      label: 'Media',
      icon: ImageIcon,
      onClick: () => setActiveTab('media'),
    },
    ...(isOwner
      ? [
          {
            id: 'settings' as const,
            label: 'Settings',
            icon: Settings,
            onClick: () => setActiveTab('settings'),
          },
        ]
      : []),
    {
      id: 'about' as const,
      label: 'About',
      icon: Info,
      onClick: () => setActiveTab('about'),
    },
    {
      id: 'roles' as const,
      label: 'Roles',
      icon: Shield,
      onClick: () => setActiveTab('roles'),
    },
  ];

  return (
    <>
      {open && (
        <div
          data-state="open"
          className="fixed inset-0 z-50 bg-[#2d2d2d]/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 flex w-[calc(100%-1.5rem)] -translate-x-1/2 justify-center transition-[top,bottom,transform] duration-300 ease-out sm:w-[calc(100%-2.5rem)]',
          open ? 'top-[47%] -translate-y-1/2' : 'bottom-0',
          open && 'pointer-events-auto'
        )}
      >
        <section
          aria-label={selectedGroup?.name ?? 'Groups'}
          className={cn(
            'pointer-events-auto flex h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col overflow-hidden rounded-none border-2 border-[#1f1f1f] bg-background p-0 shadow-none transition-transform duration-300 ease-out md:h-[85vh] md:w-[70vw]',
            open ? 'translate-y-0' : 'translate-y-[calc(100%-2.75rem)]'
          )}
        >
          <div
            className="flex cursor-pointer items-center justify-between gap-3 border-b-2 border-b-black bg-[#4384dc] px-3 py-2 text-white"
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
                aria-label="Close groups panel"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(false);
                }}
                className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-[#f7d6d5] text-[#7a1111] shadow-[inset_1px_1px_0_#fff8f7,inset_-1px_-1px_0_#c68787]"
              >
                <X className="h-4 w-4 stroke-[2]" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b-2 border-black px-3 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-start">
                  <div className="w-full shrink-0 md:w-64">
                    <GroupSwitcher
                      groups={groups}
                      selectedGroup={selectedGroup}
                      onSelectGroup={(group) => {
                        handleSelectGroup(group);
                        if (!open) onOpenChange(true);
                      }}
                      onCreateGroup={() => {
                        openNestedModal(setCreateModalOpen);
                      }}
                    />
                  </div>

                  {selectedGroup && (
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-[#7f9db9] bg-[#f4f8ff] text-[11px] text-[#24426c]"
                          style={{ borderRadius: 0 }}
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
                  )}
                </div>

                {selectedGroup && (
                  <div className="flex shrink-0 items-center gap-1 self-end md:self-start">
                    <button
                      type="button"
                      aria-label="Share group"
                      onClick={() => {
                        if (!selectedGroup) return;
                        openNestedModal(setShareModalOpen);
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-white text-black"
                    >
                      <Share2 className="h-4 w-4 stroke-[2]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Leave group"
                      onClick={() => {
                        if (!selectedGroup) return;
                        openNestedModal(setLeaveModalOpen);
                      }}
                      className="grid h-7 w-7 shrink-0 place-items-center border-2 border-black bg-white text-black"
                    >
                      <LogOut className="h-4 w-4 stroke-[2]" />
                    </button>
                    {hasMoreActions && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="group relative h-7 w-7 shrink-0 overflow-hidden border-2 border-black transition-colors"
                            aria-label="Open group actions"
                          >
                            <div className="absolute inset-0 bg-background transition-colors group-hover:bg-[#f6cb48] group-active:bg-[#f6cb48]" />
                            <span className="relative flex h-full w-full items-center justify-center text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {isOwner && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openNestedModal(setEditGroupModalOpen)
                                }
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
                                onClick={() =>
                                  openNestedModal(setInviteModalOpen)
                                }
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Members
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {canEditMessage && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  openNestedModal(setEditMessageModalOpen)
                                }
                              >
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Edit Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={() =>
                                openNestedModal(setDeleteModalOpen)
                              }
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Group
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="flex w-full shrink-0 flex-col border-b-2 border-black bg-secondary/50 md:w-48 md:border-b-0 md:border-r-2">
                {selectedGroup && (
                  <div className="scrollbar-hide flex-1 overflow-x-auto overflow-y-hidden px-0 py-0 md:flex-1">
                    <nav className="flex gap-0 md:block md:space-y-0">
                      {visibleTabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isFirstTab = index === 0;
                        const isLastTab = index === visibleTabs.length - 1;
                        const activeTabBorderClassName = isFirstTab
                          ? 'border-r-2 border-r-black md:border-r-0'
                          : isLastTab
                            ? 'border-l-2 border-l-black md:border-l-0'
                            : 'border-l-2 border-r-2 border-l-black border-r-black md:border-l-0 md:border-r-0';

                        return (
                          <button
                            key={tab.id}
                            onClick={tab.onClick}
                            className={cn(
                              'flex shrink-0 appearance-none items-center gap-2 whitespace-nowrap border-0 px-4 py-3 text-left text-sm font-medium transition-colors md:w-full',
                              isActive
                                ? `${activeTabBorderClassName} bg-[#f6cb48] text-black md:border-b-2 md:border-t-2 md:border-black`
                                : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                            )}
                            style={
                              isFirstTab
                                ? { borderTopColor: 'transparent' }
                                : undefined
                            }
                          >
                            <Icon className="h-4 w-4" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}
              </div>

              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                {selectedGroup ? (
                  <div
                    className={cn(
                      'scrollbar-hide flex-1 overflow-y-auto',
                      activeTab === 'members' ? 'p-0' : 'p-4 md:p-6'
                    )}
                  >
                    {activeTab === 'members' && (
                      <MembersTab
                        members={selectedGroup.members}
                        canManageMembers={canManageMembers}
                        canChangeRoles={isOwner}
                        currentUserId={currentUserId}
                        groupId={selectedGroup.id}
                        onMembersChanged={handleMembersChanged}
                        onRequestModalOpen={() => onOpenChange(false)}
                      />
                    )}
                    {activeTab === 'media' && (
                      <MediaTab
                        group={selectedGroup}
                        onRequestModalOpen={() => onOpenChange(false)}
                      />
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
                    {activeTab === 'roles' && selectedGroup.rolePrivileges && (
                      <RolesTab
                        groupId={selectedGroup.id}
                        rolePrivileges={selectedGroup.rolePrivileges}
                        currentUserRole={currentUserRole}
                        onPrivilegesSaved={handlePrivilegesSaved}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-8 md:px-6">
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
