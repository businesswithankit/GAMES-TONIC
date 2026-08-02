import React, { useState } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { SiteSettings } from '../types';
import { compileActiveSocialLinks, getSocialSvgIcon } from '../lib/socialUtils';

interface MaintenancePageProps {
  title: string;
  description: string;
  statusLine?: string;
  showSocialIcons?: boolean;
  siteSettings: SiteSettings;
  onRefresh: () => Promise<void>;
}

export default function MaintenancePage({
  title,
  description,
  statusLine,
  showSocialIcons = true,
  siteSettings,
  onRefresh
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

  const activeSocials = compileActiveSocialLinks(siteSettings);

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
                key={soc.platform}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-white/5 border border-white/10 hover:border-cyber-cyan text-gray-400 hover:text-cyber-cyan rounded-lg flex items-center justify-center transition-all hover:scale-105"
                title={soc.rawPlatform}
                aria-label={`Official ${soc.rawPlatform} Channel`}
              >
                {getSocialSvgIcon(soc.platform)}
              </a>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
