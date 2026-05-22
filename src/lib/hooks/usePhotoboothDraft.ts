import { useState } from 'react';

const DRAFT_TOKEN_KEY = 'photobooth_draft_token';
const DRAFT_TIMESTAMP_KEY = 'photobooth_draft_timestamp';
const DRAFT_TTL = 30 * 60 * 1000; // 30 minutes

export function usePhotoboothDraft() {
  const [token, setToken] = useState<string | null>(null);

  // Save draft token to localStorage with timestamp
  const saveDraftToken = (draftToken: string) => {
    try {
      localStorage.setItem(DRAFT_TOKEN_KEY, draftToken);
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      console.error('[usePhotoboothDraft] failed to save token:', err);
    }
  };

  // Get draft token from localStorage if still valid
  const getSavedDraftToken = (): string | null => {
    try {
      const savedToken = localStorage.getItem(DRAFT_TOKEN_KEY);
      const savedTime = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

      if (!savedToken || !savedTime) return null;

      // Check if token has expired
      const age = Date.now() - parseInt(savedTime, 10);
      if (age > DRAFT_TTL) {
        clearDraftToken();
        return null;
      }

      return savedToken;
    } catch (err) {
      console.error('[usePhotoboothDraft] failed to get token:', err);
      return null;
    }
  };

  // Clear draft token from localStorage
  const clearDraftToken = () => {
    try {
      localStorage.removeItem(DRAFT_TOKEN_KEY);
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
    } catch (err) {
      console.error('[usePhotoboothDraft] failed to clear token:', err);
    }
  };

  // Get token from various sources (URL > localStorage > fallback)
  const getDraftToken = (urlToken?: string | null): string | null => {
    return urlToken || getSavedDraftToken();
  };

  return {
    token,
    setToken,
    saveDraftToken,
    getSavedDraftToken,
    clearDraftToken,
    getDraftToken,
  };
}
