'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { GroupSwitcher, useGroupToast } from '@/components/groups';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { InviteMembersModal } from '@/components/groups/InviteMembersModal';
import { ShareGroupModal } from '@/components/groups/ShareGroupModal';
import { LeaveGroupModal } from '@/components/groups/LeaveGroupModal';
import { DeleteGroupModal } from '@/components/groups/DeleteGroupModal';
import { MembersTab } from '@/components/groups/tabs/MembersTab';
import { MediaTab } from '@/components/groups/tabs/MediaTab';
import { AboutTab } from '@/components/groups/tabs/AboutTab';
import { type Group, type GroupMember } from '@/lib/types/group';
import { useUserAuth } from '@/lib/hooks/useUserAuth';
import {
  type GroupResponse,
  type GroupMemberResponse,
} from '@/lib/hooks/useCreateGroup';
import { useUserGroups } from '@/lib/hooks/useUserGroups';
import { useGroupById } from '@/lib/hooks/useGroupById';
import { useDeleteGroup } from '@/lib/hooks/useDeleteGroup';
import { useRemoveGroupMember } from '@/lib/hooks/useGroupMembers';
import { cn } from '@/lib/utils';
import {
  X,
  MoreHorizontal,
  Users,
  Image as ImageIcon,
  Info,
  UserPlus,
  Share2,
  Trash2,
  LogOut,
  Globe,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GroupPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'members' | 'media' | 'about';

/** Transform an API member response to the frontend GroupMember shape. */
function toGroupMember(
  m: GroupMemberResponse,
  creatorId: string | null
): GroupMember {
  return {
    id: m.id,
    name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || m.email,
    email: m.email,
    role: m.id === creatorId ? ('OWNER' as const) : ('MEMBER' as const),
    joinedAt: new Date().toISOString(),
  };
}

/** Transform an API GroupResponse to the frontend Group shape. */
function toGroup(g: GroupResponse): Group {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? undefined,
    privacy: 'PRIVATE',
    visibility: 'VISIBLE',
    coverPhotoUrl: undefined,
    memberCount: g._count.members,
    postCount: g._count.memories,
    ownerId: g.creatorId ?? '',
    members: g.members.map((m) => toGroupMember(m, g.creatorId)),
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
  const [activeTab, setActiveTab] = useState<TabType>('members');

  const { showSuccess, showError } = useGroupToast();
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
    if (groupDetailRaw)
      return toGroup(groupDetailRaw as unknown as GroupResponse);
    return groups.find((g) => g.id === selectedGroupId) ?? null;
  }, [groupDetailRaw, groups, selectedGroupId]);

  const isOwner = selectedGroup?.ownerId === currentUserId;
  const currentUserMember = selectedGroup?.members.find(
    (m) => m.id === currentUserId
  );
  const isAdmin = currentUserMember?.role === 'ADMIN';

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

    leaveGroup.mutate(
      { groupId: selectedGroup.id, email: user.email },
      {
        onSuccess: () => {
          showSuccess(`You left "${selectedGroup.name}".`);
          setSelectedGroupId(
            groups.find((g) => g.id !== selectedGroup.id)?.id ?? null
          );
        },
        onError: (err) => {
          showError(err.message);
        },
      }
    );
  }, [selectedGroup, user?.email, groups, leaveGroup, showSuccess, showError]);

  const handleMemberRemoved = useCallback(() => {
    refetchGroupDetail();
    showSuccess('Member removed successfully.');
  }, [refetchGroupDetail, showSuccess]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[85vh] w-[70vw] max-w-none gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            {selectedGroup?.name ?? 'Groups'}
          </DialogTitle>

          {/* LEFT COLUMN: Navigation */}
          <div className="flex w-56 shrink-0 flex-col border-r border-gray-100 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-base font-semibold text-gray-900">Groups</h2>
            </div>

            {/* GroupSwitcher */}
            <div className="border-b border-gray-100 px-3 py-3">
              <GroupSwitcher
                groups={groups}
                selectedGroup={selectedGroup}
                onSelectGroup={handleSelectGroup}
                onCreateGroup={() => setCreateModalOpen(true)}
              />
            </div>

            {/* Navigation Buttons */}
            {selectedGroup && (
              <div className="scrollbar-hide flex-1 overflow-y-auto px-3 py-3">
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveTab('members')}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      activeTab === 'members'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('media')}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      activeTab === 'media'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Media</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('about')}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      activeTab === 'about'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )}
                  >
                    <Info className="h-4 w-4" />
                    <span>About</span>
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Content */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {selectedGroup ? (
              <>
                {/* Header with group info and actions */}
                <div className="flex items-start justify-between border-b border-gray-100 px-5 py-3.5">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {selectedGroup.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
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
                      <p className="mt-0.5 text-sm text-gray-600">
                        {selectedGroup.memberCount} members ·{' '}
                        {selectedGroup.postCount} posts
                      </p>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {(isOwner || isAdmin) && (
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
                        {!isOwner && (
                          <DropdownMenuItem
                            onClick={() => setLeaveModalOpen(true)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Leave Group
                          </DropdownMenuItem>
                        )}
                        {isOwner && (
                          <DropdownMenuItem
                            onClick={() => setDeleteModalOpen(true)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Group
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Close Button */}
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="scrollbar-hide flex-1 overflow-y-auto">
                  {activeTab === 'members' && (
                    <MembersTab
                      members={selectedGroup.members}
                      isOwner={isOwner}
                      currentUserId={currentUserId}
                      groupId={selectedGroup.id}
                      onMemberRemoved={handleMemberRemoved}
                    />
                  )}
                  {activeTab === 'media' && <MediaTab group={selectedGroup} />}
                  {activeTab === 'about' && <AboutTab group={selectedGroup} />}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-5 py-8">
                {isLoadingGroups ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                ) : (
                  <>
                    <Users className="mb-3 h-12 w-12 text-gray-300" />
                    <h3 className="text-base font-semibold text-gray-900">
                      No Group Selected
                    </h3>
                    <p className="mt-1 text-center text-sm text-gray-600">
                      Select a group from the sidebar or create a new one
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            onConfirmLeave={handleGroupLeft}
          />

          <DeleteGroupModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            groupName={selectedGroup.name}
            onConfirmDelete={handleGroupDeleted}
          />
        </>
      )}
    </>
  );
}
