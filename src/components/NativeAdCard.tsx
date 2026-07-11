import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Advertisement } from '../types';
import { UniversalAdRenderer } from './AdPlacement';

interface NativeAdCardProps {
  ads: Advertisement[];
}

export function NativeAdCard({ ads }: NativeAdCardProps) {
  if (!ads || ads.length === 0) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const activeAd = ads.find(ad => {
    if (ad.adType?.toLowerCase().trim() !== 'native') return false;
    if (ad.enabled === false) return false;
    if (ad.startDate && todayStr < ad.startDate) return false;
    if (ad.endDate && todayStr > ad.endDate) return false;
    return true;
  });

  if (!activeAd) return null;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-dashed border-cyber-cyan/30 flex flex-col justify-between space-y-4 bg-cyber-cyan/[0.02] hover:border-cyber-cyan/50 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative min-h-[350px] text-left">
      <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/80 backdrop-blur-md text-[8px] font-mono font-bold text-cyber-cyan tracking-widest uppercase rounded border border-cyber-cyan/30 z-10">
        SPONSOR PROMOTED
      </span>
      
      <div className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {activeAd.imageUrl && (
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/5">
              <img 
                src={activeAd.imageUrl} 
                alt={activeAd.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          
          <h4 className="font-display font-black text-white text-sm uppercase tracking-wider line-clamp-2 leading-snug">
            {activeAd.title}
          </h4>
          
          {activeAd.adCode ? (
            <div className="w-full overflow-hidden rounded-lg bg-black/20 p-2 border border-white/5">
              <UniversalAdRenderer code={activeAd.adCode} onAdError={() => {}} />
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-sans line-clamp-3 leading-relaxed">
              Premium curated partner dispatch. Visit our vetted dynamic platform expansion networks to explore next-gen safe enhancements.
            </p>
          )}
        </div>

        {activeAd.targetUrl && (
          <a 
            href={activeAd.targetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-2.5 text-center bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 hover:from-cyber-cyan/35 hover:to-cyber-purple/35 border border-cyber-cyan/30 text-xs font-black font-display tracking-widest uppercase text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>EXPLORE PARTNER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
