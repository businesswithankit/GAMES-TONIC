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

  useEffect(() => {
    if (!containerRef.current || !code) return;
    const container = containerRef.current;
    
    // Clean slate: discard any previous artifacts
    container.innerHTML = '';

    try {
      // Use DOMParser to safely convert the code string to DOM nodes
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(`<div>${code}</div>`, 'text/html');
      const rootNode = parsedDoc.body.firstChild;

      if (!rootNode) return;

      // Recursive writer that converts parsed DOM nodes into active nodes and runs scripts
      const injectNodesWithScripts = (sourceNode: Node, targetContainer: HTMLElement) => {
        sourceNode.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const element = child as HTMLElement;
            
            if (element.tagName === 'SCRIPT') {
              // Scripts inserted via innerHTML won't run. We must construct a real script element
              const scriptEl = document.createElement('script');
              
              // Map all attributes (e.g. src, async, defer, data-ad-client 등이 정상 동작하도록)
              Array.from(element.attributes).forEach((attr) => {
                scriptEl.setAttribute(attr.name, attr.value);
              });
              
              // Set code contents for inline scripts
              if (element.textContent) {
                scriptEl.textContent = element.textContent;
              }

              // Bind error handlers
              scriptEl.onerror = () => {
                console.warn("External ad script failed to load:", scriptEl.src);
                onAdError();
              };

              targetContainer.appendChild(scriptEl);
            } else if (element.tagName === 'IFRAME') {
              const iframeEl = document.createElement('iframe');
              Array.from(element.attributes).forEach((attr) => {
                iframeEl.setAttribute(attr.name, attr.value);
              });
              targetContainer.appendChild(iframeEl);
            } else {
              // Standard elements (divs, links, images)
              const newEl = document.createElement(element.tagName.toLowerCase());
              Array.from(element.attributes).forEach((attr) => {
                newEl.setAttribute(attr.name, attr.value);
              });

              // Add tracking handler to nested anchors if possible
              if (newEl.tagName === 'A' && onAdClick) {
                newEl.addEventListener('click', onAdClick);
              }

              targetContainer.appendChild(newEl);
              // Drill further down
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
    } catch (err) {
      console.error("Error encountered executing ad code scripts:", err);
      onAdError();
    }
  }, [code, onAdError, onAdClick]);

  return <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center transition-all overflow-auto" />;
}

interface AdPlacementProps {
  position: string;
  ads: Advertisement[];
  className?: string;
}

export default function AdPlacement({ position, ads, className = '' }: AdPlacementProps) {
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [viewTracked, setViewTracked] = useState<string | null>(null);

  // Filter and select active ad for this position
  useEffect(() => {
    setLoadError(false);
    if (!ads || ads.length === 0) {
      setActiveAd(null);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const activeList = ads.filter(ad => {
      // Must be enabled
      if (ad.enabled === false) return false;
      // Active schedule constraints
      if (ad.startDate && todayStr < ad.startDate) return false;
      if (ad.endDate && todayStr > ad.endDate) return false;

      const adTypeNormalized = ad.adType?.toLowerCase().trim();
      const posNormalized = position.toLowerCase().trim();

      // Universal Banner placement
      const isBannerPos = !['popup', 'sticky', 'native', 'direct_link', 'social_bar'].includes(posNormalized);
      if (isBannerPos && (adTypeNormalized === 'banner' || adTypeNormalized === 'adsense' || adTypeNormalized === 'html' || adTypeNormalized === 'banner_ads')) {
        return true;
      }

      // Backward compatibility: match exact position
      if (ad.position && ad.position.toLowerCase().trim() === posNormalized) {
        return true;
      }

      return false;
    });

    if (activeList.length === 0) {
      setActiveAd(null);
      return;
    }

    // Pick a random active ad to support rotative advertising campaigns
    const randomAd = activeList[Math.floor(Math.random() * activeList.length)];
    setActiveAd(randomAd);
  }, [ads, position]);

  const handleAdClick = () => {
    if (activeAd && activeAd.id) {
      const clickRef = ref(db, `ads/${activeAd.id}/clicks`);
      runTransaction(clickRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(err => {
        console.warn("Could not log ad click to Firebase:", err);
      });
    }
  };

  const handleAdError = () => {
    console.warn(`Hiding broken or unrenderable universal ad: [${position}]`);
    setLoadError(true);
  };

  if (!activeAd || loadError) {
    return null;
  }

  const getResponsiveClasses = () => {
    // Elegant responsive padding classes depending on placement context
    const pos = position.toLowerCase().trim();
    if (pos.includes('sidebar')) {
      return 'w-full max-w-xs mx-auto min-h-[250px] flex flex-col justify-center';
    }
    if (pos.includes('banner') || pos.includes('top') || pos.includes('bottom') || pos.includes('middle') || pos.includes('hero')) {
      return 'w-full max-w-5xl mx-auto min-h-[90px]';
    }
    return 'w-full min-h-[60px]';
  };

  const renderAdContent = () => {
    const { adType, adCode, imageUrl, targetUrl, title } = activeAd;

    // Google AdSense, Adsterra, Monetag, custom HTML etc. are all managed through raw adCode renderer
    if (adType === 'adsense' || adType === 'html' || adCode) {
      return (
        <UniversalAdRenderer 
          code={adCode || ''} 
          onAdError={handleAdError} 
          onAdClick={handleAdClick}
        />
      );
    }

    // Direct Image Banner Support fallback
    if (adType === 'banner' || adType === 'affiliate' || adType === 'sponsor') {
      if (!imageUrl) {
        handleAdError();
        return null;
      }
      return (
        <a 
          href={targetUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          onClick={handleAdClick}
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

    return null;
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
