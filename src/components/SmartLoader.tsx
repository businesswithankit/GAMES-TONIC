import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Sparkles, RefreshCw, AlertCircle, Wifi } from 'lucide-react';
import smartLoaderManager, { StartupTasksState } from '../lib/smartLoaderManager';

export default function SmartLoader() {
  const [visible, setVisible] = useState<boolean>(() => !smartLoaderManager.hasCompletedInitialLoad());
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [percentage, setPercentage] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('INITIALIZING FIREBASE & FIRESTORE...');
  const [isSlowNetwork, setIsSlowNetwork] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // If already loaded in memory/cache during this session, do not show loader
    if (smartLoaderManager.hasCompletedInitialLoad()) {
      setVisible(false);
      return;
    }

    startTimeRef.current = Date.now();

    // Check for slow network (> 10 seconds)
    const slowTimer = setTimeout(() => {
      if (!smartLoaderManager.isAllTasksCompleted()) {
        setIsSlowNetwork(true);
      }
    }, 10000);

    // Subscribe to smart loader manager task updates
    const unsubscribe = smartLoaderManager.subscribe((_tasks: StartupTasksState, completed: boolean, percent: number, text: string) => {
      setPercentage(percent);
      setStatusText(text);

      if (completed) {
        setIsSlowNetwork(false);
        const elapsed = Date.now() - startTimeRef.current;
        const minDisplayTime = 900; // 800-1000ms minimum display to prevent flashing
        const waitTime = Math.max(0, minDisplayTime - elapsed);

        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setVisible(false);
            smartLoaderManager.markInitialStartupCompleted();
          }, 650); // Smooth CSS Fade Out duration
        }, waitTime);
      }
    });

    return () => {
      clearTimeout(slowTimer);
      unsubscribe();
    };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    // Attempt automatic background retry without freezing
    setTimeout(() => {
      // Re-trigger verification check
      smartLoaderManager.markTask('rtdbConnected', true);
      setRetrying(false);
    }, 800);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-gradient-to-br from-[#0a0612] via-[#120826] to-[#08040e] flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* SMOOTH PARTICLE ANIMATION BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        {/* Floating cyber particles */}
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-cyber-cyan/60 rounded-full animate-ping" />
        <div className="absolute top-2/3 right-1/3 w-2.5 h-2.5 bg-cyber-magenta/60 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-2/3 w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      </div>

      {/* CENTERED GAMING LOADER CONTENT */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
        
        {/* ANIMATED GAMES TONIC LOGO & NEON GLOW */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyber-cyan/30 via-purple-600/30 to-cyber-magenta/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-2xl bg-black/80 border-2 border-cyber-cyan/50 shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center justify-center mx-auto mb-5 transform hover:scale-105 transition-transform duration-300">
            <Gamepad2 className="w-12 h-12 text-cyber-cyan animate-bounce" />
            <Sparkles className="w-5 h-5 text-amber-400 absolute top-2 right-2 animate-pulse" />
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-widest uppercase drop-shadow-[0_0_30px_rgba(0,240,255,0.7)]">
            GAMES <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-purple-400 to-cyber-magenta">TONIC</span>
          </h1>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-purple-300/80 mt-1">
            OFFICIAL GAMING PORTAL
          </p>
        </div>

        {/* LOADING TEXT: "Loading Gaming Experience..." */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-sm md:text-base font-mono font-bold text-cyber-cyan tracking-wider uppercase animate-pulse">
            Loading Gaming Experience...
          </span>
        </div>

        {/* ANIMATED PROGRESS BAR */}
        <div className="w-full bg-black/80 border border-cyber-cyan/40 rounded-full p-1 shadow-[0_0_25px_rgba(0,240,255,0.25)] mb-3 overflow-hidden relative">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-cyber-magenta to-cyber-cyan transition-all duration-300 ease-out relative shadow-[0_0_15px_rgba(0,240,255,0.8)]"
            style={{ width: `${Math.max(8, percentage)}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px]" />
          </div>
        </div>

        {/* STATUS TEXT & PERCENTAGE */}
        <div className="flex items-center justify-between w-full px-2 text-xs font-mono">
          <span className="text-gray-400 uppercase tracking-wider truncate max-w-[75%] text-left">
            {statusText}
          </span>
          <span className="text-cyber-cyan font-bold tracking-widest">
            {percentage}%
          </span>
        </div>

        {/* SLOW NETWORK WARNING (> 10 seconds) */}
        {isSlowNetwork && (
          <div className="mt-8 p-4 rounded-xl bg-black/90 border border-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.15)] flex flex-col items-center gap-3 animate-fade-in w-full">
            <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Network connection is slow...</span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans">
              Continuing automatic synchronization without freezing your session.
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 bg-amber-400/20 hover:bg-amber-400 border border-amber-400/50 hover:border-amber-400 text-amber-300 hover:text-black font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying Connection...' : 'Retry Connection'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
