'use client';

/**
 * GroupDetailView - Displays group content tabs
 *
 * NOTE: This component has been simplified in the two-column redesign.
 * The tab navigation, group header, and action buttons are now controlled
 * by the parent GroupPanel component. This component only exports the
 * tab components for direct use by GroupPanel.
 *
 * @deprecated - This wrapper component may be removed in the future.
 * Import tab components directly from @/components/groups/tabs instead.
 */

// Re-export tab components for backwards compatibility
export { MembersTab } from './tabs/MembersTab';
export { MediaTab } from './tabs/MediaTab';
export { AboutTab } from './tabs/AboutTab';
export { RolesTab } from './tabs/RolesTab';

/**
 * GroupDetailView is no longer used as a component.
 * The GroupPanel now renders tab components directly based on activeTab state.
 *
 * Previous responsibilities moved to GroupPanel:
 * - Tab navigation (now vertical buttons in left sidebar)
 * - Group header with name, badges, and counts (now in right column header)
 * - Actions dropdown (now in right column header)
 * - Active tab state management (now lifted to GroupPanel)
 */
