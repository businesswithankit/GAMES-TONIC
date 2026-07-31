import { useEffect, useState } from 'react';
import { Calendar, Tag, User, Eye, Download, ExternalLink, CalendarDays, MapPin, Share2, Copy, Check, MessageCircle, Send, Globe, Mail, Code, Info } from 'lucide-react';
import { ContentPost, Advertisement, AdSenseUnit } from '../types';
import { db } from '../lib/firebase';
import { ref, runTransaction } from 'firebase/database';
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

export default function ContentDetails({ post, onClose, onTagClick, onCategoryClick, onActionClick, ads = [], adsenseUnits = [] }: ContentDetailsProps) {
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
        // Fallback to manual list if user cancels or error occurs
      }
    }
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (post.category === 'FEATURED GAME' || post.featured) {
    const targetLink = post.promptLink || post.buttonLink || post.extraLink;
    const devName = post.developerName || (post.author && post.author !== 'GAMES TONIC' ? post.author : '');
    const hasTags = Array.isArray(post.tags) && post.tags.length > 0;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-cyber-dark/95 backdrop-blur-xl animate-fade-in pb-16 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl glass-panel-neon border border-cyber-cyan/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.15)] bg-[#0c0c16] font-sans my-auto">
          
          {/* Floating Close Button */}
          <button
            onClick={onClose}
            id="detail-close-btn"
            className="absolute top-4 right-4 p-2.5 bg-black/70 border border-white/10 text-white rounded-full hover:border-cyber-cyan hover:text-cyber-cyan transition-all cursor-pointer z-10"
          >
            ✕
          </button>

          {/* Game Image */}
          {(post.banner || post.thumbnail) && (
            <div className="relative w-full aspect-video max-h-[420px] overflow-hidden bg-black">
              <img
                src={post.banner || post.thumbnail}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c16] via-transparent to-black/30" />
              
              <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {post.category && (
                    <span className="text-[10px] uppercase font-display font-bold tracking-widest text-cyber-cyan bg-cyber-cyan/15 border border-cyber-cyan/30 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  )}
                  {post.version && (
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full">
                      v{post.version}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleShareClick}
                  className="px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/20 hover:border-cyber-cyan text-white text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>SHARE</span>
                </button>
              </div>
            </div>
          )}

          {/* Details Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Game Name & Share */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl md:text-4xl font-display font-black text-white tracking-wider uppercase text-glow flex-1">
                {post.title}
              </h1>
              {!(post.banner || post.thumbnail) && (
                <button
                  onClick={handleShareClick}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-cyber-cyan text-white text-xs font-mono font-bold rounded-lg uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>SHARE</span>
                </button>
              )}
            </div>

            {/* Short Description */}
            {post.shortDescription && (
              <div className="text-base md:text-lg text-cyber-cyan/90 font-sans font-medium leading-relaxed bg-cyber-cyan/5 border-l-4 border-cyber-cyan p-4 rounded-r-xl">
                {post.shortDescription}
              </div>
            )}

            {/* Full Description */}
            {post.description && post.description !== post.shortDescription && (
              <div className="prose prose-invert max-w-none text-gray-300 font-sans text-sm md:text-base leading-relaxed bg-white/[0.02] p-5 rounded-xl border border-white/5 whitespace-pre-wrap">
                {post.description}
              </div>
            )}

            {/* Metadata Grid (Developer, Website, Dates, Thumbnail URL preview) */}
            {(devName || post.developerEmail || post.developerWebsite || post.websiteLink || post.publishDate || post.updatedDate || post.thumbnail) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-black/40 p-5 rounded-2xl border border-white/5 text-xs text-gray-300 font-sans">
                {devName && (
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-cyber-cyan shrink-0" />
                    <div className="truncate">
                      <span className="text-gray-500 block text-[10px] uppercase">Developer Name</span>
                      <span className="font-semibold text-white">{devName}</span>
                    </div>
                  </div>
                )}

                {post.developerEmail && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-cyber-magenta shrink-0" />
                    <div className="truncate">
                      <span className="text-gray-500 block text-[10px] uppercase">Developer Email</span>
                      <a href={`mailto:${post.developerEmail}`} className="text-cyber-cyan hover:underline truncate">
                        {post.developerEmail}
                      </a>
                    </div>
                  </div>
                )}

                {post.developerWebsite && (
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-gray-500 block text-[10px] uppercase">Developer Website</span>
                      <a
                        href={post.developerWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-cyan hover:underline truncate block"
                      >
                        {post.developerWebsite}
                      </a>
                    </div>
                  </div>
                )}

                {post.websiteLink && (
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-cyber-cyan shrink-0" />
                    <div className="truncate">
                      <span className="text-gray-500 block text-[10px] uppercase">External Website Link</span>
                      <a
                        href={post.websiteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-cyan hover:underline truncate block"
                      >
                        {post.websiteLink}
                      </a>
                    </div>
                  </div>
                )}

                {post.publishDate && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Created Date</span>
                      <span className="text-gray-300">{post.publishDate}</span>
                    </div>
                  </div>
                )}

                {post.updatedDate && (
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Updated Date</span>
                      <span className="text-gray-300">{post.updatedDate}</span>
                    </div>
                  </div>
                )}

                {post.thumbnail && post.thumbnail !== post.banner && (
                  <div className="flex items-center gap-2.5 sm:col-span-2 lg:col-span-3">
                    <Info className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-gray-500 block text-[10px] uppercase">Thumbnail URL</span>
                      <a
                        href={post.thumbnail}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white truncate block text-[11px]"
                      >
                        {post.thumbnail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {hasTags && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Tag className="w-4 h-4 text-cyber-cyan mr-1" />
                {post.tags.map((t, idx) => (
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

            {/* Prompt Link Button */}
            {targetLink && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onActionClick) {
                      onActionClick(targetLink, true);
                    } else {
                      window.open(targetLink, '_blank');
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-125 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-black font-display font-black text-sm uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5 text-black" />
                  <span>GET PROMPT</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Modal */}
          {showShareModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="w-full max-w-md bg-[#0c0c16] border border-cyber-cyan/40 rounded-2xl p-6 shadow-2xl relative">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4">
                  Share Featured Game
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
                    className="px-3 py-1.5 bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-cyan rounded-lg text-xs font-mono font-bold uppercase hover:bg-cyber-cyan hover:text-black transition-colors shrink-0"
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cyber-dark/95 backdrop-blur-xl animate-fade-in pb-16">
      {/* Visual Header Banner - Fully Responsive */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={post.banner || post.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-50"
        />
        {/* Ambient Dark Neon Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark via-cyber-dark/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-5xl mx-auto px-6 py-8">
          {/* Tags / Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              onClick={() => onCategoryClick?.(post.category)}
              className="text-xs uppercase font-display font-semibold tracking-wider text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30 px-3 py-1 rounded-full cursor-pointer hover:bg-cyber-cyan/20 transition-colors"
            >
              {post.category}
            </span>
            {post.featured && (
              <span className="text-xs uppercase font-display font-semibold tracking-wider text-cyber-magenta bg-cyber-magenta/15 border border-cyber-magenta/40 px-3 py-1 rounded-full">
                ★ FEATURED
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-widest text-glow mb-4 uppercase">
            {post.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-400 font-sans border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyber-purple" />
              <span>BY <strong className="text-white">{post.author}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyber-purple" />
              <span>{post.publishDate}</span>
            </div>
            <button
              onClick={handleShareClick}
              className="ml-auto flex items-center gap-1.5 text-cyber-cyan hover:brightness-125 transition-all text-xs font-display cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE RECORD</span>
            </button>
          </div>
        </div>

        {/* Close Button Floating */}
        <button
          onClick={onClose}
          id="detail-close-btn"
          className="absolute top-6 right-6 p-3 bg-black/60 border border-white/10 text-white rounded-full hover:border-cyber-cyan hover:text-cyber-cyan hover:shadow-[0_0_8px_#00f0ff] transition-all cursor-pointer z-10"
        >
          ✕
        </button>
      </div>

      {/* TOP DETAIL ADS */}
      <div className="max-w-5xl mx-auto px-6 mt-4">
        <AdSensePlacement slot="article_top" units={adsenseUnits} />
        {post.type === 'blogs' && <><AdSensePlacement slot="blog_top" units={adsenseUnits} /><AdPlacement position="blog_top" ads={ads} /></>}
        {post.type === 'mods' && <><AdSensePlacement slot="mod_top" units={adsenseUnits} /><AdPlacement position="mod_top" ads={ads} /></>}
      </div>

      {/* Primary Article Layout */}
      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Article Content (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 md:p-8 glass-panel-neon rounded-2xl border border-white/5 space-y-6">
            {/* Short Description Quote block */}
            <p className="text-lg md:text-xl font-medium text-cyber-cyan/90 border-l-4 border-cyber-cyan pl-4 italic leading-relaxed">
              {post.shortDescription}
            </p>

            {/* MIDDLE ARTICLE ADS */}
            <AdSensePlacement slot="article_middle" units={adsenseUnits} />
            {post.type === 'blogs' && <AdPlacement position="blog_middle" ads={ads} />}

            {/* Complete HTML/Markdown Description */}
            <div className="prose prose-invert max-w-none text-gray-300 space-y-4 font-sans text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {post.description}
            </div>
          </div>

          {/* BOTTOM COLUMN ADS */}
          <AdSensePlacement slot="article_bottom" units={adsenseUnits} />
          {post.type === 'blogs' && <><AdSensePlacement slot="blog_bottom" units={adsenseUnits} /><AdPlacement position="blog_bottom" ads={ads} /></>}
          {post.type === 'mods' && <><AdSensePlacement slot="mod_bottom" units={adsenseUnits} /><AdPlacement position="mod_bottom" ads={ads} /></>}
        </div>

        {/* Custom Actions & Specs Panels (Right Sidebar) */}
        <div className="space-y-6">
          {/* Action Call for custom URLs */}
          {post.extraLink && (
            <div className="p-6 glass-panel-neon rounded-2xl border border-cyber-cyan/30 text-center space-y-4 shadow-[0_4px_24px_rgba(0,240,255,0.05)]">
              <h3 className="font-display font-bold text-white text-base tracking-wider uppercase">
                {post.type === 'mods' ? 'DOWNLOAD ARTIFACT' : post.type === 'events' ? 'PORTAL REGISTRATION' : 'LAUNCH ACCESS'}
              </h3>
              <p className="text-xs text-gray-400">
                {post.type === 'mods' 
                  ? 'Verify directory pathways inside game roots before running mod installation.' 
                  : 'Register safely using standard secure game protocol redirections.'
                }
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (onActionClick) {
                    onActionClick(post.extraLink!, true);
                  } else {
                    window.open(post.extraLink, '_blank');
                  }
                }}
                className="inline-flex w-full items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-125 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] text-dark font-display font-bold text-sm uppercase rounded-xl transition-all cursor-pointer text-black"
              >
                {post.type === 'mods' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                <span>
                  {post.type === 'mods' ? 'Download Now' : post.type === 'events' ? 'Register Now' : 'Launch Link'}
                </span>
              </button>
            </div>
          )}

          {/* Tags Widget */}
          {post.tags && post.tags.length > 0 && (
            <div className="p-6 glass-panel rounded-2xl border border-white/5 space-y-4">
              <h4 className="font-display font-bold text-white text-sm tracking-widest uppercase pb-2 border-b border-white/5">
                INDEXED TAGS
              </h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onTagClick?.(tag);
                      onClose();
                    }}
                    className="text-xs bg-white/5 border border-white/10 hover:border-cyber-cyan hover:text-cyber-cyan px-2.5 py-1 rounded transition-colors text-gray-400 cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Specifications Widget */}
          <div className="p-6 glass-panel rounded-2xl border border-white/5 space-y-4">
            <h4 className="font-display font-bold text-white text-sm tracking-widest uppercase pb-2 border-b border-white/5">
              SPEC SHEET
            </h4>
            <div className="space-y-3 text-xs font-mono text-gray-400">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>POST ID</span>
                <span className="text-white text-right font-display text-[10px] tracking-tighter truncate max-w-[150px]">
                  {post.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>CONTENT TYPE</span>
                <span className="text-cyber-magenta font-display uppercase font-bold text-[10px]">
                  {post.type}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>SEO TITLE</span>
                <span className="text-white text-right truncate max-w-[150px]">
                  {post.seoTitle || post.title}
                </span>
              </div>
            </div>
          </div>

          {/* SIDEBAR AD ZONE */}
          <AdPlacement position="sidebar" ads={ads} />
        </div>
      </div>

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowShareModal(false)}>
          <div className="w-full max-w-sm glass-panel p-6 border border-white/10 rounded-2xl bg-[#0e0e17] space-y-4 text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-display font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-cyber-cyan" />
                <span>Share Content</span>
              </span>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
              Transmit this registry record across secure neural nets and external digital relays.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-1 text-[10px] font-display font-bold">
              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="p-3 bg-white/5 hover:bg-cyber-cyan/15 hover:text-cyber-cyan border border-white/5 hover:border-cyber-cyan/30 rounded-xl transition-all flex flex-col items-center gap-2 text-center cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 text-green-400 animate-bounce" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? 'LINK COPIED' : 'COPY DIRECT LINK'}</span>
              </button>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 hover:bg-sky-500/15 hover:text-sky-400 border border-white/5 hover:border-sky-500/30 rounded-xl transition-all flex flex-col items-center gap-2 text-center"
              >
                <Send className="w-5 h-5 text-sky-400" />
                <span>TELEGRAM RELAY</span>
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all flex flex-col items-center gap-2 text-center text-white"
              >
                <Share2 className="w-5 h-5" />
                <span>X / TWITTER FEED</span>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' - ' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all flex flex-col items-center gap-2 text-center"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>WHATSAPP INTENT</span>
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 hover:bg-blue-600/15 hover:text-blue-400 border border-white/5 hover:border-blue-600/30 rounded-xl transition-all flex flex-col items-center gap-2 text-center col-span-2"
              >
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>FACEBOOK DIALOG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
