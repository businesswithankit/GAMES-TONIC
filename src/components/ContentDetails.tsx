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
        // Fallback to clipboard
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
  // A Featured Game popup is determined if the type is games or featured is active or if category is featured game
  const isFeaturedGamePopup = type === 'games' || post.featured === true || post.category === 'FEATURED GAME';

  // Safe tag extraction
  const tagList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === 'string' && post.tags.trim()
    ? (post.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const heroImage = post.thumbnail || post.imageLink;

  const isValidUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.');
  };

  const fullDesc = (post.description || post.content)?.trim();
  const shortDesc = post.shortDescription?.trim();

  const hasCustomAdminBtn =
    type === 'games' &&
    post.buttonText &&
    post.buttonText.trim() !== '' &&
    post.buttonLink &&
    isValidUrl(post.buttonLink) &&
    post.linkEnabled !== false;

  // ----------------------------------------------------
  // BUTTONS CONFIGURATION
  // ----------------------------------------------------
  const actionButtons: { key: string; label: string; url: string; icon: React.ReactNode; variant: string }[] = [];
  const usedUrls = new Set<string>();

  if (isFeaturedGamePopup) {
    // Featured Game Popup Buttons (Strict order & priority)
    // 1st (Primary CTA): GET PROMPT (Gradient button, Only if Prompt URL exists)
    if (post.promptLink && isValidUrl(post.promptLink)) {
      const trimmedPrompt = post.promptLink.trim();
      actionButtons.push({
        key: 'prompt',
        label: 'GET PROMPT',
        url: trimmedPrompt,
        icon: <Sparkles className="w-4 h-4 shrink-0" />,
        variant: 'gradient'
      });
      usedUrls.add(trimmedPrompt);
    }

    // 2nd (Secondary CTA): PLAY NOW (If Download/Game URL exists)
    const targetDownloadUrl = (post.websiteLink || post.gameLink)?.trim();
    if (targetDownloadUrl && isValidUrl(targetDownloadUrl) && !usedUrls.has(targetDownloadUrl)) {
      actionButtons.push({
        key: 'download',
        label: 'PLAY NOW',
        url: targetDownloadUrl,
        icon: <Download className="w-4 h-4 shrink-0" />,
        variant: 'green'
      });
      usedUrls.add(targetDownloadUrl);
    }

    // 4th: OFFICIAL SOURCE (Optional, e.g. source URL / officialWebsite, check if distinct)
    const targetSource = (post.source || post.officialWebsite)?.trim();
    if (targetSource && isValidUrl(targetSource) && targetSource !== post.developerWebsite && targetSource !== targetDownloadUrl && !usedUrls.has(targetSource)) {
      actionButtons.push({
        key: 'source',
        label: 'OFFICIAL SOURCE',
        url: targetSource,
        icon: <ExternalLink className="w-4 h-4 shrink-0" />,
        variant: 'neutral'
      });
      usedUrls.add(targetSource);
    }
  } else {
    // Standard Content Popup Buttons (Watch, Download, Prompt, Website, Source)
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
      post.authorWebsite ||
      post.buttonLink
    )?.trim();

    const sourceUrl = (
      (post.source && isValidUrl(post.source) ? post.source : undefined) ||
      (post.authorWebsite && post.authorWebsite !== websiteUrl ? post.authorWebsite : undefined)
    )?.trim();

    const hasPrompt = isValidUrl(promptUrl);
    const hasDownload = isValidUrl(downloadUrl);
    const hasWatch = isValidUrl(watchUrl);
    const hasWebsite = isValidUrl(websiteUrl);

    if (hasWatch && !usedUrls.has(watchUrl!)) {
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

    if (hasDownload && !usedUrls.has(downloadUrl!)) {
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

    if (hasPrompt && !usedUrls.has(promptUrl!)) {
      actionButtons.push({
        key: 'prompt',
        label: 'GET PROMPT',
        url: promptUrl!,
        icon: <Sparkles className="w-4 h-4 shrink-0" />,
        variant: 'gradient'
      });
      usedUrls.add(promptUrl!);
    }

    if (hasWebsite && !usedUrls.has(websiteUrl!)) {
      const isPrimary = !hasPrompt && !hasDownload && !hasWatch;
      actionButtons.push({
        key: 'website',
        label: 'OFFICIAL PROFILE / WEBSITE',
        url: websiteUrl!,
        icon: <Globe className="w-4 h-4 shrink-0" />,
        variant: isPrimary ? 'gradient' : 'cyan'
      });
      usedUrls.add(websiteUrl!);
    }

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
  }

  // Deduplicate custom admin button: do not render if its link is already in usedUrls
  const showCustomAdminBtn = hasCustomAdminBtn && 
    post.buttonLink && 
    !usedUrls.has(post.buttonLink.trim());

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
          <div className="flex items-center gap-2.5 overflow-hidden pr-4 text-left">
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
            className="p-2.5 bg-black/70 border border-white/10 text-white rounded-full hover:border-cyber-cyan hover:text-cyber-cyan hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all cursor-pointer shrink-0 ml-2 text-xs font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Popup Content Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-72px)] p-6 md:p-8 space-y-6">
          {/* Main Visual Asset (strictly one single image) */}
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

          {/* Render embedded video trailer instead if present and no main image */}
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

          {/* Title & Short Description */}
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

          {/* About Content (Displays description only, never auto insert Developer name) */}
          {(!isFeaturedGamePopup || (fullDesc && fullDesc !== '')) && (
            <div className="text-left space-y-2">
              <h3 className="text-xs font-display font-bold text-cyber-cyan uppercase tracking-wider">About Content</h3>
              <div className="p-5 sm:p-6 bg-black/40 border border-white/5 rounded-2xl text-gray-300 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line text-left">
                {fullDesc && fullDesc !== '' ? fullDesc : "No additional content information available."}
              </div>
            </div>
          )}

          {/* AdSense / Ad Placement inside Popup */}
          <div className="my-4">
            <AdSensePlacement slot="article_top" units={adsenseUnits} />
            <AdPlacement position="blog_top" ads={ads} />
          </div>

          {/* Render Different Credit Blocks based on Popup Type */}
          {isFeaturedGamePopup ? (
            // ==========================================
            // FEATURED GAME POPUP INFO CARDS
            // ==========================================
            <div className="text-left space-y-3">
              <h3 className="text-xs font-display font-bold text-cyber-cyan uppercase tracking-wider">Game Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Developer */}
                {post.developerName && post.developerName.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <User className="w-4 h-4 text-cyber-cyan" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Developer</span>
                      <div className="text-xs text-gray-200 truncate font-semibold uppercase">{post.developerName}</div>
                    </div>
                  </div>
                )}

                {/* Support Email */}
                {post.developerEmail && post.developerEmail.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <ShieldCheck className="w-4 h-4 text-cyber-purple" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Support Email</span>
                      <div className="text-xs text-gray-200 truncate font-mono">{post.developerEmail}</div>
                    </div>
                  </div>
                )}

                {/* Official Website (Must appear as information card AND button) */}
                {post.developerWebsite && post.developerWebsite.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <Globe className="w-4 h-4 text-cyber-cyan" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Official Website</span>
                      <a href={post.developerWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-cyber-cyan truncate font-mono hover:underline block">
                        {post.developerWebsite}
                      </a>
                    </div>
                  </div>
                )}

                {/* Prompt URL */}
                {post.promptLink && post.promptLink.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <Sparkles className="w-4 h-4 text-cyber-magenta" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Prompt URL</span>
                      <a href={post.promptLink} target="_blank" rel="noopener noreferrer" className="text-xs text-cyber-cyan truncate font-mono hover:underline block">
                        {post.promptLink}
                      </a>
                    </div>
                  </div>
                )}

                {/* Download URL */}
                {(post.websiteLink || post.gameLink) && (post.websiteLink || post.gameLink)!.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <Download className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Download URL</span>
                      <a href={post.websiteLink || post.gameLink} target="_blank" rel="noopener noreferrer" className="text-xs text-cyber-cyan truncate font-mono hover:underline block">
                        {post.websiteLink || post.gameLink}
                      </a>
                    </div>
                  </div>
                )}

                {/* Version */}
                {post.version && post.version.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <Info className="w-4 h-4 text-cyber-magenta" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Version</span>
                      <div className="text-xs text-gray-200 truncate font-mono font-bold">v{post.version}</div>
                    </div>
                  </div>
                )}

                {/* Published Date */}
                {post.publishDate && post.publishDate.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Published Date</span>
                      <div className="text-xs text-gray-200 truncate font-mono">{post.publishDate}</div>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                {post.updatedDate && post.updatedDate.trim() !== '' && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] text-gray-500 font-mono uppercase block mb-0.5">Last Updated</span>
                      <div className="text-xs text-gray-200 truncate font-mono">{post.updatedDate}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ==========================================
            // CONTENT POPUP - STRUCTURED SINGLE CREDIT BLOCK
            // ==========================================
            <div className="space-y-4">
              <div className="border-t border-white/10 my-6" />
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Published By */}
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">
                      Published By
                    </span>
                    <div className="text-xs text-gray-200 truncate font-semibold uppercase">
                      {post.author && post.author.trim() !== '' && post.author !== 'Admin' ? post.author : 'GAMES TONIC'}
                    </div>
                  </div>

                  {/* Published Date */}
                  {post.publishDate && post.publishDate.trim() !== '' && (
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">
                        Published Date
                      </span>
                      <div className="text-xs text-gray-200 truncate font-mono">
                        {post.publishDate}
                      </div>
                    </div>
                  )}

                  {/* Official Website (optional) */}
                  {post.authorWebsite && post.authorWebsite.trim() !== '' && (
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">
                        Official Profile / Website
                      </span>
                      <a
                        href={post.authorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyber-cyan hover:underline font-mono truncate block"
                      >
                        {post.authorWebsite}
                      </a>
                    </div>
                  )}

                  {/* Contact Email (optional) */}
                  {post.authorEmail && post.authorEmail.trim() !== '' && (
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">
                        Contact Email
                      </span>
                      <div className="text-xs text-gray-200 truncate font-mono">
                        {post.authorEmail}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags inside the Credit block */}
                {tagList.length > 0 && (
                  <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono uppercase mr-1 shrink-0">Tags:</span>
                    {tagList.map((t, idx) => (
                      <span
                        key={idx}
                        onClick={() => {
                          onClose();
                          onTagClick?.(t);
                        }}
                        className="px-2.5 py-0.5 bg-white/5 border border-white/10 hover:border-cyber-cyan rounded text-xs font-mono text-gray-300 uppercase transition-colors cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Embedded Trailer Video Section (if main image is rendered and trailer is also configured) */}
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

          {/* Action Buttons & Share Button */}
          <div className="pt-6 border-t border-white/5 flex flex-wrap items-center gap-3">
            {/* Action Buttons (Strict order & priority) */}
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

            {/* Custom Admin Button from Admin form */}
            {showCustomAdminBtn && (
              <button
                onClick={() => handleBtnClick(post.buttonLink!)}
                className="ml-auto px-5 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-110 hover:scale-[1.01] active:scale-95 text-black font-black border-transparent shadow-[0_0_15px_rgba(0,240,255,0.3)] rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{post.buttonText}</span>
              </button>
            )}

            {/* Share Button (Identical sizing & padding) */}
            <button
              onClick={handleShareClick}
              className={`${showCustomAdminBtn ? 'ml-0' : 'ml-auto'} px-5 py-3 bg-black/60 hover:bg-cyber-cyan/15 border border-white/10 hover:border-cyber-cyan text-gray-300 hover:text-cyber-cyan font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2`}
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
