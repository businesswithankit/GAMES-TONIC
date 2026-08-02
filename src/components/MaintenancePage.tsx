import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert, Globe, Youtube, Instagram, MessageSquare, Send, Facebook, Twitter } from 'lucide-react';

interface MaintenancePageProps {
  title: string;
  description: string;
  statusLine?: string;
  showSocialIcons?: boolean;
  socialLinks?: {
    youtubeLong?: string;
    instagram?: string;
    discord?: string;
    telegram?: string;
    facebook?: string;
    x?: string;
  };
  onRefresh: () => Promise<void>;
  onAdminLoginClick?: () => void;
}

export default function MaintenancePage({
  title,
  description,
  statusLine,
  showSocialIcons = true,
  socialLinks = {},
  onRefresh,
  onAdminLoginClick
}: MaintenancePageProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justChecked, setJustChecked] = useState(false);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // We define standard SVG social icons
  const socialIconsConfig = [
    {
      key: 'youtube',
      url: socialLinks.youtubeLong,
      label: 'YouTube',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      key: 'instagram',
      url: socialLinks.instagram,
      label: 'Instagram',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      key: 'discord',
      url: socialLinks.discord,
      label: 'Discord',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.075.075 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      )
    },
    {
      key: 'telegram',
      url: socialLinks.telegram,
      label: 'Telegram',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11.944 0C5.344 0 0 5.344 0 11.944c0 6.6 5.344 11.944 11.944 11.944 6.6 0 11.944-5.344 11.944-11.944C23.888 5.344 18.544 0 11.944 0zm5.82 8.013l-1.91 9.006c-.144.65-.526.81-.1.472l-2.91-2.146-1.4 1.35c-.156.156-.285.285-.585.285l.21-2.95 5.38-4.858c.233-.207-.05-.32-.363-.11l-6.65 4.183-2.86-.895c-.62-.195-.63-.62.13-.915l11.17-4.31c.517-.19.97.11.7.915z" />
        </svg>
      )
    },
    {
      key: 'facebook',
      url: socialLinks.facebook,
      label: 'Facebook',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      key: 'x',
      url: socialLinks.x,
      label: 'X (Twitter)',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    }
  ];

  const activeSocials = socialIconsConfig.filter(link => link.url && link.url.trim() !== '');

  return (
    <div id="maintenance-page-container" className="fixed inset-0 w-full h-full min-h-screen flex flex-col justify-between overflow-y-auto text-gray-100 bg-[#06060c] z-[9999] p-6 sm:p-12 font-sans select-none">
      
      {/* CSS Floating Particles and Background effects */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-45px) rotate(-120deg); opacity: 0.7; }
        }
        @keyframes cyber-glow-pulse {
          0%, 100% { border-color: rgba(0, 240, 255, 0.3); box-shadow: 0 0 20px rgba(0, 240, 255, 0.1), inset 0 0 10px rgba(0, 240, 255, 0.05); }
          50% { border-color: rgba(255, 0, 127, 0.5); box-shadow: 0 0 35px rgba(255, 0, 127, 0.25), inset 0 0 15px rgba(255, 0, 127, 0.1); }
        }
        @keyframes text-shine {
          0% { text-shadow: 0 0 5px rgba(0, 240, 255, 0.4); }
          50% { text-shadow: 0 0 15px rgba(255, 0, 127, 0.8), 0 0 25px rgba(255, 0, 127, 0.4); }
          100% { text-shadow: 0 0 5px rgba(0, 240, 255, 0.4); }
        }
        .particle-1 { animation: float-slow 12s ease-in-out infinite; }
        .particle-2 { animation: float-medium 8s ease-in-out infinite; }
        .particle-3 { animation: float-slow 16s ease-in-out infinite; }
        .glow-box { animation: cyber-glow-pulse 8s infinite alternate; }
        .glowing-title { animation: text-shine 4s ease-in-out infinite; }
      `}</style>

      {/* Embedded Ambient Particles Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-cyber-cyan/40 blur-sm particle-1"></div>
        <div className="absolute top-2/3 right-1/5 w-4 h-4 rounded-full bg-cyber-purple/50 blur-sm particle-2"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-cyber-neon/40 blur-xs particle-3"></div>
        <div className="absolute top-1/2 left-2/3 w-3.5 h-3.5 rounded-full bg-cyber-cyan/30 blur-md particle-1"></div>
        {/* Neon Gradient Radial Glows */}
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyber-cyan/10 to-transparent blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-cyber-purple/10 to-transparent blur-[120px] pointer-events-none"></div>
      </div>

      {/* TOP: Header and Security Dispatch Sign-in */}
      <div className="relative w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cyber-cyan/20 border border-cyber-cyan/40 rounded-lg flex items-center justify-center text-cyber-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-display font-black tracking-widest text-sm text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">
            GAMES TONIC SYSTEM
          </span>
        </div>

        {onAdminLoginClick && (
          <button
            onClick={onAdminLoginClick}
            className="px-4 py-1.5 border border-white/10 hover:border-cyber-cyan/50 bg-black/40 hover:bg-cyber-cyan/10 text-xs text-gray-400 hover:text-cyber-cyan rounded-lg transition-all tracking-wider font-display font-bold cursor-pointer"
            aria-label="Admin Authorized Sign In"
          >
            ADMIN ACCESS
          </button>
        )}
      </div>

      {/* MIDDLE: Central Maintenance Dialog (Pure Glassmorphism + Accent Neon Box) */}
      <div className="relative flex items-center justify-center my-auto py-12 z-10">
        <div className="w-full max-w-2xl text-center glow-box border border-white/10 bg-black/60 backdrop-blur-xl p-8 sm:p-12 rounded-3xl relative overflow-hidden">
          
          {/* Cybernetic Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

          {/* Icon Badge */}
          <div className="inline-flex p-4 bg-gradient-to-b from-[#111] to-[#07070d] border border-white/5 rounded-2xl mb-6 shadow-2xl relative">
            <div className="absolute inset-0 rounded-2xl bg-cyber-cyan/5 blur-md animate-pulse"></div>
            <RefreshCw className={`w-8 h-8 text-cyber-cyan ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 mb-4 px-2 leading-tight">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto leading-relaxed mb-8 font-sans">
            {description}
          </p>

          {/* Optional Status Line */}
          {statusLine && statusLine.trim() !== '' && (
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-cyber-cyan tracking-wider font-display uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping"></span>
              <span>SYSTEM: {statusLine}</span>
            </div>
          )}

          {/* Interactive Refresh Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-8 py-3.5 bg-cyber-cyan text-black font-black border-transparent shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] rounded-xl font-display font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'VERIFYING SYSTEM...' : 'REFRESH STATUS'}</span>
            </button>
          </div>

          {/* User notice on auto-sync */}
          <p className="text-[10px] text-gray-500 mt-6 tracking-wider uppercase font-mono">
            {justChecked ? "✔️ System checked: Maintenance still online." : "Automatic diagnostic scan runs every 60 seconds."}
          </p>
        </div>
      </div>

      {/* BOTTOM: Social channels and network credentials */}
      <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-6 z-10 border-t border-white/5 pt-6">
        
        {/* Left Side Info */}
        <div className="text-xs text-gray-500 tracking-widest uppercase font-mono text-center sm:text-left">
          SECURE PROTOCOL ACTIVE • GAMES TONIC CORE
        </div>

        {/* Center/Right Side Socials */}
        {showSocialIcons && activeSocials.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 tracking-wider uppercase font-mono mr-1 hidden md:inline">
              CONNECT WITH US:
            </span>
            {activeSocials.map(soc => (
              <a
                key={soc.key}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/5 border border-white/10 hover:border-cyber-cyan text-gray-400 hover:text-cyber-cyan rounded-lg flex items-center justify-center transition-all hover:scale-105"
                title={soc.label}
                aria-label={`Official ${soc.label} Channel`}
              >
                {soc.svg}
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
