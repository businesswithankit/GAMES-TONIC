import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { ref, runTransaction } from 'firebase/database';
import { db } from '../lib/firebase';
import { Advertisement } from '../types';

// Safe boundary to prevent any broken custom JS or HTML ads from white-screening the main application
interface BoundaryProps {
  children: ReactNode;
  onAdCrash: () => void;
}

interface BoundaryState {
  hasError: boolean;
}

class SafeAdBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(_: Error): BoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Universal Ad Engine lifecycle crash caught:", error, errorInfo);
    this.props.onAdCrash();
  }

  public render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

// Sub-component designed to parse raw HTML/script code and dynamically execute/load external libraries
interface UniversalAdRendererProps {
  code: string;
  onAdError: () => void;
  onAdClick?: () => void;
}

export function UniversalAdRenderer({ code, onAdError, onAdClick }: UniversalAdRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adSensePushed, setAdSensePushed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !code) return;
    const container = containerRef.current;
    
    // Clean slate: discard any previous artifacts
    container.innerHTML = '';
    setAdSensePushed(false);

    try {
      // 1. If AdSense ins tag exists, ensure Google AdSense library script is loaded on page
      if (code.includes('adsbygoogle')) {
        if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
          const pubMatch = code.match(/(ca-pub-\d+|pub-\d+)/i);
          const pubId = pubMatch ? (pubMatch[0].startsWith('pub-') ? `ca-${pubMatch[0]}` : pubMatch[0]) : null;
          const adsenseScript = document.createElement('script');
          adsenseScript.async = true;
          adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js${pubId ? `?client=${pubId}` : ''}`;
          adsenseScript.setAttribute('crossorigin', 'anonymous');
          adsenseScript.onerror = () => {
            console.warn("Global AdSense script blocked by network or AdBlocker.");
            onAdError();
          };
          document.head.appendChild(adsenseScript);
        }
      }

      // 2. Parse DOM nodes
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(`<div>${code}</div>`, 'text/html');
      const rootNode = parsedDoc.body.firstChild;

      if (!rootNode) return;

      let hasAdSenseIns = false;

      // Recursive writer that converts parsed DOM nodes into active nodes and runs scripts
      const injectNodesWithScripts = (sourceNode: Node, targetContainer: HTMLElement) => {
        sourceNode.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as HTMLElement;
            
            if (element.tagName === 'INS' && element.classList.contains('adsbygoogle')) {
              hasAdSenseIns = true;
              const insEl = document.createElement('ins');
              Array.from(element.attributes).forEach((attr) => {
                insEl.setAttribute(attr.name, attr.value);
              });
              // Ensure explicit style constraints so availableWidth calculation in AdSense won't throw 0 width error
              if (!insEl.getAttribute('style')) {
                insEl.setAttribute('style', 'display:block;width:100%;min-height:90px;');
              } else {
                let currentStyle = insEl.getAttribute('style') || '';
                if (!currentStyle.includes('display')) currentStyle += ';display:block;';
                if (!currentStyle.includes('min-height')) currentStyle += ';min-height:90px;';
                insEl.setAttribute('style', currentStyle);
              }
              targetContainer.appendChild(insEl);
            } else if (element.tagName === 'SCRIPT') {
              const scriptEl = document.createElement('script');
              Array.from(element.attributes).forEach((attr) => {
                scriptEl.setAttribute(attr.name, attr.value);
              });
              
              const scriptContent = element.textContent || '';
              // If it's the inline adsbygoogle.push({}), defer it safely instead of running before ins element layout
              if (scriptContent.includes('adsbygoogle')) {
                // Ignore raw push here, we handle it in deferred frame execution
              } else {
                if (scriptContent) scriptEl.textContent = scriptContent;
                scriptEl.onerror = () => {
                  console.warn("External ad script failed to load:", scriptEl.src);
                  onAdError();
                };
                targetContainer.appendChild(scriptEl);
              }
            } else if (element.tagName === 'IFRAME') {
              const iframeEl = document.createElement('iframe');
              Array.from(element.attributes).forEach((attr) => {
                iframeEl.setAttribute(attr.name, attr.value);
              });
              targetContainer.appendChild(iframeEl);
            } else {
              const newEl = document.createElement(element.tagName.toLowerCase());
              Array.from(element.attributes).forEach((attr) => {
                newEl.setAttribute(attr.name, attr.value);
              });

              if (newEl.tagName === 'A' && onAdClick) {
                newEl.addEventListener('click', onAdClick);
              }

              targetContainer.appendChild(newEl);
              injectNodesWithScripts(element, newEl);
            }
          } else if (child.nodeType === Node.TEXT_NODE) {
            targetContainer.appendChild(document.createTextNode(child.textContent || ''));
          } else if (child.nodeType === Node.COMMENT_NODE) {
            targetContainer.appendChild(document.createComment(child.textContent || ''));
          }
        });
      };

      injectNodesWithScripts(rootNode, container);

      // 3. Deferred execution for AdSense ins tag push
      if (hasAdSenseIns || code.includes('adsbygoogle')) {
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setAdSensePushed(true);
            } catch (err) {
              console.warn("AdSense push execution caught:", err);
            }
          });
        }, 120);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error("Error encountered executing ad code scripts:", err);
      onAdError();
    }
  }, [code, onAdError, onAdClick]);

  return <div ref={containerRef} className="w-full h-full min-h-[90px] flex flex-col items-center justify-center transition-all overflow-auto" />;
}

interface AdPlacementProps {
  position: string;
  ads: Advertisement[];
  className?: string;
}

export default function AdPlacement({ position, ads, className = '' }: AdPlacementProps) {
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [fallbackAd, setFallbackAd] = useState<Advertisement | null>(null);

  // Filter and select active ad for this position
  useEffect(() => {
    setLoadError(false);
    if (!ads || ads.length === 0) {
      setActiveAd(null);
      setFallbackAd(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const activeList = ads.filter(ad => {
      if (ad.enabled === false) return false;
      if (ad.startDate && todayStr < ad.startDate) return false;
      if (ad.endDate && todayStr > ad.endDate) return false;

      const adTypeNormalized = ad.adType?.toLowerCase().trim();
      const posNormalized = position.toLowerCase().trim();

      const isBannerPos = !['popup', 'sticky', 'native', 'direct_link', 'social_bar'].includes(posNormalized);
      if (isBannerPos && (adTypeNormalized === 'banner' || adTypeNormalized === 'adsense' || adTypeNormalized === 'html' || adTypeNormalized === 'banner_ads')) {
        return true;
      }

      if (ad.position && ad.position.toLowerCase().trim() === posNormalized) {
        return true;
      }

      return false;
    });

    // Find any direct image/link fallback sponsor campaign to defeat adblockers
    const fallbackList = ads.filter(a => a.enabled !== false && (a.imageUrl || a.targetUrl) && a.adType !== 'adsense');
    if (fallbackList.length > 0) {
      setFallbackAd(fallbackList[Math.floor(Math.random() * fallbackList.length)]);
    } else {
      setFallbackAd(null);
    }

    if (activeList.length === 0) {
      setActiveAd(null);
      return;
    }

    const randomAd = activeList[Math.floor(Math.random() * activeList.length)];
    setActiveAd(randomAd);
  }, [ads, position]);

  const handleAdClick = (adToTrack = activeAd) => {
    if (adToTrack && adToTrack.id) {
      const clickRef = ref(db, `ads/${adToTrack.id}/clicks`);
      runTransaction(clickRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(err => {
        console.warn("Could not log ad click to Firebase:", err);
      });
    }
  };

  const handleAdError = () => {
    console.warn(`Activating Ad Defeater Protection for zone [${position}] due to script or adblocker constraint.`);
    setLoadError(true);
  };

  const getResponsiveClasses = () => {
    const pos = position.toLowerCase().trim();
    if (pos.includes('sidebar')) {
      return 'w-full max-w-xs mx-auto min-h-[250px] flex flex-col justify-center';
    }
    if (pos.includes('banner') || pos.includes('top') || pos.includes('bottom') || pos.includes('middle') || pos.includes('hero')) {
      return 'w-full max-w-5xl mx-auto min-h-[90px]';
    }
    return 'w-full min-h-[60px]';
  };

  // Render Defeater / Anti-AdBlock Fallback Sponsor Banner if main ad failed or blocked
  const renderAdDefeaterFallback = () => {
    if (fallbackAd && fallbackAd.imageUrl) {
      return (
        <a 
          href={fallbackAd.targetUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={() => handleAdClick(fallbackAd)}
          className="block w-full h-full relative group overflow-hidden rounded-xl border border-cyber-cyan/30 hover:border-cyber-cyan transition-all duration-300 bg-black/60 p-1"
        >
          <img 
            src={fallbackAd.imageUrl} 
            alt={fallbackAd.title || "Sponsor Dispatch"} 
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[280px] object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/90 backdrop-blur-md text-[8px] font-mono font-black text-cyber-cyan tracking-widest uppercase rounded border border-cyber-cyan/40">
            UNBLOCKABLE SPONSOR
          </span>
        </a>
      );
    }

    // Default High-Tech Cyber Sponsor Dispatch (Guarantees no empty gap!)
    return (
      <a 
        href="#sponsors" 
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="block w-full py-4 px-6 bg-gradient-to-r from-cyber-dark via-black/80 to-cyber-dark border border-cyber-cyan/30 hover:border-cyber-cyan rounded-xl transition-all duration-300 relative group overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.08)]"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-mono font-bold text-[9px] uppercase tracking-wider rounded">
                GAMES TONIC DISPATCH
              </span>
              <span className="text-[9px] text-gray-500 font-mono uppercase">PARTNER DISPATCH NETWORK</span>
            </div>
            <h4 className="font-display font-black text-white text-xs md:text-sm uppercase tracking-wider group-hover:text-cyber-cyan transition-colors">
              VERIFIED MODS & HIGH-SPEED DOWNLOADS
            </h4>
            <p className="text-[10px] text-gray-400 font-sans">
              Access official game modifications, standalone tools & game intelligence directly.
            </p>
          </div>
          <span className="px-4 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-[10px] uppercase tracking-wider rounded-lg shrink-0 group-hover:brightness-125 transition-all">
            EXPLORE MOD INDEX
          </span>
        </div>
      </a>
    );
  };

  const renderAdContent = () => {
    if (loadError || !activeAd) {
      return renderAdDefeaterFallback();
    }

    const { adType, adCode, imageUrl, targetUrl, title } = activeAd;

    // Google AdSense, Adsterra, Monetag, custom HTML etc. are all managed through raw adCode renderer
    if (adType === 'adsense' || adType === 'html' || adCode) {
      return (
        <UniversalAdRenderer 
          code={adCode || ''} 
          onAdError={handleAdError} 
          onAdClick={() => handleAdClick(activeAd)}
        />
      );
    }

    // Direct Image Banner Support fallback
    if (adType === 'banner' || adType === 'affiliate' || adType === 'sponsor') {
      if (!imageUrl) {
        return renderAdDefeaterFallback();
      }
      return (
        <a 
          href={targetUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={() => handleAdClick(activeAd)}
          className="block w-full h-full relative group overflow-hidden rounded-xl border border-white/5 hover:border-cyber-cyan/30 transition-all duration-300"
        >
          <img 
            src={imageUrl} 
            alt={title} 
            onError={handleAdError} 
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[300px] object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {adType === 'sponsor' && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-[8px] font-mono font-bold text-cyber-cyan tracking-widest uppercase rounded border border-cyber-cyan/30">
              SPONSOR
            </span>
          )}
          {adType === 'affiliate' && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-md text-[8px] font-mono font-bold text-cyber-magenta tracking-widest uppercase rounded border border-cyber-magenta/30">
              PARTNER
            </span>
          )}
        </a>
      );
    }

    return renderAdDefeaterFallback();
  };

  return (
    <SafeAdBoundary onAdCrash={handleAdError}>
      <div 
        className={`ad-placement-zone select-none relative my-6 text-center ${getResponsiveClasses()} ${className}`} 
        id={`ad-zone-${position.replace(/[^a-zA-Z0-9-]/g, '_')}`}
      >
        <span className="block text-[8px] tracking-widest font-mono text-gray-600 uppercase mb-1">
          - SPONSORED DISPATCH -
        </span>
        <div className="w-full h-full flex justify-center items-center bg-white/[0.01] hover:bg-white/[0.02] transition-colors border border-dashed border-white/5 p-1 rounded-xl">
          {renderAdContent()}
        </div>
      </div>
    </SafeAdBoundary>
  );
}
