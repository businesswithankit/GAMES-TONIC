import React, { useState } from 'react';
import {
  Calendar,
  Tag,
  User,
  Eye,
  Download,
  ExternalLink,
  CalendarDays,
  Share2,
  Globe,
  Mail,
  Code,
  Info,
  Sparkles,
  Link as LinkIcon,
  Video,
  Award,
  Check,
  Copy
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

interface MetadataItem {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
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

  const shareUrl = window.location.href;
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
        // Fallback to modal if user cancels or error occurs
      }
    }
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe tag extraction
  const tagList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === 'string' && post.tags.trim()
    ? (post.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // Determine cover / banner image
  const heroImage = post.cover || post.banner || post.thumbnail || post.imageLink;

  // Resolve distinct links for buttons
  const promptUrl = post.promptLink?.trim();
  
  const websiteUrl = (
    post.websiteLink ||
    post.officialWebsite ||
    post.gameLink ||
    (post.type === 'games' && post.buttonLink ? post.buttonLink : undefined)
  )?.trim();

  const downloadUrl = (
    post.downloadLink ||
    post.extraLink ||
    (post.type === 'mods' && post.buttonLink ? post.buttonLink : undefined)
  )?.trim();

  const videoUrl = (
    (post.type === 'videos' && post.buttonLink ? post.buttonLink : undefined) ||
    post.channelUrl
  )?.trim();

  const sourceUrl = (
    post.source ||
    (post.developerWebsite && post.developerWebsite !== websiteUrl ? post.developerWebsite : undefined)
  )?.trim();

  // Custom link button if buttonLink exists and is different from above
  const isCustomButtonNeeded =
    post.buttonLink &&
    post.linkEnabled !== false &&
    post.buttonLink.trim() !== promptUrl &&
    post.buttonLink.trim() !== websiteUrl &&
    post.buttonLink.trim() !== downloadUrl &&
    post.buttonLink.trim() !== videoUrl &&
    post.buttonLink.trim() !== sourceUrl;

  const customButtonUrl = isCustomButtonNeeded ? post.buttonLink?.trim() : undefined;

  // Dynamically prepare all metadata fields from Admin Panel (never show blank labels, hide if empty)
  const metadataItems: MetadataItem[] = [];

  const devName = post.developerName || (post.author && post.author !== 'GAMES TONIC' ? post.author : '');
  if (devName && devName.trim() !== '') {
    metadataItems.push({
      label: 'Developer / Author',
      value: <span className="text-white font-semibold uppercase">{devName}</span>,
      icon: <User className="w-4 h-4 text-cyber-cyan" />
    });
  }

  if (post.developerEmail && post.developerEmail.trim() !== '') {
    metadataItems.push({
      label: 'Developer Email',
      value: (
        <a
          href={`mailto:${post.developerEmail}`}
          className="text-cyber-cyan hover:underline truncate block"
        >
          {post.developerEmail}
        </a>
      ),
      icon: <Mail className="w-4 h-4 text-cyber-purple" />
    });
  }

  if (post.developerWebsite && post.developerWebsite.trim() !== '') {
    metadataItems.push({
      label: 'Developer Website',
      value: (
        <a
          href={post.developerWebsite}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline truncate block"
        >
          {post.developerWebsite}
        </a>
      ),
      icon: <Globe className="w-4 h-4 text-cyber-cyan" />
    });
  }

  const sourceOrCredits = post.source || post.credits || post.sourceCredits;
  if (sourceOrCredits && sourceOrCredits.trim() !== '') {
    metadataItems.push({
      label: 'Source / Credits',
      value: <span className="text-gray-300 break-words">{sourceOrCredits}</span>,
      icon: <Info className="w-4 h-4 text-amber-400" />
    });
  }

  if (websiteUrl && websiteUrl !== post.developerWebsite) {
    metadataItems.push({
      label: 'Official Website',
      value: (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline truncate block"
        >
          {websiteUrl}
        </a>
      ),
      icon: <Globe className="w-4 h-4 text-cyber-cyan" />
    });
  }

  if (promptUrl) {
    metadataItems.push({
      label: 'Prompt Link',
      value: (
        <a
          href={promptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline truncate block font-mono text-xs"
        >
          {promptUrl}
        </a>
      ),
      icon: <Sparkles className="w-4 h-4 text-cyber-magenta" />
    });
  }

  if (downloadUrl) {
    metadataItems.push({
      label: 'Download Link',
      value: (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyber-cyan hover:underline truncate block font-mono text-xs"
        >
          {downloadUrl}
        </a>
      ),
      icon: <Download className="w-4 h-4 text-green-400" />
    });
  }

  if (post.version && post.version.trim() !== '') {
    metadataItems.push({
      label: 'Version',
      value: <span className="font-mono text-amber-400 font-bold uppercase">v{post.version}</span>,
      icon: <Award className="w-4 h-4 text-amber-400" />
    });
  }

  if (post.publishDate && post.publishDate.trim() !== '') {
    metadataItems.push({
      label: 'Publish Date',
      value: <span className="text-gray-300 font-mono">{post.publishDate}</span>,
      icon: <Calendar className="w-4 h-4 text-gray-400" />
    });
  }

  if (post.updatedDate && post.updatedDate.trim() !== '') {
    metadataItems.push({
      label: 'Last Updated',
      value: <span className="text-gray-300 font-mono">{post.updatedDate}</span>,
      icon: <CalendarDays className="w-4 h-4 text-gray-400" />
    });
  }

  if (post.viewsCount && post.viewsCount > 0) {
    metadataItems.push({
      label: 'Total Views',
      value: <span className="text-gray-300 font-mono">{post.viewsCount.toLocaleString()}</span>,
      icon: <Eye className="w-4 h-4 text-gray-400" />
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md animate-fade-in flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel-neon border border-cyber-cyan/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,240,255,0.2)] bg-[#0c0c16] font-sans my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-[#0c0c16]/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden pr-4">
            {post.category && (
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
            {post.version && (
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full shrink-0">
                v{post.version}
              </span>
            )}
            <h2 className="text-xs sm:text-sm font-display font-bold text-gray-300 truncate uppercase">
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
          {/* Cover / Banner Image */}
          {heroImage && (
            <div className="relative w-full aspect-video max-h-[420px] rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg">
              <img
                src={heroImage}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-transparent to-black/30" />
            </div>
          )}

          {/* Title and Short Description */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-wide uppercase">
              {post.title}
            </h1>
            {post.shortDescription && (
              <p className="text-base sm:text-lg text-gray-200 font-sans leading-relaxed">
                {post.shortDescription}
              </p>
            )}
          </div>

          {/* Video Embed if present */}
          {(post.embedCode || post.videoEmbed) && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/80 shadow-lg my-6">
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

          {/* Full Description / Content */}
          {(post.description || post.content) &&
            (post.description || post.content) !== post.shortDescription && (
              <div className="p-5 sm:p-6 bg-black/40 border border-white/10 rounded-2xl text-gray-300 font-sans text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {post.description || post.content}
              </div>
            )}

          {/* AdSense / Ad Placement inside Popup */}
          <div className="my-4">
            <AdSensePlacement slot="article_top" units={adsenseUnits} />
            <AdPlacement position="blog_top" ads={ads} />
          </div>

          {/* Dynamic Admin Panel Metadata Grid (Never show blank labels, automatically hide empty fields) */}
          {metadataItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {metadataItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block mb-0.5">
                      {item.label}
                    </span>
                    <div className="text-xs text-gray-200 truncate">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Tag className="w-4 h-4 text-cyber-cyan mr-1" />
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

          {/* Action Buttons Bar (Show buttons only when links exist; automatically hide if no link is available; always include Share button) */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
            {promptUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(promptUrl, true);
                  } else {
                    window.open(promptUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-125 text-black font-display font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <Sparkles className="w-4 h-4" />
                <span>GET PROMPT</span>
              </button>
            )}

            {websiteUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(websiteUrl, true);
                  } else {
                    window.open(websiteUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-white/10 hover:bg-cyber-cyan/20 border border-white/20 hover:border-cyber-cyan text-white hover:text-cyber-cyan font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>{post.buttonText && post.type === 'games' ? post.buttonText : 'VISIT WEBSITE'}</span>
              </button>
            )}

            {downloadUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(downloadUrl, true);
                  } else {
                    window.open(downloadUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{post.buttonText && post.type === 'mods' ? post.buttonText : 'DOWNLOAD'}</span>
              </button>
            )}

            {videoUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(videoUrl, true);
                  } else {
                    window.open(videoUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-cyber-magenta/20 hover:bg-cyber-magenta/30 border border-cyber-magenta/40 text-cyber-magenta font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>{post.buttonText || 'WATCH VIDEO'}</span>
              </button>
            )}

            {sourceUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(sourceUrl, true);
                  } else {
                    window.open(sourceUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>OFFICIAL SOURCE</span>
              </button>
            )}

            {customButtonUrl && (
              <button
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(customButtonUrl, true);
                  } else {
                    window.open(customButtonUrl, '_blank');
                  }
                }}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{post.buttonText || 'OPEN LINK'}</span>
              </button>
            )}

            {/* SHARE BUTTON: Every popup must include a Share button */}
            <button
              onClick={handleShareClick}
              className="ml-auto px-5 py-3 bg-black/60 hover:bg-cyber-cyan/15 border border-white/15 hover:border-cyber-cyan text-gray-300 hover:text-cyber-cyan font-display font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
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
              className="w-full max-w-md bg-[#0c0c16] border border-cyber-cyan/40 rounded-2xl p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
              <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4">
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
