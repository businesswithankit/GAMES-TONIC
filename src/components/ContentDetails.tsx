import React, { useState } from 'react';
import {
  Calendar,
  Tag,
  User,
  Download,
  ExternalLink,
  CalendarDays,
  Share2,
  Globe,
  Sparkles,
  Video,
  Info,
  ShieldCheck
} from 'lucide-react';
import { ContentPost, Advertisement, AdSenseUnit } from '../types';
import AdPlacement from './AdPlacement';
import AdSensePlacement from './AdSensePlacement';

interface ContentDetailsProps {
  post: ContentPost;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  onActionClick?: (link: string, openInNewTab: boolean) => void;
  ads?: Advertisement[];
  adsenseUnits?: AdSenseUnit[];
}

interface ActionButtonConfig {
  key: string;
  label: string;
  url: string;
  icon: React.ReactNode;
  variant: 'magenta' | 'green' | 'gradient' | 'cyan' | 'neutral';
}

export default function ContentDetails({
  post,
  onClose,
  onTagClick,
  onCategoryClick,
  onActionClick,
  ads = [],
  adsenseUnits = []
}: ContentDetailsProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/#card-${post.id}`;
  const shareTitle = post.title;

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: post.shortDescription || '',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard/modal
      }
    }
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBtnClick = (url: string) => {
    if (onActionClick) {
      onActionClick(url, true);
    } else {
      window.open(url, '_blank');
    }
  };

  const type = post.type?.toLowerCase().trim() || 'content';
  const isGame = type === 'games';
  const isMod = type === 'mods';
  const isUpcoming = type === 'upcoming';
  const isContent = !isGame && !isMod && !isUpcoming;

  // Safe tag extraction
  const tagList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === 'string' && post.tags.trim()
    ? (post.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // Determine single image used everywhere (no second or third image properties)
  const heroImage = post.thumbnail || post.imageLink;

  // URLs resolution for Action Buttons
  const isValidUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.');
  };

  const watchUrl = (
    (type === 'videos' && post.buttonLink ? post.buttonLink : undefined) ||
    post.channelUrl ||
    (post.buttonText?.toLowerCase().includes('watch') ? post.buttonLink : undefined) ||
    (post.videoEmbed && isValidUrl(post.videoEmbed) ? post.videoEmbed : undefined)
  )?.trim();

  const downloadUrl = (
    post.downloadLink ||
    post.extraLink ||
    (type === 'mods' && post.buttonLink ? post.buttonLink : undefined) ||
    (post.buttonText?.toLowerCase().includes('download') ? post.buttonLink : undefined)
  )?.trim();

  const promptUrl = (
    post.promptLink ||
    (post.buttonText?.toLowerCase().includes('prompt') ? post.buttonLink : undefined)
  )?.trim();

  const websiteUrl = (
    post.websiteLink ||
    post.officialWebsite ||
    post.gameLink ||
    (type === 'games' && post.buttonLink ? post.buttonLink : undefined) ||
    post.developerWebsite ||
    post.buttonLink
  )?.trim();

  const sourceUrl = (
    (post.source && isValidUrl(post.source) ? post.source : undefined) ||
    (post.developerWebsite && post.developerWebsite !== websiteUrl ? post.developerWebsite : undefined)
  )?.trim();

  // Primary Action Button styling determination (Gradient goes to the first active CTA)
  const hasPrompt = isValidUrl(promptUrl);
  const hasDownload = isValidUrl(downloadUrl);
  const hasWatch = isValidUrl(watchUrl);
  const hasWebsite = isValidUrl(websiteUrl);

  const actionButtons: ActionButtonConfig[] = [];
  const usedUrls = new Set<string>();

  // 1. WATCH NOW
  if (hasWatch && isValidUrl(watchUrl) && !usedUrls.has(watchUrl!)) {
    const isPrimary = !hasDownload && !hasPrompt;
    actionButtons.push({
      key: 'watch',
      label: 'WATCH NOW',
      url: watchUrl!,
      icon: <Video className="w-4 h-4 shrink-0" />,
      variant: isPrimary ? 'gradient' : 'magenta'
    });
    usedUrls.add(watchUrl!);
  }

  // 2. DOWNLOAD
  if (hasDownload && isValidUrl(downloadUrl) && !usedUrls.has(downloadUrl!)) {
    const isPrimary = !hasPrompt;
    actionButtons.push({
      key: 'download',
      label: 'DOWNLOAD',
      url: downloadUrl!,
      icon: <Download className="w-4 h-4 shrink-0" />,
      variant: isPrimary ? 'gradient' : 'green'
    });
    usedUrls.add(downloadUrl!);
  }

  // 3. GET PROMPT (Always receives gradient if present)
  if (hasPrompt && isValidUrl(promptUrl) && !usedUrls.has(promptUrl!)) {
    actionButtons.push({
      key: 'prompt',
      label: 'GET PROMPT',
      url: promptUrl!,
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      variant: 'gradient'
    });
    usedUrls.add(promptUrl!);
  }

  // 4. OFFICIAL WEBSITE
  if (hasWebsite && isValidUrl(websiteUrl) && !usedUrls.has(websiteUrl!)) {
    const isPrimary = !hasPrompt && !hasDownload && !hasWatch;
    actionButtons.push({
      key: 'website',
      label: 'OFFICIAL WEBSITE',
      url: websiteUrl!,
      icon: <Globe className="w-4 h-4 shrink-0" />,
      variant: isPrimary ? 'gradient' : 'cyan'
    });
    usedUrls.add(websiteUrl!);
  }

  // 5. OFFICIAL SOURCE
  if (sourceUrl && isValidUrl(sourceUrl) && !usedUrls.has(sourceUrl)) {
    actionButtons.push({
      key: 'source',
      label: 'OFFICIAL SOURCE',
      url: sourceUrl,
      icon: <ExternalLink className="w-4 h-4 shrink-0" />,
      variant: 'neutral'
    });
    usedUrls.add(sourceUrl);
  }

  // Creator identity label resolve (strict professional tags)
  const getCreatorLabel = () => {
    if (isGame) return 'Developer';
    if (isMod) return 'Content Creator';
    if (isUpcoming) return 'Published By';
    return 'Author'; // standard content type
  };

  const creatorName = (
    post.developerName ||
    post.author
  )?.trim();

  const finalCreatorName = creatorName === 'Admin' || !creatorName ? 'GAMES TONIC' : creatorName;

  const fullDesc = (post.description || post.content)?.trim();
  const shortDesc = post.shortDescription?.trim();
  const showFullDesc = fullDesc && fullDesc !== '';

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel-neon border border-cyber-cyan/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.2)] bg-[#07070d] font-sans my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Badges */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#07070d]/95 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-2.5 overflow-hidden pr-4">
            {/* 1. Category Badge */}
            {post.category && post.category.trim() !== '' && (
              <span
                onClick={() => {
                  onClose();
                  onCategoryClick?.(post.category);
                }}
                className="text-[10px] uppercase font-display font-bold tracking-widest text-cyber-cyan bg-cyber-cyan/15 border border-cyber-cyan/30 px-3 py-1 rounded-full shrink-0 cursor-pointer hover:bg-cyber-cyan/25 transition-colors"
              >
                {post.category}
              </span>
            )}
            {/* 2. Optional Featured Badge */}
            {post.featured && (
              <span className="text-[10px] uppercase font-display font-bold tracking-widest text-cyber-magenta bg-cyber-magenta/15 border border-cyber-magenta/30 px-3 py-1 rounded-full shrink-0">
                ★ FEATURED
              </span>
            )}
            <h2 className="text-xs sm:text-sm font-display font-bold text-gray-400 truncate uppercase">
              {post.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            id="detail-close-btn"
            className="p-2.5 bg-black/70 border border-white/10 text-white rounded-full hover:border-cyber-cyan hover:text-cyber-cyan hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all cursor-pointer shrink-0 ml-2"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Popup Content Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-72px)] p-6 md:p-8 space-y-6">
          {/* 3. Image (strictly one single image used everywhere) */}
          {heroImage && (
            <div className="relative w-full aspect-video max-h-[400px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg">
              <img
                src={heroImage}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070d] via-transparent to-black/20" />
            </div>
          )}

          {/* Render embedded video trailer instead if present and no main image (upcoming/videos) */}
          {!heroImage && (post.embedCode || post.videoEmbed) && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/80 shadow-lg">
              {post.embedCode ? (
                <div
                  className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:aspect-video"
                  dangerouslySetInnerHTML={{ __html: post.embedCode }}
                />
              ) : (
                <iframe
                  src={post.videoEmbed}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={post.title}
                />
              )}
            </div>
          )}

          {/* 4. Title & 5. Short Description */}
          <div className="space-y-3 text-left">
            {post.title && post.title.trim() !== '' && (
              <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-wide uppercase">
                {post.title}
              </h1>
            )}
            {shortDesc && shortDesc !== '' && (
              <p className="text-sm sm:text-base text-gray-300 font-sans leading-relaxed border-l-2 border-cyber-cyan/30 pl-4">
                {shortDesc}
              </p>
            )}
          </div>

          {/* 6. Full Description */}
          {showFullDesc && (
            <div className="text-left space-y-2">
              <h3 className="text-xs font-display font-bold text-cyber-cyan uppercase tracking-wider">About Content</h3>
              <div className="p-5 sm:p-6 bg-black/40 border border-white/5 rounded-2xl text-gray-300 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line text-left">
                {fullDesc}
              </div>
            </div>
          )}

          {/* Dynamic Sections by Type */}
          {isMod && post.credits && (
            <div className="text-left space-y-2">
              <h3 className="text-xs font-display font-bold text-cyber-purple uppercase tracking-wider">Mod Requirements & Credits</h3>
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-line">
                {post.credits}
              </div>
            </div>
          )}

          {/* AdSense / Ad Placement inside Popup */}
          <div className="my-4">
            <AdSensePlacement slot="article_top" units={adsenseUnits} />
            <AdPlacement position="blog_top" ads={ads} />
          </div>

          {/* 7. Creator Info, 8. Publish Date, 9. Last Updated (strictly professional grids, hide empty) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-left">
            {/* Creator / Publisher */}
            {finalCreatorName && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                  <User className="w-4 h-4 text-cyber-cyan" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">
                    {getCreatorLabel()}
                  </span>
                  <div className="text-xs text-gray-200 truncate font-semibold uppercase">
                    {finalCreatorName}
                  </div>
                </div>
              </div>
            )}

            {/* Email (Games/Featured) */}
            {isGame && post.developerEmail && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-cyber-purple" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">
                    Support Email
                  </span>
                  <div className="text-xs text-gray-200 truncate font-mono">
                    {post.developerEmail}
                  </div>
                </div>
              </div>
            )}

            {/* Version */}
            {(isGame || isMod) && post.version && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                  <Info className="w-4 h-4 text-cyber-magenta" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">
                    Version Index
                  </span>
                  <div className="text-xs text-gray-200 truncate font-mono font-bold">
                    v{post.version}
                  </div>
                </div>
              </div>
            )}

            {/* 8. Publish Date */}
            {post.publishDate && post.publishDate.trim() !== '' && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">
                    {isUpcoming ? 'Release Target' : 'Published Date'}
                  </span>
                  <div className="text-xs text-gray-200 truncate font-mono">
                    {post.publishDate}
                  </div>
                </div>
              </div>
            )}

            {/* 9. Last Updated */}
            {post.updatedDate && post.updatedDate.trim() !== '' && (
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">
                    Last Updated
                  </span>
                  <div className="text-xs text-gray-200 truncate font-mono">
                    {post.updatedDate}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Embedded Trailer Video for Upcoming or Guides (if main image is rendered) */}
          {heroImage && (post.embedCode || post.videoEmbed) && (
            <div className="text-left space-y-2 pt-2">
              <h3 className="text-xs font-display font-bold text-cyber-magenta uppercase tracking-wider">Video Experience</h3>
              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/5 bg-black/80 shadow-md">
                {post.embedCode ? (
                  <div
                    className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:aspect-video"
                    dangerouslySetInnerHTML={{ __html: post.embedCode }}
                  />
                ) : (
                  <iframe
                    src={post.videoEmbed}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title={`${post.title} Video Preview`}
                  />
                )}
              </div>
            </div>
          )}

          {/* 10. Tags list */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-left">
              <Tag className="w-4 h-4 text-cyber-cyan mr-1 shrink-0" />
              {tagList.map((t, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    onClose();
                    onTagClick?.(t);
                  }}
                  className="px-3 py-1 bg-white/5 border border-white/10 hover:border-cyber-cyan rounded-lg text-xs font-mono text-gray-300 uppercase transition-colors cursor-pointer"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* 11. Action Buttons & 12. Share Button (Strict order & visual prioritization) */}
          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center gap-3">
            {/* 11. Action Buttons */}
            {actionButtons.map((btn) => {
              let btnClass = "px-5 py-3 rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 border ";
              if (btn.variant === 'gradient') {
                btnClass += "bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-110 hover:scale-[1.01] active:scale-95 text-black font-black border-transparent shadow-[0_0_15px_rgba(0,240,255,0.3)]";
              } else if (btn.variant === 'magenta') {
                btnClass += "bg-cyber-magenta/20 hover:bg-cyber-magenta/35 border-cyber-magenta/40 text-cyber-magenta hover:shadow-[0_0_15px_rgba(255,0,127,0.25)]";
              } else if (btn.variant === 'green') {
                btnClass += "bg-green-500/20 hover:bg-green-500/35 border-green-500/40 text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.25)]";
              } else if (btn.variant === 'cyan') {
                btnClass += "bg-white/10 hover:bg-cyber-cyan/20 border-white/15 hover:border-cyber-cyan text-white hover:text-cyber-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]";
              } else {
                btnClass += "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30 text-gray-300 hover:text-white";
              }

              return (
                <button
                  key={btn.key}
                  onClick={() => handleBtnClick(btn.url)}
                  className={btnClass}
                >
                  {btn.icon}
                  <span>{btn.label}</span>
                </button>
              );
            })}

            {/* 12. Share Button (Identical sizing, padding, and font size as action buttons) */}
            <button
              onClick={handleShareClick}
              className="ml-auto px-5 py-3 bg-black/60 hover:bg-cyber-cyan/15 border border-white/10 hover:border-cyber-cyan text-gray-300 hover:text-cyber-cyan font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>SHARE</span>
            </button>
          </div>
        </div>

        {/* Share Modal Overlay */}
        {showShareModal && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowShareModal(false)}
          >
            <div
              className="w-full max-w-md bg-[#07070d] border border-cyber-cyan/40 rounded-2xl p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 text-left">
                Share Content
              </h3>
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-transparent text-xs text-gray-300 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan rounded-lg text-xs font-mono font-bold uppercase hover:bg-cyber-cyan hover:text-black transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
