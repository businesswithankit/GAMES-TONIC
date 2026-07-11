import React from 'react';

// Domain parser to automatically detect the platform
export function detectPlatformFromUrl(url: string): string {
  const cleanUrl = url.toLowerCase().trim();
  if (!cleanUrl) return 'globe';
  
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
  if (cleanUrl.includes('instagram.com')) return 'instagram';
  if (cleanUrl.includes('t.me') || cleanUrl.includes('telegram.org') || cleanUrl.includes('telegram.me')) return 'telegram';
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.com')) return 'facebook';
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) return 'x';
  if (cleanUrl.includes('discord.com') || cleanUrl.includes('discord.gg')) return 'discord';
  if (cleanUrl.includes('linkedin.com')) return 'linkedin';
  if (cleanUrl.includes('whatsapp.com') || cleanUrl.includes('wa.me')) return 'whatsapp';
  if (cleanUrl.includes('github.com')) return 'github';
  
  return 'globe';
}

// URL validator to filter out mock/broken placeholders
export function isValidSocialUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Must start with http, https or at least resemble a relative/external link, shouldn't be empty placeholder
  if (trimmed === '#' || trimmed === '' || trimmed.toLowerCase() === 'http://' || trimmed.toLowerCase() === 'https://') {
    return false;
  }
  try {
    // Basic pattern check
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.') || trimmed.startsWith('//');
  } catch {
    return false;
  }
}

// Standard SVG definitions for perfect design consistency and high reliability
export function getSocialSvgIcon(platform: string, className = "w-5 h-5"): React.ReactElement {
  const norm = platform.toLowerCase().trim();
  
  switch (norm) {
    case 'youtube':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C22 8.68 22 12 22 12s0 3.32-.42 4.814a2.502 2.502 0 01-1.768 1.768C18.32 19 12 19 12 19s-6.32 0-7.812-.418A2.502 2.502 0 012.42 16.814C2 15.32 2 12 2 12s0-3.32.42-4.814A2.502 2.502 0 014.188 5.418C5.68 5 12 5 12 5s6.32 0 7.812.418zM9.75 15.022L15.5 12 9.75 8.978v6.044z" clipRule="evenodd" />
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'telegram':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.28-.01.06.01.17 0 .24z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
      );
    case 'x':
    case 'twitter':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'discord':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.67 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.1825 0-2.1569-1.085-2.1569-2.419 0-1.3329.9556-2.4189 2.1569-2.4189 1.21 0 2.1756 1.095 2.157 2.419 0 1.334-.9556 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.3329.9556-2.4189 2.157-2.4189 1.21 0 2.176 1.095 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
         </svg>
       );
    case 'linkedin':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.1 1.4 4.8 1.4 5.3 0 9.7-4.3 9.7-9.7 0-5.3-4.3-9.7-9.7-9.7C6 1.1 1.7 5.4 1.7 10.8c0 1.8.5 3.5 1.4 5l-.9 3.4 3.4-.9V19.154z" />
        </svg>
      );
    case 'github':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
}

// Consolidates preset + custom social links into a single clean list for rendering.
// Handles deduplication, platform detection, order prioritization, and validation.
export function compileActiveSocialLinks(siteSettings: any): { platform: string; url: string; rawPlatform: string }[] {
  const result: { platform: string; url: string; rawPlatform: string }[] = [];
  const seenUrls = new Set<string>();

  // 1. Process customSocialLinks
  if (siteSettings.customSocialLinks && Array.isArray(siteSettings.customSocialLinks)) {
    siteSettings.customSocialLinks
      .filter((sl: any) => sl.status !== false && isValidSocialUrl(sl.url))
      .forEach((sl: any) => {
        const url = sl.url.trim();
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          const platform = detectPlatformFromUrl(url);
          result.push({
            platform: platform,
            url: url,
            rawPlatform: sl.platform || platform,
          });
        }
      });
  }

  // 2. Process Default/Preset socialLinks if stored
  if (siteSettings.socialLinks) {
    const presets = [
      { key: 'youtubeLong', label: 'YouTube' },
      { key: 'youtubeShorts', label: 'YouTube' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'telegram', label: 'Telegram' },
      { key: 'discord', label: 'Discord' },
      { key: 'facebook', label: 'Facebook' },
      { key: 'x', label: 'X (Twitter)' },
      { key: 'threads', label: 'Threads' },
      { key: 'whatsapp', label: 'WhatsApp' },
    ];

    presets.forEach((preset) => {
      const url = siteSettings.socialLinks[preset.key];
      if (url && isValidSocialUrl(url)) {
        const cleanUrl = url.trim();
        if (!seenUrls.has(cleanUrl)) {
          seenUrls.add(cleanUrl);
          const platform = detectPlatformFromUrl(cleanUrl);
          result.push({
            platform: platform,
            url: cleanUrl,
            rawPlatform: preset.label,
          });
        }
      }
    });
  }

  // If no links were resolved, fallback to empty array to allow full control or return default placeholdings if required
  return result;
}
