import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Advertisement } from '../types';
import AdPlacement from './AdPlacement';

interface StickyAdBannerProps {
  ads: Advertisement[];
}

export function StickyAdBanner({ ads }: StickyAdBannerProps) {
  const [closed, setClosed] = useState(false);
  
  if (closed || !ads || ads.length === 0) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeAd = ads.find(ad => {
    const type = ad.adType?.toLowerCase().trim();
    if (type !== 'sticky' && type !== 'social_bar') return false;
    if (ad.enabled === false) return false;
    if (ad.startDate && todayStr < ad.startDate) return false;
    if (ad.endDate && todayStr > ad.endDate) return false;
    return true;
  });

  if (!activeAd) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-[#07070a]/95 backdrop-blur-md border-t border-cyber-cyan/20 py-2 px-4 shadow-[0_-8px_32px_rgba(0,0,0,0.9)] flex items-center justify-between font-sans transition-all">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-4xl relative">
          <AdPlacement position="sticky_placement" ads={[activeAd]} className="!my-0" />
        </div>
      </div>
      <button 
        onClick={() => setClosed(true)} 
        className="ml-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
        aria-label="Close Ad Overlay"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
