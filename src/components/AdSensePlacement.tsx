import React, { useEffect, useRef, useState } from 'react';
import { AdSenseUnit } from '../types';

export const ADSENSE_PREDEFINED_SLOTS = [
  { key: 'homepage_top', name: 'Homepage Top', description: 'Top section of the main landing page' },
  { key: 'homepage_middle', name: 'Homepage Middle', description: 'Middle section between content rows on Homepage' },
  { key: 'homepage_bottom', name: 'Homepage Bottom', description: 'Bottom section of Homepage above footer' },
  { key: 'article_top', name: 'Article Top', description: 'Top of post/article detail modal or page' },
  { key: 'article_middle', name: 'Article Middle', description: 'Middle of post/article detail content' },
  { key: 'article_bottom', name: 'Article Bottom', description: 'Bottom of post/article detail content' },
  { key: 'blog_top', name: 'Blog Top', description: 'Top section of Blog hub and list' },
  { key: 'blog_bottom', name: 'Blog Bottom', description: 'Bottom section of Blog hub' },
  { key: 'mod_top', name: 'Mod Top', description: 'Top section of Mod directory' },
  { key: 'mod_bottom', name: 'Mod Bottom', description: 'Bottom section of Mod directory' },
  { key: 'video_top', name: 'Video Top', description: 'Top section of Video showcase' },
  { key: 'video_bottom', name: 'Video Bottom', description: 'Bottom section of Video showcase' },
  { key: 'footer', name: 'Footer', description: 'Directly above global page footer' },
  { key: 'global_auto', name: 'Global Auto-Ads Tag', description: 'Global Header Auto-Ads script tag' },
] as const;

interface AdSensePlacementProps {
  slot: string;
  units?: AdSenseUnit[];
  className?: string;
}

export default function AdSensePlacement({ slot, units = [], className = '' }: AdSensePlacementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  // Find active AdSense unit assigned to this predefined slot
  const activeUnit = units.find(u => u.slot === slot && u.enabled !== false);

  useEffect(() => {
    setHasError(false);
    if (!containerRef.current || !activeUnit || !activeUnit.adCode?.trim()) return;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      const rawCode = activeUnit.adCode.trim();

      // 1. Ensure global Google AdSense script (adsbygoogle.js) is loaded on the page
      if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        const pubMatch = rawCode.match(/(ca-pub-\d+|pub-\d+)/i);
        const pubId = pubMatch ? (pubMatch[0].startsWith('pub-') ? `ca-${pubMatch[0]}` : pubMatch[0]) : null;
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js${pubId ? `?client=${pubId}` : ''}`;
        script.setAttribute('crossorigin', 'anonymous');
        script.onerror = () => {
          console.error(`Google AdSense script failed to load for slot [${slot}]`);
          setHasError(true);
        };
        document.head.appendChild(script);
      }

      // 2. Parse raw HTML and convert nodes to executable DOM
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(`<div>${rawCode}</div>`, 'text/html');
      const rootNode = parsedDoc.body.firstChild;

      if (!rootNode) return;

      let containsInsTag = false;

      const injectDOMWithScripts = (sourceNode: Node, target: HTMLElement) => {
        sourceNode.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            
            if (el.tagName === 'INS' && el.classList.contains('adsbygoogle')) {
              containsInsTag = true;
              const insEl = document.createElement('ins');
              Array.from(el.attributes).forEach(attr => insEl.setAttribute(attr.name, attr.value));
              if (!insEl.getAttribute('style')) {
                insEl.setAttribute('style', 'display:block;width:100%;min-height:90px;');
              }
              target.appendChild(insEl);
            } else if (el.tagName === 'SCRIPT') {
              const scriptEl = document.createElement('script');
              Array.from(el.attributes).forEach(attr => scriptEl.setAttribute(attr.name, attr.value));
              const textContent = el.textContent || '';
              
              // Skip raw inline adsbygoogle.push calls as we handle push after DOM layout
              if (!textContent.includes('adsbygoogle')) {
                if (textContent) scriptEl.textContent = textContent;
                scriptEl.onerror = () => {
                  console.error(`Script error in AdSense unit [${activeUnit.name}]`);
                  setHasError(true);
                };
                target.appendChild(scriptEl);
              }
            } else {
              const newEl = document.createElement(el.tagName.toLowerCase());
              Array.from(el.attributes).forEach(attr => newEl.setAttribute(attr.name, attr.value));
              target.appendChild(newEl);
              injectDOMWithScripts(el, newEl);
            }
          } else if (child.nodeType === Node.TEXT_NODE) {
            target.appendChild(document.createTextNode(child.textContent || ''));
          }
        });
      };

      injectDOMWithScripts(rootNode, container);

      // 3. Automatically execute (adsbygoogle = window.adsbygoogle || []).push({})
      if (containsInsTag || rawCode.includes('adsbygoogle')) {
        const timer = setTimeout(() => {
          requestAnimationFrame(() => {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (err) {
              console.error(`Google AdSense push execution failed for slot [${slot}]:`, err);
            }
          });
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error(`Failed to execute AdSense unit code for slot [${slot}]:`, err);
      setHasError(true);
    }
  }, [activeUnit?.id, activeUnit?.adCode, activeUnit?.enabled, slot]);

  // If no unit is assigned/enabled, or if execution threw an error, hide container completely
  if (!activeUnit || hasError) {
    return null;
  }

  return (
    <div className={`w-full my-4 flex justify-center items-center overflow-hidden transition-all ${className}`}>
      <div ref={containerRef} className="w-full max-w-7xl min-h-[90px] flex justify-center items-center" />
    </div>
  );
}
