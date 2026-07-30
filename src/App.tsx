import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, Search, SlidersHorizontal, Gamepad2, Sparkles, Flame, Eye,
  Calendar, Layers, CheckCircle, ChevronRight, Mail, Users, Monitor,
  Download, FileText, ChevronDown, RefreshCw, AlertTriangle, Play, Radio, Video,
  ShieldCheck
} from 'lucide-react';
import { ContentPost, SiteSettings, ActivePage, VideoItem, HomeSection, FooterColumn, CustomSocialLink, Advertisement, AdSenseUnit, FeaturedGameItem } from './types';
import { db } from './lib/firebase';
import { ref, onValue, push, set, runTransaction } from 'firebase/database';
import BackgroundEffect from './components/BackgroundEffect';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import ContentDetails from './components/ContentDetails';
import { DynamicPageRenderer } from './components/LegalPages';
import AdPlacement, { UniversalAdRenderer } from './components/AdPlacement';
import AdSensePlacement from './components/AdSensePlacement';
import { compileActiveSocialLinks, getSocialSvgIcon } from './lib/socialUtils';
import ContentCard from './components/ContentCard';
import { NativeAdCard } from './components/NativeAdCard';
import { StickyAdBanner } from './components/StickyAdBanner';

const DEFAULT_FEATURED_GAMES: FeaturedGameItem[] = [];

// Default Fallback Settings if Realtime DB doesn't have settings stored yet
const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "GAMES TONIC OFFICIAL",
  siteTagline: "Next-Gen Modification Index & Cyber Intelligence",
  siteDescription: "Discover advanced gaming enhancements, utility scripts, and real-time community dispatches.",
  logoUrl: "",
  faviconUrl: "",
  
  metaTitle: "Games Tonic Official | Main Hub",
  metaDescription: "All-in-one catalog for community game mods, trailers, and scripts. Fully dynamic.",
  metaKeywords: "games, mods, scripts, cheats, enhancements, trailers, cyberpunk, gaming",
  browserTitle: "GAMES TONIC OFFICIAL | OPERATIONS HUB",
  
  announcementBar: {
    text: "🔥 ULTIMATE NEXT-GEN GAMING AND UTILITY SCRIPTS HUB CONNECTING DIRECTLY IN REALTIME",
    visible: true,
    bgColor: "#ff007f"
  },
  popupMessage: {
    title: "GAMES TONIC CORE DISPATCH ONLINE",
    text: "Welcome to the premium cyberpunk gaming indexer. Discover advanced gaming mods, utility scripts, and real-time updates curated for ultimate gaming performance on the fly!",
    visible: true,
    buttonText: "Acknowledge Uplink",
    buttonLink: "#"
  },
  hero: {
    title: "GAMES TONIC",
    subtitle: "Ultimate Gaming Content Hub",
    backgroundEffect: 'particles',
    btnText1: "Explore Catalog Now",
    btnLink1: "content",
    btnText2: "Latest Updates Logs",
    btnLink2: "upcoming"
  },
  socialLinks: {
    youtubeLong: "https://youtube.com",
    youtubeShorts: "https://youtube.com/shorts",
    instagram: "https://instagram.com",
    telegram: "https://telegram.org",
    discord: "https://discord.gg",
    facebook: "https://facebook.com",
    x: "https://x.com"
  },
  footerLinks: {
    about: "A high-fidelity digital platform supporting modular gaming scripts, official hardware logs, and custom mod files.",
    support: "Reach out for business enquiries, community collaborations, or secure transmission accesses."
  },
  buttons: {
    exploreNow: {
      id: "btn_explore",
      text: "Explore Catalog Now",
      link: "content",
      icon: "ArrowRight",
      openInNewTab: false
    },
    latestUpdates: {
      id: "btn_latest",
      text: "Latest Updates Logs",
      link: "upcoming",
      icon: "Layers",
      openInNewTab: false
    },
    joinCommunity: {
      id: "btn_join",
      text: "JOIN COMMUNITY",
      link: "#newsletter-section",
      icon: "Users",
      openInNewTab: false
    },
    contact: {
      id: "btn_contact",
      text: "SEND DISPATCH",
      link: "contact",
      icon: "Mail",
      openInNewTab: false
    }
  },
  menus: [
    { id: 'm1', name: 'Home', link: 'home', icon: 'Gamepad2', position: 1 },
    { id: 'm2', name: 'Latest Content', link: 'content', icon: 'Layers', position: 2 },
    { id: 'm3', name: 'Latest Mods', link: 'mods', icon: 'Code', position: 3 },
    { id: 'm5', name: 'Upcoming Spec', link: 'upcoming', icon: 'Calendar', position: 5 },
    { id: 'm6', name: 'About Us', link: 'about', icon: 'HelpCircle', position: 6 },
    { id: 'm7', name: 'Contact Us', link: 'contact', icon: 'Mail', position: 7 },
  ],
  legalPages: {},
  contactPage: {
    title: 'CONTACT DIRECTORY',
    description: 'Have a proposal, issues, or want to sponsor Games Tonic Official? Send a query securely.',
    phone: '+1 (415) 301-4475',
    email: 'operations@gamestonicofficial.com',
    address: 'Cyber Tower Suite 733, Digital Hub, US',
    mapEmbed: ''
  },
  categories: [],
  tags: [],
  newsletter: {
    title: "JOIN THE DISPATCH",
    description: "Receive weekly modification highlights, script patch updates, and official cyber event listings instantly.",
    badge: "UPLINK SUBSCRIPTION",
    buttonText: "SUBSCRIBE",
    buttonUrl: "",
    placeholder: "ENTER DISPATCH EMAIL...",
    successMessage: "Uplink established! You have subscribed to official dispatches.",
    visible: true
  },
  
  // Seed all homepage sections dynamically!
  homeSections: [
    { id: 'sec_hero', key: 'hero', title: 'GAMES TONIC HUB', subtitle: 'Next-Generation Modification catalogs & Cyber intelligence index', badge: 'UPLINK STREAM ACTIVE', visible: true, position: 1 },
    { id: 'sec_games', key: 'games', title: 'LATEST GAMING CONTENT', subtitle: 'Explore official registries and curated action updates.', badge: 'REGISTRY INDEX', btnText: 'BROWSE REGISTRY', btnLink: 'content', visible: true, position: 2 },
    { id: 'sec_mods', key: 'mods', title: 'LATEST MODS CATALOGUE', subtitle: 'Browse community-driven code edits and script packs.', badge: 'MODIFICATION PACKS', btnText: 'VIEW MODS', btnLink: 'mods', visible: true, position: 3 },
    { id: 'sec_videos', key: 'videos', title: 'PREMIUM VIDEO BROADCAST CENTER', subtitle: 'Watch dev conversations, game trailers and community dispatches.', badge: 'BROADCAST STREAM', visible: true, position: 4 },
    { id: 'sec_upcoming', key: 'upcoming', title: 'UPCOMING RELEASES & EVENTS', subtitle: 'Monitor planned milestones, patch updates and beta trials.', badge: 'FUTURE TIMELINES', visible: true, position: 5 },
    { id: 'sec_trending', key: 'trending', title: 'MOST VIEWED INTEL', subtitle: 'Trending streams compiled by real-time visitor traffic views.', badge: 'TRENDING MATRIX', visible: true, position: 6 },
    { id: 'sec_stats', key: 'stats', title: 'COMMUNITY FOOTPRINT', subtitle: 'Live statistic counters from our network node uplink.', badge: 'UPLINK STATISTICS', visible: true, position: 7 },
    { id: 'sec_news', key: 'newsletter', title: 'JOIN THE DISPATCH', subtitle: 'Receive weekly modification highlights, script patch updates, and official cyber event listings instantly.', badge: 'UPLINK SUBSCRIPTION', visible: true, position: 8 },
  ],

  // Seed Dynamic Footer Columns too!
  footerColumns: [
    {
      id: 'fcol1',
      title: 'QUICK LINKS',
      position: 1,
      links: [
        { label: 'HOME HUB', url: 'home' },
        { label: 'SCRIPTING MODS', url: 'mods' },
        { label: 'UPCOMING CONTENT', url: 'upcoming' }
      ]
    },
    {
      id: 'fcol2',
      title: 'LEGAL INTEL',
      position: 2,
      links: [
        { label: 'PRIVACY POLICY', url: 'privacy' },
        { label: 'TERMS & CONDITIONS', url: 'terms' },
        { label: 'LIABILITY DISCLAIMER', url: 'disclaimer' },
        { label: 'COOKIE POLICY', url: 'cookie' },
        { label: 'DMCA COPYRIGHT CLAIM', url: 'dmca' }
      ]
    },
    {
      id: 'fcol3',
      title: 'CHANNELS & DESK',
      position: 3,
      links: [
        { label: 'ABOUT US', url: 'about' },
        { label: 'CONTACT DIVISION', url: 'contact' },
        { label: 'SUPPORT HELP DESK', url: 'support' }
      ]
    }
  ],

  // Prepopulate custom pages into firebase settings to support custom pages list
  customPages: [
    {
      id: 'p_about',
      title: 'About Games Tonic',
      slug: 'about',
      seoTitle: 'About Games Tonic Hub',
      seoDescription: 'Read about our digital gaming database pipeline.',
      status: 'published',
      position: 1,
      content: `Welcome to Games Tonic.

Our platform stands as a high-fidelity indexing resource supporting modular scripting modules, official hardware logs, and custom mod files.

# THE PLATFORM PHILOSOPHY
We believe video games are a dynamic canvas. Creators deserve to build, edit, and publish unique expansions with modular safety.

This entire website is fully controlled via the Firebase Realtime Database. As administrators update variables, layouts, and posts, changes propagate instantly on modules without redeploying scripts!`
    },
    {
      id: 'p_privacy',
      title: 'Privacy Policy',
      slug: 'privacy',
      seoTitle: 'Privacy Compliance Operations',
      status: 'published',
      position: 2,
      content: `1. INTRODUCTION
Welcome to Games Tonic. We respect your privacy and are committed to protecting your personal operations data.

2. THE INFORMATION PIPELINES
We do not collect sensitive credentials. We log anonymous view metrics to compile trending lists dynamically in real-time.

3. COOKIES & TRACKERS
We run simple state parameters in cookies to remember your acknowledgment triggers.

For complete compliance questions, query our direct inbox at: operations@gamestonicofficial.com`
    },
    {
      id: 'p_terms',
      title: 'Terms & Conditions',
      slug: 'terms',
      status: 'published',
      position: 3,
      content: `1. GENERAL SAFETY
By operating our indices, you agree to comply with dynamic terms.

2. MODIFICATION INTEGRITY
Scripts listed here are community built. Use them with appropriate save-file backups. We carry no claims over hardware faults.

3. LICENSING LAW
All trademark properties remain properties of their respective developers.`
    },
    {
      id: 'p_cookie',
      title: 'Cookie Policy',
      slug: 'cookie',
      status: 'published',
      position: 4,
      content: `We use cookies to maintain your session preferences!

Cookies cache your agreement state for the global notification banner. You can clear them from your browser parameters anytime.`
    },
    {
      id: 'p_disclaimer',
      title: 'Liability Disclaimer',
      slug: 'disclaimer',
      status: 'published',
      position: 5,
      content: `Disclaimer: All resources featured are provided 'as is'. Games Tonic does not endorse modified script codes that violate official multiplayer servers. Operate index scripts at your personal choice.`
    },
    {
      id: 'p_dmca',
      title: 'DMCA Claims Policy',
      slug: 'dmca',
      status: 'published',
      position: 6,
      content: `To submit DMCA copyright expunges:

Contact operations@gamestonicofficial.com outlining the copyrighted files, registration details, and catalog link resources. Our security division reviews and clears disputed indexing files instantly.`
    }
  ],

  customSocialLinks: [
    { id: 'soc_yt', platform: 'YouTube', url: 'https://youtube.com', icon: 'fa-brands fa-youtube', status: true, position: 1 },
    { id: 'soc_tg', platform: 'Telegram', url: 'https://telegram.org', icon: 'fa-brands fa-telegram', status: true, position: 2 },
    { id: 'soc_dc', platform: 'Discord', url: 'https://discord.gg', icon: 'fa-brands fa-discord', status: true, position: 3 },
    { id: 'soc_x', platform: 'Twitter', url: 'https://x.com', icon: 'fa-brands fa-x-twitter', status: true, position: 4 }
  ],

  footer: {
    copyright: "© GAMES TONIC RESERVED INTEL. ALL MODIFICATION EXECUTABLES OWNED BY THEIR ORIGINAL AUTHOR DIRECTORIES.",
    statusText: "UPLINK STATUS: SECURE CONNECTION ACTIVE",
    statusColor: "#00f0ff"
  }
};

export default function App() {
  // Page State
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);

  // Triple click footer to open admin login panel
  const footerClickCountRef = useRef(0);
  const footerClickTimerRef = useRef<any>(null);

  const handleFooterTripleClick = (e: React.MouseEvent) => {
    // Standard DOM detail check (native triple click) or manual 3-click counter
    if (e.detail >= 3) {
      setActivePage('admin');
      setAdminOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      footerClickCountRef.current = 0;
      return;
    }

    footerClickCountRef.current += 1;
    if (footerClickCountRef.current >= 3) {
      setActivePage('admin');
      setAdminOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      footerClickCountRef.current = 0;
      if (footerClickTimerRef.current) clearTimeout(footerClickTimerRef.current);
      return;
    }

    if (footerClickTimerRef.current) clearTimeout(footerClickTimerRef.current);
    footerClickTimerRef.current = setTimeout(() => {
      footerClickCountRef.current = 0;
    }, 1200);
  };

  // Parse Pathname Routing for standalone /admin or /admin-panel entries
  useEffect(() => {
    const checkPathnameAndHash = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/admin' || pathname === '/admin-panel' || hash === '#/admin' || hash === '#/admin-panel') {
        setAdminOpen(true);
        setActivePage('admin');
      } else if (activePage === 'admin') {
        setAdminOpen(false);
        setActivePage('home');
      }
    };

    checkPathnameAndHash();
    window.addEventListener('popstate', checkPathnameAndHash);
    window.addEventListener('hashchange', checkPathnameAndHash);

    return () => {
      window.removeEventListener('popstate', checkPathnameAndHash);
      window.removeEventListener('hashchange', checkPathnameAndHash);
    };
  }, []);

  // Loaded Content States
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [featuredGames, setFeaturedGames] = useState<FeaturedGameItem[]>(DEFAULT_FEATURED_GAMES);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [adsenseUnits, setAdsenseUnits] = useState<AdSenseUnit[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [postsLoading, setPostsLoading] = useState(true);

  // Dynamically inject Google AdSense global header script & Ad Defeater engine
  useEffect(() => {
    const rawCode = siteSettings?.adsenseCode?.trim();
    if (!rawCode) return;

    // Remove existing dynamic AdSense scripts to prevent duplication
    const existingScripts = document.querySelectorAll('script[data-adsense-dynamic="true"]');
    existingScripts.forEach(el => el.remove());

    try {
      // 1. Extract AdSense Client / Publisher ID if present (e.g. ca-pub-1234567890123456)
      const pubMatch = rawCode.match(/(ca-pub-\d+|pub-\d+)/i);
      const pubId = pubMatch ? (pubMatch[0].startsWith('pub-') ? `ca-${pubMatch[0]}` : pubMatch[0]) : null;

      // 2. Inject official Google AdSense library script if a publisher ID or pagead2 script is present
      if (pubId || rawCode.includes('adsbygoogle.js')) {
        const adsenseScript = document.createElement('script');
        adsenseScript.setAttribute('data-adsense-dynamic', 'true');
        adsenseScript.async = true;
        adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js${pubId ? `?client=${pubId}` : ''}`;
        adsenseScript.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(adsenseScript);
      }

      // 3. Parse and inject any additional scripts or meta tags in the raw code
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(`<div>${rawCode}</div>`, 'text/html');
      const scripts = parsedDoc.querySelectorAll('script');

      scripts.forEach(script => {
        // Skip duplicate adsbygoogle.js script tag if already created
        if (script.src && script.src.includes('adsbygoogle.js')) return;

        const scriptEl = document.createElement('script');
        scriptEl.setAttribute('data-adsense-dynamic', 'true');
        
        Array.from(script.attributes).forEach(attr => {
          scriptEl.setAttribute(attr.name, attr.value);
        });

        if (script.textContent) {
          scriptEl.textContent = script.textContent;
        }

        document.head.appendChild(scriptEl);
      });
    } catch (err) {
      console.error("Failed to dynamically initialize Google AdSense system:", err);
    }
  }, [siteSettings?.adsenseCode]);

  // Search, Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [postSort, setPostSort] = useState<'recent' | 'popular' | 'trending'>('recent');

  // Newsletter Submitting State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Dismiss global alert popup
  const [popupDismissed, setPopupDismissed] = useState(() => {
    return localStorage.getItem('gamestonic_popup_acknowledged') === 'true';
  });

  // Popup Ad States
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [popupAdToRender, setPopupAdToRender] = useState<Advertisement | null>(null);
  const [popupAdViewTracked, setPopupAdViewTracked] = useState<string | null>(null);

  // Trigger popup ads on delay + frequency capping from siteSettings
  useEffect(() => {
    const settings = siteSettings.adSettings;
    if (settings && settings.popupAdEnabled && settings.popupAdId && ads.length > 0) {
      const selectedAd = ads.find(a => a.id === settings.popupAdId);
      if (selectedAd && selectedAd.enabled) {
        // Frequency check
        const now = Date.now();
        const lastPopupTime = localStorage.getItem('gamestonic_last_popup_ad_time');
        const frequencyMin = settings.popupAdFrequency || 0;
        const frequencyMs = frequencyMin * 60 * 1000;

        if (!lastPopupTime || (now - parseInt(lastPopupTime, 10)) > frequencyMs) {
          const delaySec = settings.popupAdDelay || 0;
          const timer = setTimeout(() => {
            setPopupAdToRender(selectedAd);
            setShowPopupAd(true);
            localStorage.setItem('gamestonic_last_popup_ad_time', String(now));
          }, delaySec * 1000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [siteSettings.adSettings, ads]);

  // Autolog impressions for popup ads when rendered
  useEffect(() => {
    if (showPopupAd && popupAdToRender && popupAdToRender.id && popupAdViewTracked !== popupAdToRender.id) {
      setPopupAdViewTracked(popupAdToRender.id);
      const viewRef = ref(db, `ads/${popupAdToRender.id}/views`);
      runTransaction(viewRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(err => {
        console.warn("Could not log popup ad impression to Firebase:", err);
      });
    }
  }, [showPopupAd, popupAdToRender?.id, popupAdViewTracked]);

  // Button Interstitial States
  const [interstitialActive, setInterstitialActive] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<Advertisement | null>(null);
  const [interstitialCountdown, setInterstitialCountdown] = useState(3);
  const [pendingRedirect, setPendingRedirect] = useState<{ url: string; openInNewTab: boolean } | null>(null);
  const [interstitialAdViewTracked, setInterstitialAdViewTracked] = useState<string | null>(null);

  // Interstitial countdown ticker
  useEffect(() => {
    if (!interstitialActive || interstitialCountdown <= 0) {
      if (interstitialActive && interstitialCountdown === 0) {
        // Countdown finished! Trigger pending redirect!
        setInterstitialActive(false);
        if (pendingRedirect) {
          if (pendingRedirect.openInNewTab) {
            window.open(pendingRedirect.url, '_blank');
          } else {
            window.location.href = pendingRedirect.url;
          }
          setPendingRedirect(null);
        }
      }
      return;
    }

    const timer = setTimeout(() => {
      setInterstitialCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [interstitialActive, interstitialCountdown, pendingRedirect]);

  // Track impressions for interstitial ads
  useEffect(() => {
    if (interstitialActive && interstitialAd && interstitialAd.id && interstitialAdViewTracked !== interstitialAd.id) {
      setInterstitialAdViewTracked(interstitialAd.id);
      const viewRef = ref(db, `ads/${interstitialAd.id}/views`);
      runTransaction(viewRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(err => {
        console.warn("Could not log interstitial ad view to Firebase:", err);
      });
    }
  }, [interstitialActive, interstitialAd?.id, interstitialAdViewTracked]);

  // Unique Visitor Tracker Ref
  const visitorCounted = useRef(false);
  const newsletterRef = useRef<HTMLDivElement>(null);

  // Safely extract array values from Firebase snapshot object/array data
  const parseArray = <T,>(val: any, fallback: T[]): T[] => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val) as T[];
    return fallback;
  };

  // Listen for realtime configurations from Firebase
  useEffect(() => {
    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (snapshot.exists() && data) {
        // Enforce fallback fields if schema updates
        setSiteSettings({
          ...DEFAULT_SITE_SETTINGS,
          ...data,
          announcementBar: { ...DEFAULT_SITE_SETTINGS.announcementBar, ...(data.announcementBar || {}) },
          popupMessage: { ...DEFAULT_SITE_SETTINGS.popupMessage, ...(data.popupMessage || {}) },
          hero: { ...DEFAULT_SITE_SETTINGS.hero, ...(data.hero || {}) },
          socialLinks: { ...DEFAULT_SITE_SETTINGS.socialLinks, ...(data.socialLinks || {}) },
          footerLinks: { ...DEFAULT_SITE_SETTINGS.footerLinks, ...(data.footerLinks || {}) },
          buttons: { ...DEFAULT_SITE_SETTINGS.buttons, ...(data.buttons || {}) },
          legalPages: { ...DEFAULT_SITE_SETTINGS.legalPages, ...(data.legalPages || {}) },
          contactPage: { ...DEFAULT_SITE_SETTINGS.contactPage, ...(data.contactPage || {}) },
          menus: parseArray(data.menus, DEFAULT_SITE_SETTINGS.menus || []),
          categories: parseArray(data.categories, DEFAULT_SITE_SETTINGS.categories),
          tags: parseArray(data.tags, DEFAULT_SITE_SETTINGS.tags),
          counters: parseArray(data.counters, []),
          customPages: parseArray(data.customPages, DEFAULT_SITE_SETTINGS.customPages || []),
          customSocialLinks: parseArray(data.customSocialLinks, DEFAULT_SITE_SETTINGS.customSocialLinks || []),
          homeSections: parseArray(data.homeSections, DEFAULT_SITE_SETTINGS.homeSections || []),
          footerColumns: parseArray(data.footerColumns, DEFAULT_SITE_SETTINGS.footerColumns || []),
          footer: { ...DEFAULT_SITE_SETTINGS.footer, ...(data.footer || {}) },
          siteTagline: data.siteTagline || '',
          siteDescription: data.siteDescription || '',
          browserTitle: data.browserTitle || '',
          gtmId: data.gtmId || '',
          gscVerificationCode: data.gscVerificationCode || '',
          fbPixelId: data.fbPixelId || '',
          customBodyScripts: data.customBodyScripts || '',
          customCss: data.customCss || '',
          customJs: data.customJs || ''
        });
      } else {
        // Seed first-time settings in DB for direct management
        set(settingsRef, DEFAULT_SITE_SETTINGS);
      }
    });

    // Listen for custom Content posts
    const postsRef = ref(db, 'posts');
    const unsubPosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as ContentPost[];
        setPosts(list);
      } else {
        setPosts([]);
      }
      setPostsLoading(false);
    }, (err) => {
      console.warn("Realtime Database loaded with restrictions, loading simulation pool:", err);
      setPostsLoading(false);
    });

    // Listen for custom Videos
    const videosRef = ref(db, 'videos');
    const unsubVideos = onValue(videosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as VideoItem[];
        setVideos(list);
      } else {
        setVideos([]);
      }
    });

    // Listen for custom Advertisements
    const adsRef = ref(db, 'ads');
    const unsubAds = onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as Advertisement[];
        setAds(list);
      } else {
        setAds([]);
      }
    });

    // Listen for custom AdSense Units
    const adsenseUnitsRef = ref(db, 'adsense_units');
    const unsubAdsense = onValue(adsenseUnitsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as AdSenseUnit[];
        setAdsenseUnits(list);
      } else {
        setAdsenseUnits([]);
      }
    });

    // Listen for custom Featured Games
    const featuredGamesRef = ref(db, 'featured_games');
    const unsubFeaturedGames = onValue(featuredGamesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })) as FeaturedGameItem[];
        setFeaturedGames(list);
      } else {
        setFeaturedGames(DEFAULT_FEATURED_GAMES);
      }
    });

    return () => {
      unsubSettings();
      unsubPosts();
      unsubVideos();
      unsubAds();
      unsubAdsense();
      unsubFeaturedGames();
    };
  }, []);

  // Dynamically apply site customizations, trackers, dynamic JS/CSS styles, and verify titles on load
  useEffect(() => {
    // 1. Title bar verification
    const activeBrowserTitle = siteSettings.browserTitle || siteSettings.metaTitle || siteSettings.siteName || "GAMES TONIC";
    document.title = activeBrowserTitle;

    // 2. Head Description Metas builder
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', siteSettings.metaDescription || siteSettings.siteDescription || 'Custom Video Game Mods Hub');

    // SEO Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', siteSettings.metaKeywords || 'games, mods, scripts, cheats');

    // 3. Search Console Verification Header
    let metaGsc = document.querySelector('meta[name="google-site-verification"]');
    if (siteSettings.gscVerificationCode) {
      if (!metaGsc) {
        metaGsc = document.createElement('meta');
        metaGsc.setAttribute('name', 'google-site-verification');
        document.head.appendChild(metaGsc);
      }
      metaGsc.setAttribute('content', siteSettings.gscVerificationCode);
    } else if (metaGsc) {
      metaGsc.remove();
    }

    // 4. Dynamic Favicon Management URL loader
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      document.head.appendChild(faviconLink);
    }
    if (siteSettings.faviconUrl) {
      faviconLink.setAttribute('href', siteSettings.faviconUrl);
    }

    // 5. Raw custom CSS styles inject builder
    let customStyleTag = document.getElementById('games-tonic-custom-css');
    if (!customStyleTag) {
      customStyleTag = document.createElement('style');
      customStyleTag.id = 'games-tonic-custom-css';
      document.head.appendChild(customStyleTag);
    }
    customStyleTag.textContent = siteSettings.customCss || '';

    // 6. Evaluators for raw custom JavaScript script tags
    const existingScript = document.getElementById('games-tonic-custom-js');
    if (existingScript) existingScript.remove();
    
    if (siteSettings.customJs) {
      const scriptTag = document.createElement('script');
      scriptTag.id = 'games-tonic-custom-js';
      scriptTag.type = 'text/javascript';
      scriptTag.textContent = `
        try {
          ${siteSettings.customJs}
        } catch (e) {
          console.warn('Custom Website configuration JS exception:', e);
        }
      `;
      document.body.appendChild(scriptTag);
    }

    // 7. Trackers & Tag Managers (GA, GTM, Pixel, custom head scripts)
    const trackingClass = 'gt-dynamic-tracking-injections';
    document.querySelectorAll('.' + trackingClass).forEach(el => el.remove());

    // Injection for custom scripts head tag
    if (siteSettings.customHeadScripts) {
      const container = document.createElement('div');
      container.className = trackingClass;
      container.style.display = 'none';
      container.innerHTML = siteSettings.customHeadScripts;
      document.head.appendChild(container);
    }

    // Injection for custom scripts body tag
    if (siteSettings.customBodyScripts) {
      const container = document.createElement('div');
      container.className = trackingClass;
      container.style.display = 'none';
      container.innerHTML = siteSettings.customBodyScripts;
      document.body.appendChild(container);
    }

    // GA GTAG script builder
    if (siteSettings.analyticsCode) {
      const scriptGa = document.createElement('script');
      scriptGa.className = trackingClass;
      scriptGa.async = true;
      scriptGa.src = `https://www.googletagmanager.com/gtag/js?id=${siteSettings.analyticsCode}`;
      document.head.appendChild(scriptGa);

      const scriptGaExec = document.createElement('script');
      scriptGaExec.className = trackingClass;
      scriptGaExec.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${siteSettings.analyticsCode}');
      `;
      document.head.appendChild(scriptGaExec);
    }

    // GTM script builder
    if (siteSettings.gtmId) {
      const scriptGtmExec = document.createElement('script');
      scriptGtmExec.className = trackingClass;
      scriptGtmExec.textContent = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${siteSettings.gtmId}');
      `;
      document.head.appendChild(scriptGtmExec);
    }

    // FB Pixel script builder
    if (siteSettings.fbPixelId) {
      const scriptFb = document.createElement('script');
      scriptFb.className = trackingClass;
      scriptFb.textContent = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${siteSettings.fbPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(scriptFb);
    }
  }, [siteSettings]);

  // Update Visitor metrics on initial tab load
  useEffect(() => {
    if (visitorCounted.current) return;
    visitorCounted.current = true;

    // Track views globally
    const viewsRef = ref(db, 'analytics/views');
    runTransaction(viewsRef, (currVal) => {
      return (currVal || 0) + 1;
    }).catch(e => console.warn("Incremental analytical hit skipped (benign):", e));

    // Track unique visitors
    const uniqueKey = localStorage.getItem('gamestonic_visitor_uuid');
    if (!uniqueKey) {
      const newUuid = 'vis_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('gamestonic_visitor_uuid', newUuid);
      
      const uniqueVisRef = ref(db, 'analytics/visitorsCount');
      runTransaction(uniqueVisRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(e => console.warn("Unique calculation dispatch skipped:", e));
    }
  }, []);

  // Submit Newsletter Subscriptions in DB node
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);

    try {
      const subsRef = ref(db, 'subscribers');
      const newSubRef = push(subsRef);
      await set(newSubRef, {
        email: newsletterEmail,
        timestamp: Date.now()
      });
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    } catch (err) {
      console.error("Newsletter subscription failure", err);
      alert("Error: subscriptions node requires writing authorizations.");
    }
    setNewsletterLoading(false);
  };

  const handleDismissPopup = () => {
    setPopupDismissed(true);
    localStorage.setItem('gamestonic_popup_acknowledged', 'true');
  };

  // Content Filter calculations
  const publicPosts = posts.filter(p => p.status === 'published');

  const filteredPosts = publicPosts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? post.category === selectedCategory : true;
    const matchesTag = selectedTag ? post.tags && post.tags.includes(selectedTag) : true;

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Sortings
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (postSort === 'popular' || postSort === 'trending') {
      return (b.viewsCount || 0) - (a.viewsCount || 0);
    }
    // Default recent
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  // Specific grids
  const modsPosts = publicPosts.filter(p => p.type === 'mods').slice(0, 4);
  const gamePosts = publicPosts.filter(p => p.type === 'games').slice(0, 4);
  const upcomingPosts = publicPosts.filter(p => p.type === 'updates' || p.type === 'events').slice(0, 4);

  // Dynamic Button parameters
  const btn_exploreNow = siteSettings.buttons?.exploreNow || {
    text: "Explore Catalog Now",
    link: "content",
    openInNewTab: false
  };

  const btn_joinCommunity = siteSettings.buttons?.joinCommunity || {
    text: "JOIN COMMUNITY",
    link: "#newsletter-section",
    openInNewTab: false
  };

  const btn_latestUpdates = siteSettings.buttons?.latestUpdates || {
    text: "Latest Updates Logs",
    link: "upcoming",
    openInNewTab: false
  };

  const handleActionClick = (link: string, openInNewTab: boolean) => {
    const settings = siteSettings.adSettings;
    const isExternal = link.startsWith('http://') || link.startsWith('https://') || openInNewTab;
    const todayStr = new Date().toISOString().split('T')[0];

    // Check for automatic Direct Link Ads universal intercept
    const directLinkAd = ads?.find(ad => {
      const type = ad.adType?.toLowerCase().trim();
      if (type !== 'direct_link') return false;
      if (ad.enabled === false) return false;
      if (ad.startDate && todayStr < ad.startDate) return false;
      if (ad.endDate && todayStr > ad.endDate) return false;
      return true;
    });

    if (directLinkAd && isExternal) {
      // Intercept! Log direct link ad click view on database
      const clickRef = ref(db, `ads/${directLinkAd.id}/clicks`);
      runTransaction(clickRef, (curr) => {
        return (curr || 0) + 1;
      }).catch(err => {
        console.warn("Could not log direct link ad click:", err);
      });

      // Open Direct Link Ad in a new tab first
      if (directLinkAd.targetUrl) {
        window.open(directLinkAd.targetUrl, '_blank');
      }

      // Proceed to original destination after brief delay
      setTimeout(() => {
        if (openInNewTab) {
          window.open(link, '_blank');
        } else {
          window.location.href = link;
        }
      }, 350);
      return;
    }

    if (settings && settings.buttonActionAdEnabled && settings.buttonActionAdId && isExternal && ads.length > 0) {
      const selectedAd = ads.find(a => a.id === settings.buttonActionAdId);
      if (selectedAd && selectedAd.enabled) {
        // Increment the ad click immediately in backend
        const clickRef = ref(db, `ads/${selectedAd.id}/clicks`);
        runTransaction(clickRef, (curr) => {
          return (curr || 0) + 1;
        }).catch(err => {
          console.warn("Could not log action ad click:", err);
        });

        // 1) Open Sponsored Ad URL in a new window/tab first!
        if (selectedAd.targetUrl) {
          window.open(selectedAd.targetUrl, '_blank');
        }

        // 2) If interstitial mode option is set to modal popup, trigger countdown
        if (settings.buttonActionAdType === 'modal') {
          setInterstitialAd(selectedAd);
          setPendingRedirect({ url: link, openInNewTab });
          setInterstitialCountdown(3);
          setInterstitialAdViewTracked(null);
          setInterstitialActive(true);
          return;
        } else {
          // Immediately perform original destination navigation
          if (openInNewTab) {
            window.open(link, '_blank');
          } else {
            window.location.href = link;
          }
          return;
        }
      }
    }

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
      }
    } else {
      setActivePage(link);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (adminOpen || activePage === 'admin') {
    return (
      <div className="relative min-h-screen text-gray-100 bg-[#07070c]">
        {/* Dynamic Visual Background effect */}
        <BackgroundEffect effectType={siteSettings.hero?.backgroundEffect || 'particles'} />
        <AdminPanel
          siteSettings={siteSettings}
          setSiteSettings={setSiteSettings}
          ads={ads}
          onClose={() => {
            setAdminOpen(false);
            setActivePage('home');
            window.history.pushState({}, '', '/');
          }}
        />
      </div>
    );
  }

  // Find standard system files or custom files rendering
  const isDedicatedRendererPage = ['about', 'contact', 'privacy', 'terms', 'disclaimer', 'cookie', 'dmca', 'support', 'credits'].includes(activePage) || 
    siteSettings.customPages?.some(p => p.slug === activePage);

  return (
    <div className="relative min-h-screen text-gray-100 bg-[#07070c] flex flex-col justify-between">
      
      <div>
        {/* Dynamic Visual Background effect */}
        <BackgroundEffect effectType={siteSettings.hero?.backgroundEffect || 'particles'} />

        {/* TOP DECORATIVE ANNOUNCEMENTS TICKER */}
        {siteSettings.announcementsList && siteSettings.announcementsList.filter(a => a.visible).length > 0 ? (
          siteSettings.announcementsList.filter(a => a.visible).sort((a,b) => (a.position || 0) - (b.position || 0)).map((ann) => (
            <div 
              key={ann.id}
              style={{ backgroundColor: ann.bgColor || '#ff007f', color: ann.color || '#000000' }}
              className="w-full text-[10px] md:text-xs font-display font-black text-center py-2.5 tracking-widest relative cursor-pointer select-none"
              onClick={() => ann.link && handleActionClick(ann.link, false)}
            >
              <div className="inline-flex items-center gap-2 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>{ann.text.toUpperCase()}</span>
              </div>
            </div>
          ))
        ) : (
          /* Legacy siteSettings.announcementBar fallback */
          siteSettings.announcementBar?.visible && (
            <div 
              style={{ backgroundColor: siteSettings.announcementBar.bgColor || '#ff007f' }}
              className="w-full text-[10px] md:text-xs font-display font-black text-center py-2.5 text-black tracking-widest relative"
            >
              <div className="inline-flex items-center gap-2 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>{siteSettings.announcementBar.text}</span>
              </div>
            </div>
          )
        )}

        {/* STICKY GLOWING NAVIGATION HEADER */}
        <Navbar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAdminOpen={() => {
            setAdminOpen(true);
            setActivePage('admin');
            window.history.pushState({}, '', '/admin');
          }}
          siteSettings={siteSettings}
          newsletterRef={newsletterRef}
        />

        {/* MAIN VISUAL ROUTING ROUTE VIEWS */}
        <main className="pb-24">
          
          {/* VIEW: HOMEPAGE (HOME) */}
          {activePage === 'home' && (
            <div className="space-y-24 animate-fade-in pt-4">
              <AdSensePlacement slot="homepage_top" units={adsenseUnits} />
              
              {/* LOOP THROUGH HOME BUILDER SECTIONS SORTED DYNAMICALLY */}
              {(() => {
                const homeSections = siteSettings.homeSections && siteSettings.homeSections.length > 0 
                  ? siteSettings.homeSections 
                  : DEFAULT_SITE_SETTINGS.homeSections || [];
                
                const sortedSections = [...homeSections].sort((a, b) => (a.position || 0) - (b.position || 0));

                return sortedSections.map((sec) => {
                  if (!sec.visible) return null;

                  switch (sec.key) {
                    case 'hero':
                      return (
                        <React.Fragment key={sec.id}>
                          <section className="relative min-h-[70vh] flex items-center justify-center px-4 md:px-8 border-b border-cyber-cyan/10">
                            <div className="max-w-4xl mx-auto text-center space-y-8 py-16">
                              
                              {/* Visual badge */}
                              <div className="inline-flex items-center gap-2 bg-cyber-cyan/10 border border-cyber-cyan/25 text-cyber-cyan px-4 py-1.5 rounded-full text-xs font-display tracking-widest font-bold uppercase animate-pulse">
                                <Sparkles className="w-4 h-4" />
                                <span>{sec.badge || 'SYSTEM UPLINK ACTIVE'}</span>
                              </div>

                              <div className="space-y-4">
                                <h1 className="text-5xl md:text-8xl font-display font-black text-white tracking-widest text-glow uppercase leading-none">
                                  {siteSettings.hero?.title || sec.title}
                                </h1>
                                <p className="text-sm md:text-xl font-sans tracking-wide text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
                                  {siteSettings.hero?.subtitle || sec.subtitle}
                                </p>
                              </div>

                               {/* Hero CTAs */}
                              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                                <button
                                  onClick={() => handleActionClick(btn_exploreNow.link, btn_exploreNow.openInNewTab)}
                                  className="px-8 py-3.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple hover:brightness-125 hover:shadow-[0_0_20px_#00f0ff] font-display font-black text-xs md:text-sm tracking-widest rounded-xl transition-all uppercase text-black cursor-pointer shadow-lg flex items-center gap-2"
                                >
                                  <span>{btn_exploreNow.text || 'VISIT WEBSITE'}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleActionClick(btn_joinCommunity.link, btn_joinCommunity.openInNewTab)}
                                  className="px-8 py-3.5 border border-white/10 hover:border-cyber-magenta/50 hover:bg-white/5 text-xs md:text-sm font-display font-bold tracking-widest rounded-xl transition-all uppercase text-gray-400 hover:text-white"
                                >
                                  <span>{btn_joinCommunity.text || 'JOIN COMMUNITY'}</span>
                                </button>
                              </div>
                            </div>
                          </section>
                          <AdPlacement position="homepage_hero_bottom" ads={ads} />
                        </React.Fragment>
                      );

                    case 'games':
                      return (
                        <React.Fragment key={sec.id}>
                          <AdPlacement position="homepage_latest_content_top" ads={ads} />
                          <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-cyber-cyan font-display font-bold text-xs tracking-wider uppercase">
                                <Gamepad2 className="w-4 h-4 text-cyber-cyan" />
                                <span>{sec.badge || 'REGISTRY INDEX'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">{sec.title}</h2>
                            </div>
                            <button 
                              onClick={() => setActivePage('content')}
                              className="group flex items-center gap-1.5 text-xs font-display font-bold text-cyber-cyan hover:underline hover:brightness-110"
                            >
                              <span>{sec.btnText || 'VIEW ALL GAMES'}</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>

                          {gamePosts.length === 0 ? (
                            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                              No content available. Create your first content from the Admin Panel.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {gamePosts.map((post, idx) => (
                                <React.Fragment key={post.id}>
                                  <ContentCard
                                    post={post}
                                    onSelect={(p) => setSelectedPost(p)}
                                    onAction={(action, p, e) => {
                                      e.stopPropagation();
                                      if (action === 'link' && p.buttonLink) {
                                        handleActionClick(p.buttonLink, true);
                                      } else if (action === 'share') {
                                        navigator.clipboard.writeText(window.location.origin + '?id=' + p.id);
                                        alert('Direct link copied to clipboard!');
                                      } else {
                                        setSelectedPost(p);
                                      }
                                    }}
                                    actionButtonsEnabled={sec.enableActionButtons !== false}
                                  />
                                  {idx === 1 && <NativeAdCard ads={ads} />}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* FEATURED GAMES & DEVELOPERS SHOWCASE AREA (MATCHING SITE CONTENT SECTIONS) */}
                        <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 pt-4">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-cyber-cyan font-display font-bold text-xs tracking-wider uppercase">
                                <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
                                <span>FEATURED SELECTION</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">
                                🔥 FEATURED GAMES & DEVELOPERS
                              </h2>
                            </div>
                            <button 
                              onClick={() => setActivePage('content')}
                              className="group flex items-center gap-1.5 text-xs font-display font-bold text-cyber-cyan hover:underline hover:brightness-110 cursor-pointer"
                            >
                              <span>VIEW ALL →</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>

                          {featuredGames.length === 0 ? (
                            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                              No content available. Create your first content from the Admin Panel.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {featuredGames.map((game) => {
                                const targetPromptLink = game.promptLink || game.gameLink;
                                const post: ContentPost = {
                                  id: game.id,
                                  title: game.gameName,
                                  slug: game.id,
                                  thumbnail: game.imageLink || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
                                  banner: game.imageLink || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
                                  description: game.developerName ? `Developer: ${game.developerName}` : 'Featured Game Specs & AI Prompt details',
                                  shortDescription: game.developerName ? `Developer: ${game.developerName}` : 'Featured Game Specs',
                                  author: game.developerName || 'GAMES TONIC',
                                  publishDate: 'FEATURED',
                                  category: 'FEATURED GAME',
                                  tags: ['FEATURED', 'GAME'],
                                  buttonText: 'GET PROMPT',
                                  buttonLink: targetPromptLink,
                                  extraLink: targetPromptLink,
                                  type: 'games',
                                  status: 'published',
                                  linkEnabled: true,
                                  featured: true
                                };
                                return (
                                  <ContentCard
                                    key={game.id}
                                    post={post}
                                    onSelect={(selectedP) => {
                                      setSelectedPost(selectedP);
                                    }}
                                    onAction={(action, p, e) => {
                                      e.stopPropagation();
                                      if (action === 'link' && targetPromptLink) {
                                        handleActionClick(targetPromptLink, true);
                                      } else if (action === 'share') {
                                        const shareUrl = targetPromptLink || window.location.href;
                                        navigator.clipboard.writeText(shareUrl);
                                        alert('Prompt link copied to clipboard!');
                                      }
                                    }}
                                    actionButtonsEnabled={true}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </section>

                        <AdPlacement position="homepage_latest_content_bottom" ads={ads} />
                        <AdSensePlacement slot="homepage_middle" units={adsenseUnits} />
                        </React.Fragment>
                      );

                    case 'mods':
                      return (
                        <section key={sec.id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-cyber-purple font-display font-bold text-xs tracking-wider uppercase">
                                <Layers className="w-4 h-4 text-cyber-purple animate-pulse" />
                                <span>{sec.badge || 'MODIFICATION PACKS'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">{sec.title}</h2>
                            </div>
                            <button 
                              onClick={() => setActivePage('mods')}
                              className="group flex items-center gap-1.5 text-xs font-display font-bold text-cyber-purple hover:underline"
                            >
                              <span>{sec.btnText || 'VIEW ALL MODS'}</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform animate-pulse" />
                            </button>
                          </div>

                          {modsPosts.length === 0 ? (
                            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                              No content available. Create your first content from the Admin Panel.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {modsPosts.map((post, idx) => (
                                <React.Fragment key={post.id}>
                                  <ContentCard
                                    post={post}
                                    onSelect={(p) => setSelectedPost(p)}
                                    onAction={(action, p, e) => {
                                      e.stopPropagation();
                                      if (action === 'link' && p.buttonLink) {
                                        handleActionClick(p.buttonLink, true);
                                      } else if (action === 'share' || action === 'share_mods') {
                                        navigator.clipboard.writeText(window.location.origin + '?id=' + p.id);
                                        alert('Outbound link copied to clipboard!');
                                      } else if (action === 'compatibility') {
                                        alert('Analyzing mod structure... Platform: PC. Requirements: v1.2+');
                                      } else if (action === 'install_guide') {
                                        alert('Manual installation instructions: Extract archives directly to Game operations folder.');
                                      } else {
                                        setSelectedPost(p);
                                      }
                                    }}
                                    actionButtonsEnabled={sec.enableActionButtons !== false}
                                  />
                                  {idx === 1 && <NativeAdCard ads={ads} />}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </section>
                      );

                    case 'videos':
                      return (
                        <React.Fragment key={sec.id}>
                          <AdSensePlacement slot="video_top" units={adsenseUnits} />
                          <AdPlacement position="video_top" ads={ads} />
                          <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                            <div className="border-b border-cyber-cyan/15 pb-4">
                              <div className="flex items-center gap-2 text-cyber-magenta font-display font-bold text-xs tracking-wider uppercase mb-1">
                                <Video className="w-4 h-4 animate-pulse text-cyber-magenta" />
                                <span>{sec.badge || 'BROADCASTS & INJECTS'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">{sec.title}</h2>
                              <p className="text-xs text-gray-400 font-sans tracking-wide mt-1">{sec.subtitle}</p>
                            </div>

                            {videos.length === 0 ? (
                              <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                                No content available. Create your first content from the Admin Panel.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {videos.sort((a,b) => (a.position || 0) - (b.position || 0)).slice(0, 4).map((video) => (
                                  <div 
                                    key={video.id} 
                                    className="p-4 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between space-y-4 bg-black/45 hover:border-cyber-purple/35 transition-all shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                                  >
                                    <div className="space-y-4">
                                      <div 
                                        className="relative w-full aspect-video rounded-xl overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:aspect-video filter drop-shadow-md bg-black/80" 
                                        dangerouslySetInnerHTML={{ __html: video.embedCode }}
                                      />
                                      <div className="space-y-1 py-1 text-left">
                                        <h3 className="font-display font-black text-white text-base tracking-wide uppercase line-clamp-1">
                                          {video.title}
                                        </h3>
                                        {video.description && (
                                          <p className="text-xs text-gray-400 line-clamp-2 font-sans leading-relaxed">
                                            {video.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {sec.enableActionButtons !== false && video.buttonLink && video.linkEnabled !== false && (
                                      <div className="pt-3 border-t border-white/5 font-sans">
                                        <button 
                                          onClick={() => {
                                            window.open(video.buttonLink, '_blank');
                                          }}
                                          className="w-full py-2 bg-gradient-to-r from-cyber-magenta/20 to-cyber-purple/20 hover:from-cyber-magenta/35 hover:to-cyber-purple/35 border border-white/10 hover:border-cyber-magenta/30 text-xs font-black font-display tracking-widest uppercase text-white rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <span>{video.buttonText || 'Watch Video'}</span>
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                          <AdSensePlacement slot="video_bottom" units={adsenseUnits} />
                          <AdPlacement position="video_bottom" ads={ads} />
                        </React.Fragment>
                      );

                    case 'upcoming':
                      return (
                        <section key={sec.id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-cyber-cyan font-display font-bold text-xs tracking-wider uppercase">
                                <Calendar className="w-4 h-4 text-cyber-cyan animate-pulse" />
                                <span>{sec.badge || 'FUTURE TIMELINES'}</span>
                              </div>
                              <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">{sec.title}</h2>
                            </div>
                            <button 
                              onClick={() => setActivePage('upcoming')}
                              className="group flex items-center gap-1.5 text-xs font-display font-bold text-cyber-cyan hover:underline"
                            >
                              <span>{sec.btnText || 'VIEW ALL EVENTS'}</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </div>

                          {upcomingPosts.length === 0 ? (
                            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                              No content available. Create your first content from the Admin Panel.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                              {upcomingPosts.map((post, idx) => (
                                <React.Fragment key={post.id}>
                                  <ContentCard
                                    post={post}
                                    onSelect={(p) => setSelectedPost(p)}
                                    onAction={(action, p, e) => {
                                      e.stopPropagation();
                                      if (action === 'link' && p.buttonLink) {
                                        handleActionClick(p.buttonLink, true);
                                      } else if (action === 'share') {
                                        navigator.clipboard.writeText(window.location.origin + '?id=' + p.id);
                                        alert('Event link copied to clipboard!');
                                      } else if (action === 'reminder') {
                                        alert('Subscribed successfully. Direct notification reminders set for event: ' + p.title);
                                      } else {
                                        setSelectedPost(p);
                                      }
                                    }}
                                    actionButtonsEnabled={sec.enableActionButtons !== false}
                                  />
                                  {idx === 1 && <NativeAdCard ads={ads} />}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </section>
                      );

                    case 'trending':
                      return (
                        <section key={sec.id} className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                          <div className="border-b border-cyber-magenta/15 pb-4">
                            <div className="flex items-center gap-2 text-cyber-magenta font-display font-bold text-xs tracking-wider uppercase mb-1">
                              <Flame className="w-4 h-4 animate-bounce text-cyber-magenta" />
                              <span>{sec.badge || 'TRENDING MATRIX'}</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase text-glow">{sec.title}</h2>
                          </div>

                          {publicPosts.length === 0 ? (
                            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl text-center text-gray-500 font-sans text-sm">
                              No content available. Create your first content from the Admin Panel.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[...publicPosts].sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).slice(0, 2).map((post, i) => (
                                <div 
                                  key={post.id}
                                  onClick={() => setSelectedPost(post)}
                                  className="group flex flex-col sm:flex-row gap-4 p-4 glass-panel hover:border-cyber-magenta/30 rounded-xl transition-all cursor-pointer items-stretch bg-black/25 font-sans"
                                >
                                  <div className="relative w-full sm:w-[40%] h-40 sm:h-auto rounded-lg overflow-hidden bg-[#12121e] shrink-0">
                                    <img 
                                      src={post.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
                                      alt={post.title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold text-cyber-magenta bg-black/80 border border-cyber-magenta/20 px-2.5 py-1 rounded">
                                      TRENDING #{i+1}
                                    </span>
                                  </div>
                                  <div className="flex flex-col justify-between py-1 flex-1">
                                    <div className="space-y-1.5 font-display text-left">
                                      <span className="text-[10px] font-mono text-gray-400 tracking-wider font-bold">[{post.category.toUpperCase()}]</span>
                                      <h3 className="font-display font-bold text-sm md:text-base text-white group-hover:text-cyber-magenta transition-colors line-clamp-1 uppercase">
                                        {post.title}
                                      </h3>
                                      <p className="text-xs text-gray-400 font-sans line-clamp-2 leading-relaxed">
                                        {post.shortDescription}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 pt-2 border-t border-white/5 mt-2 justify-end">
                                      <span>{post.publishDate}</span>
                                    </div>

                                    {sec.enableActionButtons !== false && (
                                      <div className="pt-2.5 border-t border-white/5 grid grid-cols-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => setSelectedPost(post)}
                                          className="py-1 bg-cyber-magenta/10 hover:bg-cyber-magenta/20 border border-cyber-magenta/25 rounded text-[9px] font-bold font-mono tracking-wider uppercase text-cyber-magenta transition-all flex items-center justify-center cursor-pointer"
                                        >
                                          OPEN
                                        </button>
                                        <button 
                                          onClick={() => {
                                            navigator.clipboard.writeText(window.location.origin + '?id=' + post.id);
                                            alert('Trending link copied to clipboard!');
                                          }}
                                          className="py-1 bg-black/40 hover:bg-cyber-magenta/10 border border-white/5 hover:border-cyber-magenta/30 rounded text-[9px] font-bold font-mono tracking-wider uppercase text-gray-400 hover:text-cyber-magenta transition-all flex items-center justify-center cursor-pointer"
                                        >
                                          SHARE
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>
                      );

                    case 'stats':
                      return (
                        <section key={sec.id} className="bg-black/40 border-y border-white/5 py-16 px-4">
                          <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                            {siteSettings.counters && siteSettings.counters.length > 0 ? (
                              siteSettings.counters.filter(cnt => cnt.visible !== false).sort((a,b) => (a.position || 0) - (b.position || 0)).map((cnt, index) => {
                                const colors = ['text-cyber-cyan text-glow', 'text-cyber-magenta text-glow-magenta animate-pulse', 'text-cyber-purple text-glow', 'text-green-400'];
                                const activeColor = colors[index % colors.length];
                                return (
                                  <div key={cnt.id || index} className="text-center space-y-1">
                                    <p className={`text-2xl md:text-5xl font-display font-black leading-none ${activeColor}`}>
                                      {cnt.value}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">{cnt.title}</p>
                                  </div>
                                );
                              })
                            ) : (
                              <>
                                <div className="text-center space-y-1">
                                  <p className="text-2xl md:text-5xl font-display font-black text-cyber-cyan text-glow">12K+</p>
                                  <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">ACTIVE MEMBERS</p>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-2xl md:text-5xl font-display font-black text-cyber-magenta text-glow-magenta animate-pulse">732+</p>
                                  <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">MODIFICATIONS HOSTED</p>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-2xl md:text-5xl font-display font-black text-cyber-purple text-glow">9.4M</p>
                                  <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">MONTHLY TRIPS</p>
                                </div>
                                <div className="text-center space-y-1">
                                  <p className="text-2xl md:text-5xl font-display font-black text-green-400">24/7</p>
                                  <p className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">UPLINK STATUS</p>
                                </div>
                              </>
                            )}
                          </div>
                        </section>
                      );

                    case 'newsletter':
                      if (siteSettings.newsletter?.visible === false) return null;
                      return (
                        <section key={sec.id} ref={newsletterRef} className="max-w-5xl mx-auto px-4 md:px-8">
                          <div className="p-8 md:p-12 glass-panel-neon rounded-2xl border border-cyber-cyan/30 relative overflow-hidden text-left bg-black/60">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                              <Mail className="w-48 h-48 text-cyber-cyan" />
                            </div>
                            
                            <div className="max-w-2xl text-left space-y-6 relative z-10">
                              <div className="space-y-1">
                                <p className="text-xs font-mono font-bold text-cyber-cyan tracking-widest uppercase">{siteSettings.newsletter?.badge || sec.badge || 'UPLINK SUBSCRIPTION'}</p>
                                <h2 className="text-2xl md:text-4xl font-display font-black text-white tracking-widest uppercase leading-none">
                                  {siteSettings.newsletter?.title || sec.title}
                                </h2>
                                <p className="text-sm text-gray-400 font-sans mt-2">
                                  {siteSettings.newsletter?.description || sec.subtitle}
                                </p>
                              </div>

                              {newsletterSuccess ? (
                                <div className="p-4 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-xs font-sans flex items-center gap-2 max-w-md">
                                  <CheckCircle className="w-5 h-5 shrink-0" />
                                  <span>{siteSettings.newsletter?.successMessage || "Uplink established! You have subscribed to official dispatches."}</span>
                                </div>
                              ) : (
                                <div>
                                  {siteSettings.newsletter?.buttonUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => handleActionClick(siteSettings.newsletter!.buttonUrl!, false)}
                                      className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs tracking-wider rounded-xl hover:brightness-125 hover:shadow-[0_0_12px_#00f0ff] uppercase transition cursor-pointer"
                                    >
                                      {siteSettings.newsletter?.buttonText || 'SUBSCRIBE'}
                                    </button>
                                  ) : (
                                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                                      <input
                                        type="email"
                                        required
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        placeholder={siteSettings.newsletter?.placeholder || "ENTER DISPATCH EMAIL..."}
                                        className="flex-1 px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan text-glow focus:shadow-[0_0_8px_rgba(0,240,255,0.2)] uppercase"
                                      />
                                      <button
                                        type="submit"
                                        disabled={newsletterLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs tracking-wider rounded-xl hover:brightness-125 hover:shadow-[0_0_12px_#00f0ff] uppercase transition cursor-pointer"
                                      >
                                        {newsletterLoading ? 'LINKING...' : (siteSettings.newsletter?.buttonText || 'SUBSCRIBE')}
                                      </button>
                                    </form>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </section>
                      );
                    
                    default:
                      return null;
                  }
                });
              })()}

              <AdSensePlacement slot="homepage_bottom" units={adsenseUnits} />
              <AdPlacement position="homepage_bottom" ads={ads} />

            </div>
          )}

          {/* VIEW: ARCHIVES DIRECTORIES (POSTS CATALOG FILTER SHEET) */}
          {(activePage === 'content' || activePage === 'mods' || activePage === 'upcoming') && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 animate-fade-in pt-6">
              
              {activePage === 'mods' && <><AdSensePlacement slot="mod_top" units={adsenseUnits} /><AdPlacement position="mods_top" ads={ads} /></>}
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-6">
                <div>
                  <h1 className="text-3xl md:text-5xl font-display font-black tracking-widest text-white uppercase text-glow">
                    {activePage === 'content' && 'REGISTRY CATALOGS'}
                    {activePage === 'mods' && 'MODS REVISIONS'}
                    {activePage === 'upcoming' && 'FUTURE LIFECYCLE'}
                  </h1>
                  <p className="text-xs text-gray-400 font-mono uppercase mt-1 tracking-wider">
                    {postsLoading ? 'Accessing live catalogs...' : `Total verified indexes: ${filteredPosts.length} nodes`}
                  </p>
                </div>

                {/* Live Realtime Refresh */}
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedTag(''); }}
                  className="px-4 py-2 border border-white/10 bg-white/5 hover:border-cyber-cyan hover:text-cyber-cyan rounded-lg text-xs font-mono font-bold tracking-widest transition flex items-center gap-2 cursor-pointer uppercase"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RESET METRICS</span>
                </button>
              </div>

              {/* SEARCH ENGINE CONTROLLER */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/40 border border-[#141424] p-4 rounded-2xl relative">
                
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="QUERY REVISION STRINGS OR KEYWORDS..."
                    className="w-full pl-10 pr-4 py-3 bg-[#0d0d14] border border-white/5 focus:border-cyber-cyan rounded-xl text-xs text-white font-mono placeholder-gray-500 uppercase focus:outline-none"
                  />
                </div>

                {/* Categories filtering */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0d0d14] border border-white/5 focus:border-cyber-cyan rounded-xl text-xs text-cyber-cyan font-display font-bold uppercase focus:outline-none"
                  >
                    <option value="">[ALL SUBDIVISIONS]</option>
                    {siteSettings.categories?.map((cat) => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Sort logic */}
                <div>
                  <select
                    value={postSort}
                    onChange={(e) => setPostSort(e.target.value as any)}
                    className="w-full px-4 py-3 bg-[#0d0d14] border border-white/5 focus:border-cyber-magenta rounded-xl text-xs text-cyber-magenta font-display font-bold uppercase focus:outline-none"
                  >
                    <option value="recent">RECENT UPLINC (NEW)</option>
                    <option value="popular">POPULAR INDEX (VIEWS)</option>
                    <option value="trending">TRAFFIC MATRIX (HIGH)</option>
                  </select>
                </div>

                {/* Tags filter map */}
                <div className="md:col-span-4 flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">FILTER CLOUD:</span>
                  <button 
                    onClick={() => setSelectedTag('')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase transition-colors ${!selectedTag ? 'bg-cyber-cyan text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                  >
                    ALL INDEX
                  </button>
                  {siteSettings.tags?.map((tg) => (
                    <button 
                      key={tg}
                      onClick={() => setSelectedTag(selectedTag === tg ? '' : tg)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase transition-colors ${selectedTag === tg ? 'bg-cyber-purple text-white border border-cyber-purple' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                      #{tg}
                    </button>
                  ))}
                </div>
              </div>

              {/* POST RESULTS GRAPH DIRECTORIES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Special Dynamic Addition for site search results: Website Manager & Credits */}
                {searchQuery && (
                  "credits".includes(searchQuery.toLowerCase()) || 
                  "manager".includes(searchQuery.toLowerCase()) || 
                  "website".includes(searchQuery.toLowerCase()) || 
                  "developer".includes(searchQuery.toLowerCase()) || 
                  "author".includes(searchQuery.toLowerCase()) || 
                  "creator".includes(searchQuery.toLowerCase())
                ) && (
                  <div 
                    onClick={() => { setActivePage('credits'); window.scrollTo(0, 0); }}
                    className="group p-5 glass-panel border border-cyber-cyan/30 rounded-2xl transition-all cursor-pointer space-y-4 flex flex-col justify-between h-[360px] bg-cyber-cyan/5 hover:bg-cyber-cyan/10 hover:shadow-[0_4px_24px_rgba(0,240,255,0.2)] font-sans"
                  >
                    <div className="space-y-4">
                      {/* Thumbnail decoration representing network structure */}
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-cyber-cyan/20 bg-black flex items-center justify-center">
                        <Monitor className="w-12 h-12 text-cyber-cyan animate-pulse" />
                        <span className="absolute top-3 left-3 text-[9px] uppercase font-display font-medium tracking-widest text-cyber-cyan bg-black/80 px-2 py-0.5 border border-cyber-cyan/30 rounded">
                          LEGAL INDEX
                        </span>
                      </div>

                      {/* Title & description */}
                      <div className="space-y-1 text-left font-display">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-cyber-cyan font-mono">[BUILT-IN SYSTEM]</span>
                        <h3 className="font-display font-black text-sm text-white group-hover:text-cyber-cyan transition-colors uppercase">
                          Website Manager & Credits Page
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-sans normal-case">
                          Enter our global administrative directory, listing development engineers, system supervisors, designers, and site operators.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <span className="font-bold text-cyber-cyan flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyber-cyan" />
                        <span>OPERATIONAL DIRECTORY</span>
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform text-cyber-cyan font-black">&rarr;</span>
                    </div>
                  </div>
                )}

                {sortedPosts.filter((post) => {
                  if (activePage === 'mods') return post.type === 'mods';
                  if (activePage === 'upcoming') return post.type === 'updates' || post.type === 'events';
                  return true;
                }).map((post, idx) => (
                  <React.Fragment key={post.id}>
                    <ContentCard
                      post={post}
                      onSelect={(p) => setSelectedPost(p)}
                      onAction={(action, p, e) => {
                        e.stopPropagation();
                        if (action === 'link' && p.buttonLink) {
                          handleActionClick(p.buttonLink, true);
                        } else if (action === 'share') {
                          navigator.clipboard.writeText(window.location.origin + '?id=' + p.id);
                          alert('Link copied to clipboard!');
                        } else if (action === 'reminder') {
                          alert('Subscribed successfully. Direct notification reminders set for: ' + p.title);
                        } else if (action === 'save') {
                          alert('Article logs saved safely. Retrieve offline under cache layers.');
                        } else {
                          setSelectedPost(p);
                        }
                      }}
                      actionButtonsEnabled={true}
                    />
                    {idx === 2 && <NativeAdCard ads={ads} />}
                  </React.Fragment>
                ))}
              </div>

              {/* EMPTY STATE */}
              {sortedPosts.filter((p) => {
                if (activePage === 'mods') return p.type === 'mods';
                if (activePage === 'upcoming') return p.type === 'updates' || p.type === 'events';
                return true;
              }).length === 0 && (
                <div className="text-center py-16 border border-white/5 bg-white/[0.01] rounded-2xl max-w-lg mx-auto space-y-2 p-8 font-sans">
                  <p className="text-sm text-gray-400">No content available.</p>
                  <p className="text-xs text-gray-500">Create your first content from the Admin Panel.</p>
                </div>
              )}

              {activePage === 'mods' && <AdPlacement position="mods_bottom" ads={ads} />}

            </div>
          )}

          {/* VIEW: LEGAL PAGES & DISPATCH INTERFACES (ABOUT + CONTACT PRIVACY ETC) */}
          {isDedicatedRendererPage && (
            <div className="pt-8">
              <DynamicPageRenderer 
                slug={activePage} 
                siteSettings={siteSettings} 
                onBack={() => { setActivePage('home'); window.scrollTo(0,0); }} 
                onNavigate={(slug) => { setActivePage(slug as any); window.scrollTo(0,0); }} 
              />
            </div>
          )}

        </main>

        <AdPlacement position="homepage_footer_top" ads={ads} />
        <AdPlacement position="footer_banner" ads={ads} />
        <AdSensePlacement slot="footer" units={adsenseUnits} />
      </div>

      {/* FOOTER WIDGET */}
      <footer onClick={handleFooterTripleClick} className="bg-black/95 border-t border-white/10 pt-16 pb-8 transition-all relative shrink-0 cursor-pointer">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1 */}
          <div className="space-y-4 text-left">
            <h4 className="font-display font-black text-lg text-white tracking-widest uppercase">{siteSettings.siteName || 'GAMES TONIC'}</h4>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              {siteSettings.footerLinks?.about || siteSettings.siteDescription}
            </p>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 max-w-max">
              <span 
                style={{ backgroundColor: siteSettings.footer?.statusColor || '#00f0ff' }}
                className="flex h-2.5 w-2.5 rounded-full animate-pulse"
              ></span>
              <span className="text-[10px] font-mono text-gray-400 font-bold uppercase">
                {siteSettings.footer?.statusText || 'UPLINK STATUS: LIVE AND SECURE'}
              </span>
            </div>
          </div>

          {/* Col 2, 3, 4 dynamically rendered via footerColumns */}
          {(() => {
            const footerCols = siteSettings.footerColumns && siteSettings.footerColumns.length > 0
              ? siteSettings.footerColumns
              : DEFAULT_SITE_SETTINGS.footerColumns || [];

            return [...footerCols].sort((a,b) => (a.position || 0) - (b.position || 0)).map((col) => (
              <div key={col.id} className="space-y-4 text-left">
                <h5 className="font-display font-bold text-xs tracking-widest text-cyber-cyan uppercase">{col.title}</h5>
                <div className="flex flex-col gap-2 font-display text-xs text-gray-400">
                  {col.links && col.links.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); handleActionClick(link.url, !!link.openInNewTab); }}
                      className="hover:text-cyber-cyan transition-colors cursor-pointer text-left uppercase border-b border-white/0 hover:border-cyber-cyan/30 pb-0.5 max-w-max"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            ));
          })()}

          {/* Col 5: Custom Dynamic Social icons */}
          <div className="space-y-4 text-left">
            <h5 className="font-display font-bold text-xs tracking-widest text-cyber-purple uppercase">NETWORK CHANNELS</h5>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 font-sans leading-relaxed text-left">
                Connect directly into our cryptographic network nodes for direct highlights:
              </p>
              
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const compiled = compileActiveSocialLinks(siteSettings);
                  if (compiled.length > 0) {
                    return compiled.map((sl, index) => (
                      <a
                        key={index}
                        href={sl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={sl.rawPlatform}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 border border-white/10 hover:border-cyber-cyan bg-white/[0.02] hover:bg-cyber-cyan/10 rounded-lg text-gray-400 hover:text-cyber-cyan transition-all text-xs flex items-center justify-center min-w-9 min-h-9 cursor-pointer"
                      >
                        {getSocialSvgIcon(sl.platform, "w-4 h-4")}
                      </a>
                    ));
                  }
                  return (
                    <>
                      <a href="https://youtube.com" onClick={(e) => e.stopPropagation()} className="p-2.5 border border-white/10 hover:border-cyber-cyan bg-white/[0.02] hover:bg-cyber-cyan/10 rounded-lg text-gray-400 hover:text-cyber-cyan min-w-9 min-h-9 flex items-center justify-center text-xs" target="_blank" rel="noopener noreferrer">{getSocialSvgIcon("youtube", "w-4 h-4")}</a>
                      <a href="https://discord.gg" onClick={(e) => e.stopPropagation()} className="p-2.5 border border-white/10 hover:border-cyber-cyan bg-white/[0.02] hover:bg-cyber-cyan/10 rounded-lg text-gray-400 hover:text-cyber-cyan min-w-9 min-h-9 flex items-center justify-center text-xs" target="_blank" rel="noopener noreferrer">{getSocialSvgIcon("discord", "w-4 h-4")}</a>
                      <a href="https://telegram.org" onClick={(e) => e.stopPropagation()} className="p-2.5 border border-white/10 hover:border-cyber-cyan bg-white/[0.02] hover:bg-cyber-cyan/10 rounded-lg text-gray-400 hover:text-cyber-cyan min-w-9 min-h-9 flex items-center justify-center text-xs" target="_blank" rel="noopener noreferrer">{getSocialSvgIcon("telegram", "w-4 h-4")}</a>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

        </div>

        {/* Legal copyright footer */}
        <div className="border-t border-white/5 pt-8 max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs text-gray-500">
          <p className="uppercase">{siteSettings.footer?.copyright || '© GAMES TONIC OFFICIAL OPERATIVE. ALL MODIFICATIONS REGISTERED STANDARDS.'}</p>
          <div className="flex flex-wrap items-center gap-4 font-bold">
            <button onClick={(e) => { e.stopPropagation(); setActivePage('privacy'); window.scrollTo(0,0); }} className="hover:text-white transition cursor-pointer">PRIVACY</button>
            <span>•</span>
            <button onClick={(e) => { e.stopPropagation(); setActivePage('terms'); window.scrollTo(0,0); }} className="hover:text-white transition cursor-pointer">TERMS</button>
          </div>
        </div>
      </footer>

      {/* POPUP ALERT MODAL DIALOGUE */}
      {siteSettings.popupMessage?.visible && !popupDismissed && (
        <div id="alert-popup-dialog" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-panel-neon p-6 rounded-2xl border border-cyber-cyan/30 text-center space-y-4 shadow-[0_0_24px_rgba(0,240,255,0.15)] animate-fade-in bg-black">
            <div className="inline-flex p-3 bg-cyber-cyan/15 rounded-full border border-cyber-cyan/35 text-cyber-cyan animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-white text-base tracking-wider uppercase leading-none">
              {siteSettings.popupMessage.title}
            </h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              {siteSettings.popupMessage.text}
            </p>
            <button
              onClick={handleDismissPopup}
              id="acknowledge-popup-btn"
              className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple font-display font-black text-xs tracking-widest rounded-xl hover:brightness-125 transition-all text-black cursor-pointer shadow-lg uppercase"
            >
              {siteSettings.popupMessage.buttonText || 'Acknowledge Connection'}
            </button>
          </div>
        </div>
      )}

      {/* EXPANDED CONTENT DETAIL VIEW MODEL OVERLAY */}
      {selectedPost && (
        <ContentDetails
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onTagClick={(tag) => {
            setSelectedTag(tag);
            setActivePage('content');
          }}
          onCategoryClick={(cat) => {
            setSelectedCategory(cat);
            setActivePage('content');
          }}
          onActionClick={handleActionClick}
          ads={ads}
          adsenseUnits={adsenseUnits}
        />
      )}

      {/* 1) POPUP ADVERTISING CAMPAIGN MODAL */}
      {showPopupAd && popupAdToRender && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden border border-cyber-cyan/30 bg-[#0c0c14] rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] select-none">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></span>
                <span className="font-mono text-[10px] tracking-widest text-cyber-cyan font-bold uppercase">SPONSORED UPLINK</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPopupAd(false)}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer text-sm font-bold"
              >
                &times;
              </button>
            </div>

            {/* Campaign info */}
            <div className="p-6 space-y-4">
              <h4 className="font-display font-black text-lg text-white uppercase tracking-wider">
                {popupAdToRender.title}
              </h4>
              
              <div className="overflow-hidden rounded-xl border border-white/5 bg-black/40 p-2 min-h-[150px] flex items-center justify-center">
                {popupAdToRender.adType === 'adsense' || popupAdToRender.adType === 'html' ? (
                  <div 
                    className="w-full text-center"
                    dangerouslySetInnerHTML={{ __html: popupAdToRender.adCode || '' }}
                  />
                ) : (
                  <a 
                    href={popupAdToRender.targetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const clickRef = ref(db, `ads/${popupAdToRender.id}/clicks`);
                      runTransaction(clickRef, (curr) => (curr || 0) + 1);
                      setShowPopupAd(false);
                    }}
                    className="block w-full group overflow-hidden rounded-lg"
                  >
                    <img 
                      src={popupAdToRender.imageUrl} 
                      alt={popupAdToRender.title}
                      className="w-full h-auto max-h-[300px] object-contain mx-auto rounded transition-transform group-hover:scale-102 duration-300"
                    />
                  </a>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/5 bg-white/[0.01]">
              <button
                type="button"
                onClick={() => setShowPopupAd(false)}
                className="px-4 py-2 text-xs font-mono tracking-wider font-bold uppercase text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                Close Ad
              </button>
              {popupAdToRender.targetUrl && (
                <a
                  href={popupAdToRender.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const clickRef = ref(db, `ads/${popupAdToRender.id}/clicks`);
                    runTransaction(clickRef, (curr) => (curr || 0) + 1);
                    setShowPopupAd(false);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-purple font-display font-medium text-xs tracking-wider uppercase text-[#07070c] rounded-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Visit Sponsor
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2) CONVERSIONS ACTION COUNTDOWN INTERSTITIAL AD */}
      {interstitialActive && interstitialAd && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl overflow-hidden border border-cyber-magenta/30 bg-[#0c0c14] rounded-2xl shadow-[0_0_50px_rgba(255,0,127,0.15)] select-none p-6 text-center space-y-6">
            
            {/* Header status */}
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-cyber-magenta/10 border border-cyber-magenta/20 text-cyber-magenta text-[9px] font-mono tracking-widest uppercase rounded">
                REDIRECT INTERSTITIAL SECURE SCAN
              </span>
              <h4 className="font-display font-black text-2xl text-white tracking-wider uppercase pt-2">
                REDIRECTING IN {interstitialCountdown}s...
              </h4>
              <p className="text-xs text-gray-400 font-mono">
                Please wait while we establish your external connection link safely.
              </p>
            </div>

            {/* Sponsored Campaign Showcase */}
            <div className="p-4 rounded-xl border border-white/5 bg-black/30 space-y-3">
              <span className="block text-[8px] font-mono tracking-widest text-[#ff007f] uppercase font-bold">
                SPONSORED BY OUR PARTNER
              </span>
              <h5 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                {interstitialAd.title}
              </h5>
              
              <div className="overflow-hidden rounded-lg bg-black/20 p-2 min-h-[140px] flex items-center justify-center">
                {interstitialAd.adType === 'adsense' || interstitialAd.adType === 'html' ? (
                  <div 
                    className="w-full text-center text-xs"
                    dangerouslySetInnerHTML={{ __html: interstitialAd.adCode || '' }}
                  />
                ) : (
                  <a 
                    href={interstitialAd.targetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      const clickRef = ref(db, `ads/${interstitialAd.id}/clicks`);
                      runTransaction(clickRef, (curr) => (curr || 0) + 1);
                    }}
                    className="block w-full group"
                  >
                    <img 
                      src={interstitialAd.imageUrl} 
                      alt={interstitialAd.title}
                      className="w-full h-auto max-h-[220px] object-contain mx-auto rounded transition-transform group-hover:scale-102 duration-300"
                    />
                  </a>
                )}
              </div>
            </div>

            {/* Skip Actions panel */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setInterstitialActive(false);
                  if (pendingRedirect) {
                    if (pendingRedirect.openInNewTab) {
                      window.open(pendingRedirect.url, '_blank');
                    } else {
                      window.location.href = pendingRedirect.url;
                    }
                    setPendingRedirect(null);
                  }
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-mono text-xs tracking-wider uppercase rounded-lg border border-white/10 transition-all cursor-pointer font-bold"
              >
                Skip redirect timer &rarr;
              </button>
              
              {interstitialAd.targetUrl && (
                <a
                  href={interstitialAd.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const clickRef = ref(db, `ads/${interstitialAd.id}/clicks`);
                    runTransaction(clickRef, (curr) => (curr || 0) + 1);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyber-magenta to-cyber-purple font-display font-bold text-xs tracking-wider uppercase text-white rounded-lg hover:brightness-115 hover:shadow-[0_0_15px_rgba(255,0,127,0.3)] transition-all cursor-pointer text-center"
                >
                  Visit Sponsor Offer
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3) GLOBAL AUTOMATIC AD SYSTEMS CONTAINER */}
      <StickyAdBanner ads={ads} />

      {/* Silent background container executing Popups and Social Bar script tags globally */}
      {ads?.filter(ad => {
        const type = ad.adType?.toLowerCase().trim();
        return ad.enabled !== false && (type === 'popup' || type === 'social_bar');
      }).map(ad => (
        <div key={ad.id} className="hidden" style={{ display: 'none' }} aria-hidden="true">
          {ad.adCode && (
            <UniversalAdRenderer code={ad.adCode} onAdError={() => {}} />
          )}
        </div>
      ))}

    </div>
  );
}
