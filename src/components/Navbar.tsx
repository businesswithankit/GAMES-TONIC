import React, { useState, useEffect } from 'react';
import { Menu, X, Cpu } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ActivePage, SiteSettings } from '../types';
import { compileActiveSocialLinks, getSocialSvgIcon } from '../lib/socialUtils';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onAdminOpen: () => void;
  siteSettings: SiteSettings;
  newsletterRef: React.RefObject<HTMLDivElement | null>;
}

export default function Navbar({ activePage, onNavigate, onAdminOpen, siteSettings, newsletterRef }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Monitor Scroll for Sticky blur effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Retrieve dynamic menus and sort them by position
  const rawMenus = siteSettings.menus || [];
  const sortedMenus = [...rawMenus].sort((a, b) => (a.position || 0) - (b.position || 0));

  // Fallback default menus if none have been set in Firebase yet
  const displayMenus = sortedMenus.length > 0 ? sortedMenus : [
    { id: '1', name: 'Home', link: 'home', icon: 'Gamepad2', position: 1 },
    { id: '2', name: 'Latest Content', link: 'content', icon: 'Layers', position: 2 },
    { id: '3', name: 'Latest Mods', link: 'mods', icon: 'Code', position: 3 },
    { id: '4', name: 'Latest Blogs', link: 'blogs', icon: 'Sparkles', position: 4 },
    { id: '5', name: 'Upcoming Spec', link: 'upcoming', icon: 'Calendar', position: 5 },
    { id: '6', name: 'About Us', link: 'about', icon: 'HelpCircle', position: 6 },
    { id: '7', name: 'Contact Us', link: 'contact', icon: 'Mail', position: 7 },
  ];

  const activeSocialLinks = compileActiveSocialLinks(siteSettings);

  // Customizable buttons from SiteSettings
  const btn_joinCommunity = siteSettings.buttons?.joinCommunity || {
    text: 'JOIN COMMUNITY',
    link: '#newsletter-section',
    icon: 'Users',
    openInNewTab: false
  };

  const btn_exploreNow = siteSettings.buttons?.exploreNow || {
    text: 'EXPLORE NOW',
    link: 'content',
    icon: 'ArrowRight',
    openInNewTab: false
  };

  // Safe helper to render Lucide Icons dynamically
  const renderItemIcon = (iconName: string) => {
    const TargetIcon = (LucideIcons as any)[iconName];
    if (TargetIcon) {
      return <TargetIcon className="w-3.5 h-3.5 mr-1" />;
    }
    return null;
  };

  const handleActionClick = (link: string, openInNewTab: boolean) => {
    if (openInNewTab) {
      window.open(link, '_blank');
      return;
    }

    if (link.startsWith('#')) {
      const element = document.getElementById(link.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (newsletterRef && newsletterRef.current && link === '#newsletter-section') {
        newsletterRef.current.scrollIntoView({ behavior: 'smooth' });
      } else {
        onNavigate('home');
      }
    } else {
      onNavigate(link);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  const handleLogoClick = () => {
    onNavigate('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      id="main-glowing-navbar"
      className={`sticky top-0 z-40 transition-all duration-300 w-full ${
        scrolled 
          ? 'bg-[#07070c]/85 backdrop-blur-md border-b border-cyber-cyan/20 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
          : 'bg-transparent py-5 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        
        {/* LOGO: GAMES TONIC */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-cyber-cyan to-cyber-purple p-[1.5px] shadow-[0_0_10px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_15px_#00f0ff] transition-all">
            <div className="w-full h-full bg-[#07070c] rounded-md flex items-center justify-center overflow-hidden">
              {siteSettings.logoUrl ? (
                <img src={siteSettings.logoUrl} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <Cpu className="w-5 h-5 text-cyber-cyan group-hover:text-cyber-magenta transition-colors animate-pulse" />
              )}
            </div>
            {/* Live blinking radar dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-magenta opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-magenta"></span>
            </span>
          </div>
          <div>
            <span className="font-display font-black text-xl md:text-2xl tracking-widest text-white uppercase group-hover:text-cyber-cyan transition-colors bg-clip-text">
              {(() => {
                const name = siteSettings.siteName || 'GAMES TONIC';
                const lastSpaceIdx = name.lastIndexOf(' ');
                if (lastSpaceIdx !== -1) {
                  const firstPart = name.substring(0, lastSpaceIdx);
                  const lastPart = name.substring(lastSpaceIdx);
                  return (
                    <>
                      {firstPart}
                      <span className="text-cyber-cyan group-hover:text-white">{lastPart}</span>
                    </>
                  );
                }
                return name;
              })()}
            </span>
          </div>
        </div>

        {/* DESKTOP DYNAMIC ROUTING NAVIGATION LINKS */}
        <div className="hidden lg:flex items-center gap-1 font-display">
          {displayMenus.map((item) => {
            const isActive = activePage === item.link;
            return (
              <button
                key={item.id}
                onClick={() => handleActionClick(item.link, false)}
                className={`flex items-center px-3 md:px-4 py-2 font-display text-xs tracking-widest uppercase transition-all rounded-md cursor-pointer border-b-2 hover:border-cyber-cyan hover:text-white ${
                  isActive 
                    ? 'border-cyber-cyan text-white font-bold bg-white/5' 
                    : 'border-transparent text-gray-400'
                }`}
              >
                {item.icon && renderItemIcon(item.icon)}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT OPERATIONS SECTION BUTTONS */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Active compiled Social Icons */}
          {activeSocialLinks.length > 0 && (
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-3 mr-1">
              {activeSocialLinks.map((sl, idx) => (
                <a
                  key={idx}
                  href={sl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={sl.rawPlatform}
                  className="p-1.5 border border-white/5 hover:border-cyber-cyan bg-white/[0.01] hover:bg-cyber-cyan/10 rounded-md text-gray-400 hover:text-cyber-cyan transition-all flex items-center justify-center cursor-pointer h-7 w-7"
                >
                  {getSocialSvgIcon(sl.platform, "w-3.5 h-3.5")}
                </a>
              ))}
            </div>
          )}

          {/* Dinamically customizable button 1: Join Community */}
          <button
            onClick={() => handleActionClick(btn_joinCommunity.link, btn_joinCommunity.openInNewTab)}
            className="px-4 py-1.5 border border-white/10 hover:border-cyber-magenta rounded-lg text-xs font-display font-semibold tracking-widest cursor-pointer text-gray-300 hover:text-white hover:bg-cyber-magenta/10 transition-all flex items-center"
          >
            {btn_joinCommunity.icon && renderItemIcon(btn_joinCommunity.icon)}
            <span>{btn_joinCommunity.text}</span>
          </button>

          {/* Dinamically customizable button 2: Explore Now */}
          <button
            onClick={() => handleActionClick(btn_exploreNow.link, btn_exploreNow.openInNewTab)}
            className="px-4 py-1.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-[11px] tracking-widest rounded-lg hover:brightness-125 hover:shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all uppercase cursor-pointer flex items-center"
          >
            <span>{btn_exploreNow.text}</span>
            {btn_exploreNow.icon && <span className="ml-1.5">{renderItemIcon(btn_exploreNow.icon)}</span>}
          </button>
        </div>

        {/* MOBILE HAMBURGER TOGGLE */}
        <div className="flex items-center lg:hidden gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 border border-white/15 bg-white/5 hover:border-cyber-cyan hover:text-cyber-cyan rounded-lg text-white cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE DRAWER DRAWS */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-[100%] left-0 w-full bg-[#07070c]/95 border-b border-cyber-cyan/25 backdrop-blur-xl py-6 px-4 space-y-4 animate-fade-in shadow-[0_20px_40px_rgba(0,0,0,0.9)] z-50">
          <div className="flex flex-col gap-2">
            {displayMenus.map((item) => {
              const isActive = activePage === item.link;
              return (
                <button
                  key={item.id}
                  onClick={() => handleActionClick(item.link, false)}
                  className={`flex items-center w-full text-left px-4 py-3 font-display text-xs tracking-widest uppercase transition-all rounded-lg ${
                    isActive 
                      ? 'bg-cyber-cyan/10 text-cyber-cyan font-bold border-l-4 border-cyber-cyan' 
                      : 'hover:bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {item.icon && renderItemIcon(item.icon)}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
            <button
              onClick={() => handleActionClick(btn_exploreNow.link, btn_exploreNow.openInNewTab)}
              className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs tracking-widest rounded-lg text-center"
            >
              {btn_exploreNow.text}
            </button>
            <button
              onClick={() => handleActionClick(btn_joinCommunity.link, btn_joinCommunity.openInNewTab)}
              className="w-full py-2.5 border border-white/10 hover:border-cyber-cyan text-white text-xs font-display tracking-widest rounded-lg text-center"
            >
              {btn_joinCommunity.text}
            </button>

            {/* Compiled active mobile social indicators */}
            {activeSocialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/5">
                {activeSocialLinks.map((sl, idx) => (
                  <a
                    key={idx}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sl.rawPlatform}
                    className="p-2 border border-white/10 hover:border-cyber-cyan rounded-lg text-gray-400 hover:text-cyber-cyan flex items-center justify-center"
                  >
                    {getSocialSvgIcon(sl.platform, "w-4 h-4")}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
