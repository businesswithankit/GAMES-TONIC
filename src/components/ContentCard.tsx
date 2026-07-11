import React from 'react';
import { Eye, Calendar, User, Share2, Compass, Info, Bell, Tag, ArrowRight } from 'lucide-react';
import { ContentPost } from '../types';

interface ContentCardProps {
  post: ContentPost;
  onSelect: (post: ContentPost) => void;
  onAction: (action: string, post: ContentPost, event: React.MouseEvent) => void;
  actionButtonsEnabled?: boolean;
}

export default function ContentCard({ post, onSelect, onAction, actionButtonsEnabled = true }: ContentCardProps) {
  const isGame = post.type === 'games';
  const isMod = post.type === 'mods';
  const isBlog = post.type === 'blogs';
  const isEvent = post.type === 'events' || post.type === 'updates';

  // Extract tags safely
  const tags = Array.isArray(post.tags) ? post.tags : (post.tags ? String(post.tags).split(',').map(t => t.trim()) : []);

  // Set card accent colors based on content type
  const getThemeColor = () => {
    if (isGame) return { border: 'hover:border-cyber-cyan/35', text: 'group-hover:text-cyber-cyan', badge: 'bg-cyber-cyan/15 border-cyber-cyan/30 text-cyber-cyan' };
    if (isMod) return { border: 'hover:border-cyber-purple/35', text: 'group-hover:text-cyber-purple', badge: 'bg-cyber-purple/15 border-cyber-purple/30 text-cyber-purple' };
    if (isBlog) return { border: 'hover:border-cyber-magenta/35', text: 'group-hover:text-cyber-magenta', badge: 'bg-cyber-magenta/15 border-cyber-magenta/30 text-cyber-magenta' };
    return { border: 'hover:border-green-400/35', text: 'group-hover:text-green-400', badge: 'bg-green-500/15 border-green-500/30 text-green-400' };
  };

  const colors = getThemeColor();

  return (
    <div 
      id={`card-${post.id}`}
      onClick={() => onSelect(post)}
      className={`group p-4 glass-panel rounded-2xl border border-white/5 bg-[#0a0a12]/40 ${colors.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.8)] cursor-pointer flex flex-col justify-between h-full space-y-4`}
    >
      <div className="space-y-3.5">
        
        {/* Thumbnail banner section with premium absolute badges */}
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-white/5 bg-[#12121e]">
          <img 
            src={post.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Category Badge */}
          <span className="absolute top-3 left-3 text-[9px] font-display font-black uppercase tracking-widest text-white bg-black/80 px-2.5 py-1 border border-white/10 rounded-md">
            {post.category}
          </span>
          {/* Featured Badge */}
          {post.featured && (
            <span className="absolute top-3 right-3 text-[9px] font-display font-black text-cyber-magenta bg-black/85 border border-cyber-magenta/40 px-2.5 py-1 rounded-md uppercase">
              ★ FEATURED
            </span>
          )}
        </div>

        {/* Content detail listings */}
        <div className="space-y-1.5 text-left">
          {/* Card Meta details: Author Name, Publish date, viewsCount */}
          <div className="flex items-center gap-x-2.5 text-[10px] text-gray-500 font-mono w-full">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-cyber-cyan" />
              <span className="truncate max-w-[80px] uppercase font-bold text-gray-400">{post.author || 'GAMES TONIC'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyber-purple" />
              <span>{post.publishDate}</span>
            </span>
            <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const shareUrl = `${window.location.origin}/#card-${post.id}`;
                  if (navigator.share) {
                    navigator.share({
                      title: post.title,
                      text: post.shortDescription || '',
                      url: shareUrl
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Card link copied to clipboard successfully!");
                  }
                }}
                className="p-1 text-gray-500 hover:text-cyber-cyan transition-colors flex items-center justify-center cursor-pointer"
                title="Share card link"
              >
                <Share2 className="w-3 h-3" />
              </button>
            </span>
          </div>

          {/* Title and descriptions */}
          <h3 className={`font-display font-black text-sm md:text-base text-white ${colors.text} transition-colors line-clamp-1 uppercase tracking-wide`}>
            {post.title}
          </h3>
          <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">
            {post.shortDescription}
          </p>

          {/* Render tag list if present */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1.5 overflow-hidden max-h-[44px]">
              {tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase bg-white/[0.03] text-gray-400 px-1.5 py-0.5 rounded border border-white/5 hover:border-white/10"
                >
                  <Tag className="w-2.5 h-2.5 text-gray-500" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ACTION BUTTON SYSTEM BLOCK (If Enabled) */}
      {actionButtonsEnabled && post.buttonLink && post.linkEnabled !== false && (
        <div className="pt-3 border-t border-white/5 font-sans" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('link', post, e);
            }}
            className="w-full py-2 bg-gradient-to-r from-cyber-cyan/20 to-cyber-magenta/20 hover:from-cyber-cyan/35 hover:to-cyber-magenta/35 border border-white/10 hover:border-cyber-cyan/30 text-xs font-black font-display tracking-widest uppercase text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>
              {post.buttonText || (
                (() => {
                  const t = post.type?.toLowerCase().trim();
                  if (t === 'mods' || t === 'downloads') return 'Download Mod';
                  if (t === 'blogs' || t === 'guides') return 'Read Full Guide';
                  if (t === 'videos') return 'Watch Video';
                  if (t === 'products') return 'Buy Now';
                  if (t === 'tutorials') return 'Open Tutorial';
                  if (t === 'games') return 'Play Now';
                  if (t === 'contact') return 'Contact Now';
                  return 'Open Link';
                })()
              )}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
