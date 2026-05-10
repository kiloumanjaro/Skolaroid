export interface AnnouncementItem {
  text: string;
}

export const ANNOUNCEMENT_SPEED_PER_ITEM_SECONDS = 4;
export const ANNOUNCEMENT_SEPARATOR = '/';
export const ANNOUNCEMENT_SET_COPIES = 6;

/*
 * Add a new announcement by adding one { text: '...' } entry to the
 * relevant array below. The strip renders these arrays automatically, so no
 * component or animation changes are needed when items are added or removed.
 */
export const MAP_ANNOUNCEMENTS: AnnouncementItem[] = [
  { text: 'Campus stories pinned where they happened' },
  { text: 'Switch eras to explore memories across batches' },
  { text: 'Drop a memory and add to the living archive' },
];

export const GALLERY_ANNOUNCEMENTS: AnnouncementItem[] = [
  { text: 'Flip through campus memories one era at a time' },
  { text: 'Every card is a moment pinned to a shared history' },
  { text: 'Open any photo to jump straight back into the map' },
];

export const PROFILE_ANNOUNCEMENTS: AnnouncementItem[] = [
  { text: 'Keep your student archive updated and easy to revisit' },
  { text: 'Track your recent activity, memories, and campus details' },
  { text: 'Edit your profile so every shared story stays connected to you' },
];

export const ADMIN_ANNOUNCEMENTS: AnnouncementItem[] = [
  { text: 'Review pending memories before they go live' },
  { text: 'Track reports, moderation actions, and audit history' },
  { text: 'Keep the archive safe, accurate, and community-ready' },
];

export const ABOUT_ANNOUNCEMENTS: AnnouncementItem[] = [
  { text: 'Pinned memories built around real campus places' },
  { text: 'Photos, tags, and eras woven into one shared archive' },
  { text: 'A softer space for stories that should not disappear' },
];
