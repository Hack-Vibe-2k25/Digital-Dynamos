// src/lib/avatarUtils.ts
// Utility functions for managing ReadyPlayer.me avatars
import React from 'react';
export interface AvatarConfig {
  quality?: 'low' | 'medium' | 'high';
  format?: 'glb' | 'fbx';
  pose?: 'A' | 'T';
  animations?: boolean;
  morphTargets?: boolean;
  useHands?: boolean;
  useDraco?: boolean;
  textureAtlas?: 'none' | '256' | '512' | '1024';
}

/**
 * Default avatar URLs for fallback
 */
export const DEFAULT_AVATARS = {
  male: "https://models.readyplayer.me/64e3055495439dfcf3f0b665.glb",
  female: "https://models.readyplayer.me/64e3055495439dfcf3f0b666.glb",
  neutral: "https://models.readyplayer.me/64e3055495439dfcf3f0b667.glb",
};

/**
 * Validates if a URL is a valid ReadyPlayer.me avatar URL
 */
export function isValidAvatarUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const readyPlayerPattern = /^https:\/\/models\.readyplayer\.me\/[a-f0-9]{24}\.(glb|fbx)(\?.+)?$/i;
  return readyPlayerPattern.test(url);
}

/**
 * Constructs a ReadyPlayer.me avatar URL with custom parameters
 */
export function buildAvatarUrl(avatarId: string, config: AvatarConfig = {}): string {
  const {
    quality = 'medium',
    format = 'glb',
    pose = 'A',
    animations = true,
    morphTargets = true,
    useHands = false,
    useDraco = false,
    textureAtlas = '512'
  } = config;

  let url = `https://models.readyplayer.me/${avatarId}.${format}`;
  const params = new URLSearchParams();

  if (quality !== 'medium') params.set('quality', quality);
  if (pose !== 'A') params.set('pose', pose);
  if (!animations) params.set('animations', 'false');
  if (!morphTargets) params.set('morphTargets', 'false');
  if (useHands) params.set('useHands', 'true');
  if (useDraco) params.set('useDraco', 'true');
  if (textureAtlas !== 'none') params.set('textureAtlas', textureAtlas);

  const paramString = params.toString();
  if (paramString) {
    url += `?${paramString}`;
  }

  return url;
}

/**
 * Extracts avatar ID from a ReadyPlayer.me URL
 */
export function extractAvatarId(url: string): string | null {
  if (!isValidAvatarUrl(url)) return null;
  
  const match = url.match(/\/([a-f0-9]{24})\./i);
  return match ? match[1] : null;
}

/**
 * Gets a fallback avatar URL based on preference
 */
export function getFallbackAvatar(preference: 'male' | 'female' | 'neutral' = 'neutral'): string {
  return DEFAULT_AVATARS[preference] || DEFAULT_AVATARS.neutral;
}

/**
 * Preloads an avatar URL for faster loading
 */
export function preloadAvatar(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    link.crossOrigin = 'anonymous';
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload avatar: ${url}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Validates and sanitizes avatar URL for safe use
 */
export function sanitizeAvatarUrl(url: string | null | undefined): string {
  if (!url || !isValidAvatarUrl(url)) {
    return getFallbackAvatar();
  }
  return url;
}

/**
 * Generates avatar preview URL (static image)
 */
export function getAvatarPreviewUrl(avatarId: string, size: '128' | '256' | '512' = '256'): string {
  return `https://render.readyplayer.me/${avatarId}?size=${size}&format=png`;
}

/**
 * Avatar cache management
 */
class AvatarCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  set(url: string, data: any): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  get(url: string): any | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(url);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const avatarCache = new AvatarCache();

/**
 * Hook for managing avatar loading states
 */
export interface UseAvatarResult {
  avatarUrl: string;
  isLoading: boolean;
  error: string | null;
  previewUrl: string;
  setAvatarUrl: (url: string) => void;
  preload: () => Promise<void>;
}

export function useAvatar(initialUrl?: string): UseAvatarResult {
  const [avatarUrl, setAvatarUrlState] = React.useState(
    sanitizeAvatarUrl(initialUrl)
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const avatarId = extractAvatarId(avatarUrl);
  const previewUrl = avatarId ? getAvatarPreviewUrl(avatarId) : '';

  const setAvatarUrl = (url: string) => {
    const sanitizedUrl = sanitizeAvatarUrl(url);
    setAvatarUrlState(sanitizedUrl);
    setError(null);
  };

  const preload = async () => {
    if (!avatarUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      await preloadAvatar(avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preload avatar');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    avatarUrl,
    isLoading,
    error,
    previewUrl,
    setAvatarUrl,
    preload
  };
}

// Note: You'll need to import React if using the useAvatar hook
// import React from 'react';