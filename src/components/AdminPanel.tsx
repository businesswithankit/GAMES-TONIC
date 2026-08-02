import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  ref as dbRef, 
  set, 
  push, 
  remove, 
  update, 
  onValue 
} from 'firebase/database';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Settings, 
  LogOut, 
  Globe, 
  Eye, 
  Save, 
  FolderOpen, 
  Sparkles,
  Layers,
  Code,
  Video,
  Link as LinkIcon,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  ListOrdered,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Grid,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Send,
  Share2,
  CheckCircle,
  Laptop,
  Image as ImageIcon,
  Radio,
  ArrowDown,
  ArrowUp,
  Copy,
  DollarSign,
  Cpu,
  Gamepad2,
  HardDrive,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { ContentPost, SiteSettings, NavMenu, ActionButton, VideoItem, Advertisement, AdSenseUnit, FeaturedGameItem } from '../types';
import AdSensePlacement, { ADSENSE_PREDEFINED_SLOTS } from './AdSensePlacement';

interface AdminPanelProps {
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  ads: Advertisement[];
}

export default function AdminPanel({ onClose, siteSettings, setSiteSettings, ads }: AdminPanelProps) {
  // Mobile / Collapsible Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Primary Sections Tab Selector
  const [activeTab, setActiveTab] = useState<'dashboard' | 'posts' | 'post-form' | 'featured-games' | 'featured-game-form' | 'videos' | 'video-form' | 'buttons' | 'menus' | 'footer' | 'home-builder' | 'announcements' | 'socials' | 'settings' | 'custom-pages' | 'counters' | 'sponsor-ads' | 'adsense' | 'maintenance'>('dashboard');

  // Loaded Content States
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [featuredGames, setFeaturedGames] = useState<FeaturedGameItem[]>([]);
  const [adsenseUnits, setAdsenseUnits] = useState<AdSenseUnit[]>([]);
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Maintenance Management State
  const [maintenanceForm, setMaintenanceForm] = useState({
    enabled: false,
    title: 'Games Tonic is Currently Under Maintenance',
    description: "We're upgrading Games Tonic with new features, performance improvements, and a better gaming experience. We'll be back shortly.",
    status: 'Optimizing platform...',
    showSocialIcons: true
  });

  // Animated Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const verifyAuthBeforeWrite = (): boolean => {
    if (authLoading) {
      showToast("Authentication is still initializing. Please wait...", "warning");
      return false;
    }
    if (!auth.currentUser || !user) {
      showToast("Authentication expired. Please log in again.", "error");
      setUser(null);
      return false;
    }
    return true;
  };

  const validateUrl = (url?: string): boolean => {
    if (!url || !url.trim()) return true;
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  };

  const validateEmail = (emailStr?: string): boolean => {
    if (!emailStr || !emailStr.trim()) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  // FEATURED GAMES CRUD FORM STATE
  const [selectedFeaturedGameId, setSelectedFeaturedGameId] = useState<string | null>(null);
  const [featuredGameForm, setFeaturedGameForm] = useState<Omit<FeaturedGameItem, 'id'>>({
    gameName: '',
    developerName: '',
    developerEmail: '',
    developerWebsite: '',
    gameLink: '',
    promptLink: '',
    imageLink: '',
    category: 'FEATURED GAME',
    version: '1.0',
    publishDate: '',
    updatedDate: '',
    status: 'published',
    position: 0
  });

  // AdSense Unit Form State
  const [editingAdsenseUnitId, setEditingAdsenseUnitId] = useState<string | null>(null);
  const [adsenseForm, setAdsenseForm] = useState({
    name: '',
    slot: 'homepage_top',
    adCode: '',
    enabled: true
  });
  const [previewAdsenseUnit, setPreviewAdsenseUnit] = useState<AdSenseUnit | null>(null);

  // Stats Counters state with animated counter goals
  const [stats, setStats] = useState({
    posts: 0,
    blogs: 0,
    videos: 0,
    mods: 0,
    categories: 0,
    menus: 0
  });

  // CONTENT CRUD FORM STATE
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<Omit<ContentPost, 'id'>>({
    type: 'games',
    title: '',
    slug: '',
    thumbnail: '',
    buttonText: '',
    buttonLink: '',
    linkEnabled: true,
    description: '',
    shortDescription: '',
    category: '',
    tags: [],
    author: 'Admin',
    authorEmail: '',
    authorWebsite: '',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'published',
    featured: false,
    extraLink: '',
    viewsCount: 0
  });

  // VIDEO CRUD FORM STATE
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState<Omit<VideoItem, 'id'>>({
    title: '',
    thumbnail: '',
    embedCode: '',
    description: '',
    category: '',
    featured: false,
    position: 0,
    buttonText: '',
    buttonLink: '',
    linkEnabled: true
  });

  // BUTTON BUILDER CRUD STATE
  const [selectedButtonKey, setSelectedButtonKey] = useState<string>('exploreNow');
  const [newButtonKey, setNewButtonKey] = useState<string>('');
  const [buttonForm, setButtonForm] = useState<ActionButton>({
    name: 'exploreNow',
    text: '',
    link: '',
    icon: 'ArrowRight',
    openInNewTab: false,
    status: 'active'
  });

  // MENU ROUTER CRUD STATE
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<Omit<NavMenu, 'id'>>({
    name: '',
    link: '',
    icon: 'Layers',
    position: 0,
    visibility: true
  });

  // FOOTER EDIT STATE
  const [footerForm, setFooterForm] = useState({
    text: '',
    copyright: '',
    about: '',
    support: ''
  });

  // HERO SECTION EDIT STATE
  const [heroForm, setHeroForm] = useState({
    title: '',
    subtitle: '',
    backgroundEffect: 'particles' as 'particles' | 'matrix' | 'waves' | 'stars',
    btnText1: '',
    btnLink1: '',
    btnText2: '',
    btnLink2: ''
  });

  // SOCIALS SECTION EDIT STATE
  const [socialsForm, setSocialsForm] = useState({
    youtubeLong: '',
    youtubeShorts: '',
    instagram: '',
    telegram: '',
    discord: '',
    facebook: '',
    x: '',
    threads: '',
    whatsapp: ''
  });

  // CUSTOM SOCIAL LINKS STATE
  const [selectedCustomSocialId, setSelectedCustomSocialId] = useState<string | null>(null);
  const [customSocialForm, setCustomSocialForm] = useState({
    platform: '',
    url: '',
    icon: 'Share2',
    status: true
  });

  // COUNTERS SYSTEM STATE
  const [selectedCounterId, setSelectedCounterId] = useState<string | null>(null);
  const [counterForm, setCounterForm] = useState({
    title: '',
    value: '',
    icon: 'Sparkles',
    animation: true,
    position: 0,
    visible: true
  });

  // CUSTOM DYNAMIC PAGES BUILDER STATE
  const [selectedCustomPageId, setSelectedCustomPageId] = useState<string | null>(null);
  const [customPageForm, setCustomPageForm] = useState({
    title: '',
    slug: '',
    content: '',
    seoTitle: '',
    seoDescription: '',
    status: 'published' as 'published' | 'draft'
  });

  // ANNOUNCEMENTS alert control states
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const [announcementInputText, setAnnouncementInputText] = useState('');
  const [announcementBgColor, setAnnouncementBgColor] = useState('#121225');
  const [announcementDisplayPosition, setAnnouncementDisplayPosition] = useState<'top_bar' | 'hero' | 'right_panel' | 'popup'>('top_bar');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // SECTION MANAGMENT DYNAMIC STATE
  const [newSectionForm, setNewSectionForm] = useState({
    title: '',
    key: 'games',
    subtitle: '',
    badge: '',
    btnText: '',
    btnLink: '',
    visible: true
  });

  const [newsletterSectionForm, setNewsletterSectionForm] = useState({
    title: '',
    description: '',
    badge: 'UPLINK SUBSCRIPTION',
    buttonText: 'SUBSCRIBE',
    buttonUrl: '',
    placeholder: 'ENTER DISPATCH EMAIL...',
    successMessage: 'Uplink established! You have subscribed to official dispatches.',
    visible: true
  });

  const [popupMessageForm, setPopupMessageForm] = useState({
    title: '',
    text: '',
    buttonText: 'Acknowledge Connection',
    visible: false
  });

  const [adForm, setAdForm] = useState<{
    id: string;
    title: string;
    position: string;
    adType: string;
    platform: string;
    adCode: string;
    imageUrl: string;
    targetUrl: string;
    enabled: boolean;
    startDate: string;
    endDate: string;
    sponsorName: string;
    buttonText: string;
    popupDelay: number;
    autoCloseTime: number;
    priority: number;
    scrollPercentage: number;
    firstVisitOnly: boolean;
    frequencyHours: number;
    oncePerSession: boolean;
    triggerOnButtonClick: boolean;
    showCloseButton: boolean;
    autoClose: boolean;
  }>({
    id: '',
    title: '',
    position: 'homepage_hero_bottom',
    adType: 'banner',
    platform: 'Sponsor',
    adCode: '',
    imageUrl: '',
    targetUrl: '',
    enabled: true,
    startDate: '',
    endDate: '',
    sponsorName: '',
    buttonText: '',
    popupDelay: 0,
    autoCloseTime: 10,
    priority: 0,
    scrollPercentage: 0,
    firstVisitOnly: false,
    frequencyHours: 0,
    oncePerSession: false,
    triggerOnButtonClick: false,
    showCloseButton: true,
    autoClose: false
  });

  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  const handleDuplicateAd = async (ad: Advertisement) => {
    setIsLoading(true);
    try {
      const newId = push(dbRef(db, 'ads')).key || 'ad_' + Date.now();
      const payload: Advertisement = {
        ...ad,
        id: newId,
        title: ad.title + ' (Copy)',
        createdAt: Date.now(),
        clicks: 0,
        views: 0
      };
      await set(dbRef(db, `ads/${newId}`), payload);
      alert("Sponsor Ad duplicated successfully!");
    } catch (err: any) {
      alert("Failed to duplicate Sponsor Ad: " + err.message);
    }
    setIsLoading(false);
  };

  const [adSettingsForm, setAdSettingsForm] = useState({
    buttonActionAdEnabled: false,
    buttonActionAdId: '',
    buttonActionAdType: 'redirect' as 'redirect' | 'modal',
    popupAdEnabled: false,
    popupAdDelay: 3,
    popupAdFrequency: 15,
    popupAdId: ''
  });

  const adStats = React.useMemo(() => {
    let totViews = 0;
    let totClicks = 0;
    if (ads && ads.length > 0) {
      ads.forEach(ad => {
        totViews += ad.views || 0;
        totClicks += ad.clicks || 0;
      });
    }
    const ctr = totViews > 0 ? ((totClicks / totViews) * 100).toFixed(2) : '0.00';
    return { totViews, totClicks, ctr };
  }, [ads]);

  const topPerformingAds = React.useMemo(() => {
    if (!ads) return [];
    return [...ads]
      .filter(a => (a.views || 0) > 0)
      .sort((a, b) => {
        const ctrA = (a.clicks || 0) / (a.views || 1);
        const ctrB = (b.clicks || 0) / (b.views || 1);
        return ctrB - ctrA;
      })
      .slice(0, 5);
  }, [ads]);

  // MULTIPLE TAXONOMY HELPERS
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  // Monitor Authentication Session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync settings when loaded
  useEffect(() => {
    if (siteSettings) {
      const parseArray = <T,>(val: any, fallback: T[] = []): T[] => {
        if (Array.isArray(val)) return val;
        if (val && typeof val === 'object') return Object.values(val) as T[];
        return fallback;
      };

      setSettingsForm({
        ...siteSettings,
        categories: parseArray(siteSettings.categories, ["Action", "RPG", "Graphics", "Utility Scripts", "Events", "Patch Logs"]),
        tags: parseArray(siteSettings.tags, []),
        menus: parseArray(siteSettings.menus, []),
        counters: parseArray(siteSettings.counters, []),
        customPages: parseArray(siteSettings.customPages, []),
        customSocialLinks: parseArray(siteSettings.customSocialLinks, [])
      });
      
      // Sync subgroups
      if (siteSettings.hero) {
        setHeroForm({
          title: siteSettings.hero.title || '',
          subtitle: siteSettings.hero.subtitle || '',
          backgroundEffect: siteSettings.hero.backgroundEffect || 'particles',
          btnText1: siteSettings.hero.btnText1 || '',
          btnLink1: siteSettings.hero.btnLink1 || '',
          btnText2: siteSettings.hero.btnText2 || '',
          btnLink2: siteSettings.hero.btnLink2 || ''
        });
      }
      if (siteSettings.socialLinks) {
        setSocialsForm({
          youtubeLong: siteSettings.socialLinks.youtubeLong || '',
          youtubeShorts: siteSettings.socialLinks.youtubeShorts || '',
          instagram: siteSettings.socialLinks.instagram || '',
          telegram: siteSettings.socialLinks.telegram || '',
          discord: siteSettings.socialLinks.discord || '',
          facebook: siteSettings.socialLinks.facebook || '',
          x: siteSettings.socialLinks.x || '',
          threads: siteSettings.socialLinks.threads || '',
          whatsapp: siteSettings.socialLinks.whatsapp || ''
        });
      }
      if (siteSettings.footerLinks || siteSettings.footer) {
        setFooterForm({
          text: siteSettings.footer?.text || '',
          copyright: siteSettings.footer?.copyright || '© 2026 Games Tonic. All Rights Reserved.',
          about: siteSettings.footerLinks?.about || '',
          support: siteSettings.footerLinks?.support || ''
        });
      }
      if (siteSettings.newsletter) {
        setNewsletterSectionForm({
          title: siteSettings.newsletter.title || '',
          description: siteSettings.newsletter.description || '',
          badge: siteSettings.newsletter.badge || 'UPLINK SUBSCRIPTION',
          buttonText: siteSettings.newsletter.buttonText || 'SUBSCRIBE',
          buttonUrl: siteSettings.newsletter.buttonUrl || '',
          placeholder: siteSettings.newsletter.placeholder || 'ENTER DISPATCH EMAIL...',
          successMessage: siteSettings.newsletter.successMessage || 'Uplink established! You have subscribed to official dispatches.',
          visible: siteSettings.newsletter.visible !== false
        });
      }
      if (siteSettings.popupMessage) {
        setPopupMessageForm({
          title: siteSettings.popupMessage.title || '',
          text: siteSettings.popupMessage.text || '',
          buttonText: siteSettings.popupMessage.buttonText || 'Acknowledge Connection',
          visible: siteSettings.popupMessage.visible !== false
        });
      }
      if (siteSettings.maintenance) {
        setMaintenanceForm({
          enabled: !!siteSettings.maintenance.enabled,
          title: siteSettings.maintenance.title || 'Games Tonic is Currently Under Maintenance',
          description: siteSettings.maintenance.description || "We're upgrading Games Tonic with new features, performance improvements, and a better gaming experience. We'll be back shortly.",
          status: siteSettings.maintenance.status || 'Optimizing platform...',
          showSocialIcons: siteSettings.maintenance.showSocialIcons !== false
        });
      }
      if (siteSettings.adSettings) {
        setAdSettingsForm({
          buttonActionAdEnabled: siteSettings.adSettings.buttonActionAdEnabled || false,
          buttonActionAdId: siteSettings.adSettings.buttonActionAdId || '',
          buttonActionAdType: siteSettings.adSettings.buttonActionAdType || 'redirect',
          popupAdEnabled: siteSettings.adSettings.popupAdEnabled || false,
          popupAdDelay: typeof siteSettings.adSettings.popupAdDelay === 'number' ? siteSettings.adSettings.popupAdDelay : 3,
          popupAdFrequency: typeof siteSettings.adSettings.popupAdFrequency === 'number' ? siteSettings.adSettings.popupAdFrequency : 15,
          popupAdId: siteSettings.adSettings.popupAdId || ''
        });
      }
    }
  }, [siteSettings]);

  // Load active lists & analytical counts
  useEffect(() => {
    if (!user) return;

    const postsRef = dbRef(db, 'posts');
    const unsubPosts = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) as ContentPost[] : [];
      setPosts(list);
    });

    const videosRef = dbRef(db, 'videos');
    const unsubVideos = onValue(videosRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) as VideoItem[] : [];
      setVideos(list);
    });

    const adsenseUnitsRef = dbRef(db, 'adsense_units');
    const unsubAdsense = onValue(adsenseUnitsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) as AdSenseUnit[] : [];
      setAdsenseUnits(list);
    });

    const featuredGamesRef = dbRef(db, 'featured_games');
    const unsubFeaturedGames = onValue(featuredGamesRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) as FeaturedGameItem[] : [];
      setFeaturedGames(list);
    });

    return () => {
      unsubPosts();
      unsubVideos();
      unsubAdsense();
      unsubFeaturedGames();
    };
  }, [user]);

  // FEATURED GAMES CRUD HANDLERS
  const handleFeaturedGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAuthBeforeWrite()) return;

    if (!featuredGameForm.gameName.trim() || !featuredGameForm.imageLink.trim() || !featuredGameForm.gameLink.trim()) {
      showToast("Game Name, Image Link, and Game Link are required!", "error");
      return;
    }

    if (!validateUrl(featuredGameForm.imageLink) || !validateUrl(featuredGameForm.gameLink) || (featuredGameForm.promptLink && !validateUrl(featuredGameForm.promptLink)) || (featuredGameForm.developerWebsite && !validateUrl(featuredGameForm.developerWebsite))) {
      showToast("Please enter valid URL formats for links/images.", "error");
      return;
    }

    if (featuredGameForm.developerEmail && !validateEmail(featuredGameForm.developerEmail)) {
      showToast("Please enter a valid developer email address.", "error");
      return;
    }

    const isDuplicateName = featuredGames.some(
      g => g.id !== selectedFeaturedGameId && g.gameName.trim().toLowerCase() === featuredGameForm.gameName.trim().toLowerCase()
    );
    if (isDuplicateName) {
      showToast("A Featured Game with this name already exists. Please use a unique Game Name.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const nowStr = new Date().toISOString().split('T')[0];
      const payload = {
        ...featuredGameForm,
        updatedDate: nowStr,
        publishDate: featuredGameForm.publishDate || nowStr
      };

      if (selectedFeaturedGameId) {
        await set(dbRef(db, `featured_games/${selectedFeaturedGameId}`), payload);
        showToast("Featured Game record updated successfully!", "success");
      } else {
        const nextRef = push(dbRef(db, 'featured_games'));
        await set(nextRef, payload);
        showToast("New Featured Game entry created successfully!", "success");
      }
      setFeaturedGameForm({
        gameName: '',
        developerName: '',
        developerEmail: '',
        developerWebsite: '',
        gameLink: '',
        promptLink: '',
        imageLink: '',
        category: 'FEATURED GAME',
        version: '1.0',
        publishDate: '',
        updatedDate: '',
        status: 'published',
        position: 0
      });
      setSelectedFeaturedGameId(null);
      setActiveTab('featured-games');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Permission denied')) {
         showToast("Permission denied: You must be signed in as an authorized admin to modify Featured Games.", "error");
      } else if (msg.includes('network') || msg.includes('NETWORK')) {
         showToast("Network error: Could not connect to database.", "error");
      } else {
         showToast("Error saving Featured Game: " + msg, "error");
      }
    }
    setIsLoading(false);
  };

  const handleEditFeaturedGame = (item: FeaturedGameItem) => {
    setSelectedFeaturedGameId(item.id);
    setFeaturedGameForm({
      gameName: item.gameName || '',
      developerName: item.developerName || '',
      developerEmail: item.developerEmail || '',
      developerWebsite: item.developerWebsite || '',
      gameLink: item.gameLink || '',
      promptLink: item.promptLink || '',
      imageLink: item.imageLink || '',
      category: item.category || 'FEATURED GAME',
      version: item.version || '1.0',
      publishDate: item.publishDate || '',
      updatedDate: item.updatedDate || '',
      status: item.status || 'published',
      position: item.position || 0
    });
    setActiveTab('featured-game-form');
  };

  const handleDeleteFeaturedGame = async (id: string) => {
    if (!verifyAuthBeforeWrite()) return;
    if (!window.confirm("Permanently delete this Featured Game item from database?")) return;
    try {
      await remove(dbRef(db, `featured_games/${id}`));
      showToast("Featured Game item deleted successfully.", "success");
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Permission denied')) {
        showToast("Permission denied: You must be signed in as an authorized admin to delete Featured Games.", "error");
      } else {
        showToast("Error deleting item: " + msg, "error");
      }
    }
  };

  // ADSENSE UNIT CRUD HANDLERS
  const handleSaveAdsenseUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adsenseForm.name.trim() || !adsenseForm.adCode.trim()) {
      alert("Please provide both an Ad Name and the Ad Unit Code.");
      return;
    }
    setIsLoading(true);
    try {
      const id = editingAdsenseUnitId || 'adsense_' + Date.now();
      const todayISO = new Date().toISOString().split('T')[0];
      const existing = adsenseUnits.find(u => u.id === editingAdsenseUnitId);

      const unitPayload: AdSenseUnit = {
        id,
        name: adsenseForm.name.trim(),
        slot: adsenseForm.slot,
        adCode: adsenseForm.adCode.trim(),
        enabled: adsenseForm.enabled,
        createdAt: existing ? existing.createdAt : todayISO,
        updatedAt: todayISO
      };

      await set(dbRef(db, `adsense_units/${id}`), unitPayload);

      setEditingAdsenseUnitId(null);
      setAdsenseForm({
        name: '',
        slot: 'homepage_top',
        adCode: '',
        enabled: true
      });
      alert("AdSense Unit saved successfully!");
    } catch (err) {
      console.error("Error saving AdSense unit:", err);
      alert("Failed to save AdSense Unit.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdsenseUnit = (unit: AdSenseUnit) => {
    setEditingAdsenseUnitId(unit.id);
    setAdsenseForm({
      name: unit.name,
      slot: unit.slot,
      adCode: unit.adCode,
      enabled: unit.enabled
    });
    // Scroll to form view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAdsenseUnit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this AdSense Unit?")) return;
    try {
      await remove(dbRef(db, `adsense_units/${id}`));
    } catch (err) {
      console.error("Error deleting AdSense unit:", err);
    }
  };

  const handleToggleAdsenseUnit = async (unit: AdSenseUnit) => {
    try {
      await set(dbRef(db, `adsense_units/${unit.id}/enabled`), !unit.enabled);
    } catch (err) {
      console.error("Error toggling AdSense unit status:", err);
    }
  };

  const handleDuplicateAdsenseUnit = async (unit: AdSenseUnit) => {
    try {
      const newId = 'adsense_' + Date.now();
      const todayISO = new Date().toISOString().split('T')[0];
      const duplicatedUnit: AdSenseUnit = {
        ...unit,
        id: newId,
        name: `${unit.name} (Copy)`,
        createdAt: todayISO,
        updatedAt: todayISO
      };
      await set(dbRef(db, `adsense_units/${newId}`), duplicatedUnit);
    } catch (err) {
      console.error("Error duplicating AdSense unit:", err);
    }
  };

  // Calculate high-fidelity numerical stats, then animate count-up values smoothly
  useEffect(() => {
    const totalPosts = posts.length;
    const totalVideos = videos.length;
    const totalMods = posts.filter(p => p.type === 'mods').length;
    const totalCategories = settingsForm.categories?.length || 0;
    const totalMenus = settingsForm.menus?.length || 0;

    // Direct state animation setup
    let isMounted = true;
    const steps = 15;
    let currentStep = 0;

    const timer = setInterval(() => {
      if (!isMounted) return;
      currentStep++;
      const ratio = currentStep / steps;

      setStats({
        posts: Math.round(totalPosts * ratio),
        blogs: 0,
        videos: Math.round(totalVideos * ratio),
        mods: Math.round(totalMods * ratio),
        categories: Math.round(totalCategories * ratio),
        menus: Math.round(totalMenus * ratio)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, 20);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [posts, videos, settingsForm]);

  // Sync current selected Button configuration data
  useEffect(() => {
    if (selectedButtonKey === 'NEW_BUTTON') {
      setButtonForm({
        id: 'new_button',
        name: 'new_button',
        text: '',
        link: '',
        icon: 'ArrowRight',
        openInNewTab: false,
        status: 'active'
      });
    } else if (settingsForm.buttons && settingsForm.buttons[selectedButtonKey]) {
      setButtonForm({
        name: selectedButtonKey,
        ...settingsForm.buttons[selectedButtonKey]
      });
    } else {
      setButtonForm({
        name: selectedButtonKey,
        text: 'BUTTON ACTION',
        link: '#',
        icon: 'ArrowRight',
        openInNewTab: false,
        status: 'active'
      });
    }
  }, [selectedButtonKey, settingsForm]);

  // Handle Login & Sign Up seamlessly
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setAuthLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' || 
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-email'
        ) {
          // If user does not exist yet, automatically attempt creation
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error("Firebase auth process error:", err);
      let msg = err.message || "Authentication error.";
      if (err.code === 'auth/wrong-password') {
        msg = "Invalid password entered for this admin account.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout process crashed", err);
    }
  };

  // --- CONTENT RECORD CONTROLLER CRUD ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title || !postForm.slug) {
      alert("Title and URL Slug are required variables!");
      return;
    }
    setIsLoading(true);
    try {
      if (selectedPostId) {
        const postRef = dbRef(db, `posts/${selectedPostId}`);
        await update(postRef, postForm);
        alert("Platform Content specifications updated successfully.");
      } else {
        const postsCol = dbRef(db, 'posts');
        const nextId = push(postsCol);
        await set(nextId, {
          ...postForm,
          viewsCount: 0
        });
        alert("New Platform Content record dispatched successfully.");
      }
      setPostForm({
        type: 'games',
        title: '',
        slug: '',
        thumbnail: '',
        buttonText: '',
        buttonLink: '',
        linkEnabled: true,
        description: '',
        shortDescription: '',
        category: '',
        tags: [],
        author: 'Admin',
        authorEmail: '',
        authorWebsite: '',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'published',
        featured: false,
        extraLink: '',
        viewsCount: 0
      });
      setSelectedPostId(null);
      setActiveTab('posts');
    } catch (err: any) {
      alert("Database Synchronization Failed: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditPost = (post: ContentPost) => {
    setSelectedPostId(post.id);
    setPostForm({
      type: post.type,
      title: post.title,
      slug: post.slug,
      thumbnail: post.thumbnail || '',
      buttonText: post.buttonText || '',
      buttonLink: post.buttonLink || '',
      linkEnabled: post.linkEnabled !== false,
      description: post.description || '',
      shortDescription: post.shortDescription || '',
      category: post.category || '',
      tags: post.tags || [],
      author: post.author || 'Admin',
      authorEmail: post.authorEmail || '',
      authorWebsite: post.authorWebsite || '',
      publishDate: post.publishDate || new Date().toISOString().split('T')[0],
      status: post.status || 'published',
      featured: !!post.featured,
      extraLink: post.extraLink || '',
      viewsCount: post.viewsCount || 0
    });
    setActiveTab('post-form');
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Permanently purge this item from Database?")) return;
    try {
      await remove(dbRef(db, `posts/${id}`));
      alert("Purge complete.");
    } catch (err: any) {
      alert("Failed to delete matching resource indices: " + err.message);
    }
  };

  // --- VIDEO CONTROLLER CRUD ---
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.embedCode) {
      alert("Title and IFrame Embed script are mandatory!");
      return;
    }
    setIsLoading(true);
    try {
      if (selectedVideoId) {
        await set(dbRef(db, `videos/${selectedVideoId}`), videoForm);
        alert("Streaming archive details updated.");
      } else {
        const nextV = push(dbRef(db, 'videos'));
        await set(nextV, videoForm);
        alert("Streaming entry compiled dynamically.");
      }
      setVideoForm({
        title: '',
        thumbnail: '',
        embedCode: '',
        description: '',
        category: '',
        featured: false,
        position: 0,
        buttonText: '',
        buttonLink: '',
        linkEnabled: true
      });
      setSelectedVideoId(null);
      setActiveTab('videos');
    } catch (err: any) {
      alert("Error writing video mapping coordinates: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditVideo = (video: VideoItem) => {
    setSelectedVideoId(video.id);
    setVideoForm({
      title: video.title,
      thumbnail: video.thumbnail || '',
      embedCode: video.embedCode,
      description: video.description || '',
      category: video.category || '',
      featured: !!video.featured,
      position: video.position || 0,
      buttonText: video.buttonText || '',
      buttonLink: video.buttonLink || '',
      linkEnabled: video.linkEnabled !== false
    });
    setActiveTab('video-form');
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm("Disconnect this dynamic streaming entry from databases?")) return;
    try {
      await remove(dbRef(db, `videos/${id}`));
      alert("Video link purged.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // --- BUTTON CONTROLLER SAVING ---
  const handleButtonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let targetKey = selectedButtonKey;
      if (selectedButtonKey === 'NEW_BUTTON') {
        const cleanKey = newButtonKey.trim().replace(/\s+/g, '');
        if (!cleanKey) {
          alert("Key Code is required for new Custom Button.");
          setIsLoading(false);
          return;
        }
        targetKey = cleanKey;
      }
      const updatedButtons = {
        ...(settingsForm.buttons || {}),
        [targetKey]: {
          text: buttonForm.text,
          link: buttonForm.link,
          icon: buttonForm.icon,
          openInNewTab: buttonForm.openInNewTab,
          status: buttonForm.status || 'active'
        }
      };
      const finalSettings = { ...settingsForm, buttons: updatedButtons };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      if (selectedButtonKey === 'NEW_BUTTON') {
        setSelectedButtonKey(targetKey);
        setNewButtonKey('');
      }
      alert(`Button [${targetKey}] parameters committed to core settings.`);
    } catch (err: any) {
      alert("Database error updating button configuration: " + err.message);
    }
    setIsLoading(false);
  };

  const handleDeleteButton = async () => {
    const isBuiltIn = ['exploreNow', 'latestUpdates', 'joinCommunity', 'contact'].includes(selectedButtonKey);
    if (isBuiltIn) {
      alert("System Action Button cannot be purged. Deactivate its visibility instead.");
      return;
    }
    if (!window.confirm(`Purge Custom Button [${selectedButtonKey}] from layouts?`)) return;
    setIsLoading(true);
    try {
      const updatedButtons = { ...(settingsForm.buttons || {}) };
      delete updatedButtons[selectedButtonKey];
      const finalSettings = { ...settingsForm, buttons: updatedButtons };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      setSelectedButtonKey('exploreNow');
      alert(`Button purged successfully.`);
    } catch (err: any) {
      alert("Database Error purging button: " + err.message);
    }
    setIsLoading(false);
  };

  // --- MENU CONTROLLER CRUD ---
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.link) {
      alert("Label and target custom URL fields are required.");
      return;
    }
    setIsLoading(true);
    try {
      const currentMenus = settingsForm.menus ? [...settingsForm.menus] : [];
      if (selectedMenuId) {
        const foundIdx = currentMenus.findIndex(m => m.id === selectedMenuId);
        if (foundIdx !== -1) {
          currentMenus[foundIdx] = { id: selectedMenuId, ...menuForm };
        }
      } else {
        currentMenus.push({
          id: 'menu_' + Date.now(),
          ...menuForm
        });
      }

      // Sort by position number auto
      currentMenus.sort((a,b) => (a.position || 0) - (b.position || 0));

      const finalSettings = { ...settingsForm, menus: currentMenus };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Header navigation compiled on the fly.");
      setMenuForm({ name: '', link: '', icon: 'Layers', position: 0, visibility: true });
      setSelectedMenuId(null);
    } catch (err: any) {
      alert("Database menu integration error: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditMenu = (menuItem: NavMenu) => {
    setSelectedMenuId(menuItem.id);
    setMenuForm({
      name: menuItem.name,
      link: menuItem.link,
      icon: menuItem.icon || 'Layers',
      position: menuItem.position || 0,
      visibility: menuItem.visibility !== false
    });
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (!window.confirm("Trash this menu reference?")) return;
    try {
      const currentMenus = settingsForm.menus ? settingsForm.menus.filter(m => m.id !== menuId) : [];
      const finalSettings = { ...settingsForm, menus: currentMenus };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Menu purged.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // --- FOOTER CONFIGURATION SAVING ---
  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = {
        ...settingsForm,
        footer: {
          text: footerForm.text,
          copyright: footerForm.copyright
        },
        footerLinks: {
          about: footerForm.about,
          support: footerForm.support
        }
      };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Footer layout parameters synchronized.");
    } catch (err: any) {
      alert("Footer database update failed: " + err.message);
    }
    setIsLoading(false);
  };

  const handleNewsletterSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = {
        ...settingsForm,
        newsletter: {
          title: newsletterSectionForm.title,
          description: newsletterSectionForm.description,
          badge: newsletterSectionForm.badge,
          buttonText: newsletterSectionForm.buttonText,
          buttonUrl: newsletterSectionForm.buttonUrl,
          placeholder: newsletterSectionForm.placeholder,
          successMessage: newsletterSectionForm.successMessage,
          visible: newsletterSectionForm.visible !== false
        }
      };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Newsletter / Join the Dispatch parameters synchronized.");
    } catch (err: any) {
      alert("Newsletter database update failed: " + err.message);
    }
    setIsLoading(false);
  };

  const handlePopupMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = {
        ...settingsForm,
        popupMessage: {
          title: popupMessageForm.title,
          text: popupMessageForm.text,
          buttonText: popupMessageForm.buttonText,
          visible: popupMessageForm.visible !== false
        }
      };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Popup Modal specifications synchronized successfully!");
    } catch (err: any) {
      alert("Popup Modal update failed: " + err.message);
    }
    setIsLoading(false);
  };

  // --- AD MANAGEMENT CRUD HANDLERS ---
  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const adId = editingAdId || push(dbRef(db, 'ads')).key || Date.now().toString();
      const payload: Partial<Advertisement> = {
        id: adId,
        title: adForm.title,
        position: adForm.position,
        adType: adForm.adType,
        platform: 'Sponsor',
        adCode: adForm.adCode || '',
        imageUrl: adForm.imageUrl || '',
        targetUrl: adForm.targetUrl || '',
        enabled: adForm.enabled !== false,
        startDate: adForm.startDate || '',
        endDate: adForm.endDate || '',
        sponsorName: adForm.sponsorName || '',
        buttonText: adForm.buttonText || '',
        popupDelay: Number(adForm.popupDelay) || 0,
        autoCloseTime: Number(adForm.autoCloseTime) || 10,
        priority: Number(adForm.priority) || 0,
        scrollPercentage: Number(adForm.scrollPercentage) || 0,
        firstVisitOnly: !!adForm.firstVisitOnly,
        frequencyHours: Number(adForm.frequencyHours) || 0,
        oncePerSession: !!adForm.oncePerSession,
        triggerOnButtonClick: !!adForm.triggerOnButtonClick,
        showCloseButton: adForm.showCloseButton !== false,
        autoClose: !!adForm.autoClose,
        createdAt: editingAdId ? (ads?.find(a => a.id === editingAdId)?.createdAt || Date.now()) : Date.now(),
        clicks: editingAdId ? (ads?.find(a => a.id === editingAdId)?.clicks || 0) : 0,
      };
      await set(dbRef(db, `ads/${adId}`), payload);
      alert(editingAdId ? "Sponsor Ad updated successfully!" : "New Sponsor Ad created successfully!");
      // Reset form
      setAdForm({
        id: '',
        title: '',
        position: 'homepage_hero_bottom',
        adType: 'banner',
        platform: 'Sponsor',
        adCode: '',
        imageUrl: '',
        targetUrl: '',
        enabled: true,
        startDate: '',
        endDate: '',
        sponsorName: '',
        buttonText: '',
        popupDelay: 0,
        autoCloseTime: 10,
        priority: 0,
        scrollPercentage: 0,
        firstVisitOnly: false,
        frequencyHours: 0,
        oncePerSession: false,
        triggerOnButtonClick: false,
        showCloseButton: true,
        autoClose: false
      });
      setEditingAdId(null);
    } catch (err: any) {
      alert("Failed to save Sponsor Ad: " + err.message);
    }
    setIsLoading(false);
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this sponsor advertisement?")) return;
    setIsLoading(true);
    try {
      await set(dbRef(db, `ads/${adId}`), null);
      alert("Sponsor Ad deleted successfully.");
      if (editingAdId === adId) {
        setEditingAdId(null);
        setAdForm({
          id: '',
          title: '',
          position: 'homepage_hero_bottom',
          adType: 'banner',
          platform: 'Sponsor',
          adCode: '',
          imageUrl: '',
          targetUrl: '',
          enabled: true,
          startDate: '',
          endDate: '',
          sponsorName: '',
          buttonText: '',
          popupDelay: 0,
          autoCloseTime: 10,
          priority: 0,
          scrollPercentage: 0,
          firstVisitOnly: false,
          frequencyHours: 0,
          oncePerSession: false,
          triggerOnButtonClick: false,
          showCloseButton: true,
          autoClose: false
        });
      }
    } catch (err: any) {
      alert("Error deleting ad: " + err.message);
    }
    setIsLoading(false);
  };

  const handleToggleAdEnabled = async (adId: string, currentStatus: boolean) => {
    try {
      await set(dbRef(db, `ads/${adId}/enabled`), !currentStatus);
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleResetAdStats = async (adId: string) => {
    if (!window.confirm("Reset clicks counter to zero for this campaign?")) return;
    try {
      await set(dbRef(db, `ads/${adId}/clicks`), 0);
      alert("Clicks successfully reset.");
    } catch (err: any) {
      alert("Error resetting clicks: " + err.message);
    }
  };

  const handleSaveAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = {
        ...settingsForm,
        adSettings: {
          buttonActionAdEnabled: adSettingsForm.buttonActionAdEnabled !== false,
          buttonActionAdId: adSettingsForm.buttonActionAdId || '',
          buttonActionAdType: adSettingsForm.buttonActionAdType || 'redirect',
          popupAdEnabled: adSettingsForm.popupAdEnabled !== false,
          popupAdDelay: Number(adSettingsForm.popupAdDelay) || 0,
          popupAdFrequency: Number(adSettingsForm.popupAdFrequency) || 0,
          popupAdId: adSettingsForm.popupAdId || ''
        }
      };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Global monetization parameters updated live successfully!");
    } catch (err: any) {
      alert("Failed to save monetization configurations: " + err.message);
    }
    setIsLoading(false);
  };

  const handleSaveAdsenseCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = {
        ...settingsForm,
        adsenseCode: settingsForm.adsenseCode || ''
      };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Google AdSense settings updated live successfully!");
    } catch (err: any) {
      alert("Failed to save Google AdSense configurations: " + err.message);
    }
    setIsLoading(false);
  };

  // --- HERO CONFIGURATION SAVING ---
  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = { ...settingsForm, hero: heroForm };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Hero dynamic text and parameters committed.");
    } catch (err: any) {
      alert("Hero section database write failed: " + err.message);
    }
    setIsLoading(false);
  };

  // --- SOCIAL MEDIAS CONFIGURATION SAVING ---
  const handleSocialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const finalSettings = { ...settingsForm, socialLinks: socialsForm };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Social network indices synchronized successfully.");
    } catch (err: any) {
      alert("Social DB write crashed: " + err.message);
    }
    setIsLoading(false);
  };

  // --- CUSTOM PAGES CONTROL CRUD ---
  const handleCustomPageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPageForm.title || !customPageForm.slug) {
      alert("Title and URL Slug are required variables!");
      return;
    }
    setIsLoading(true);
    try {
      const currentPages = settingsForm.customPages ? [...settingsForm.customPages] : [];
      const pageData = {
        id: selectedCustomPageId || 'page_' + Date.now(),
        title: customPageForm.title,
        slug: customPageForm.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: customPageForm.content,
        seoTitle: customPageForm.seoTitle,
        seoDescription: customPageForm.seoDescription,
        status: customPageForm.status
      };

      if (selectedCustomPageId) {
        const idx = currentPages.findIndex(p => p.id === selectedCustomPageId);
        if (idx !== -1) currentPages[idx] = pageData;
      } else {
        currentPages.push(pageData);
      }

      const finalSettings = { ...settingsForm, customPages: currentPages };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Page configurations permanently synchronized.");
      setCustomPageForm({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '', status: 'published' });
      setSelectedCustomPageId(null);
    } catch (err: any) {
      alert("Database Custom Pages write error: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditCustomPage = (page: any) => {
    setSelectedCustomPageId(page.id);
    setCustomPageForm({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      status: page.status || 'published'
    });
  };

  const handleDeleteCustomPage = async (pageId: string) => {
    if (!window.confirm("Purge this custom dynamic page? This cannot be undone.")) return;
    setIsLoading(true);
    try {
      const currentPages = settingsForm.customPages ? settingsForm.customPages.filter(p => p.id !== pageId) : [];
      const finalSettings = { ...settingsForm, customPages: currentPages };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Custom page deleted.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setIsLoading(false);
  };

  const handleCloneCustomPage = async (page: any) => {
    setIsLoading(true);
    try {
      const currentPages = settingsForm.customPages ? [...settingsForm.customPages] : [];
      const newPage = {
        ...page,
        id: 'page_' + Math.random().toString(36).substring(2, 11),
        title: page.title + ' (Copy)',
        slug: page.slug + '-copy',
        position: (page.position || 0) + 1
      };
      currentPages.push(newPage);
      const finalSettings = { ...settingsForm, customPages: currentPages };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Page duplicated successfully.");
    } catch (err: any) {
      alert("Error cloning page: " + err.message);
    }
    setIsLoading(false);
  };

  const handleReorderCustomPage = async (pageId: string, direction: 'up' | 'down') => {
    setIsLoading(true);
    try {
      const currentPages = settingsForm.customPages ? [...settingsForm.customPages] : [];
      const index = currentPages.findIndex(p => p.id === pageId);
      if (index !== -1) {
        if (direction === 'up' && index > 0) {
          const temp = currentPages[index];
          currentPages[index] = currentPages[index - 1];
          currentPages[index - 1] = temp;
        } else if (direction === 'down' && index < currentPages.length - 1) {
          const temp = currentPages[index];
          currentPages[index] = currentPages[index + 1];
          currentPages[index + 1] = temp;
        }
        
        // Re-assign position indices
        currentPages.forEach((p, idx) => {
          p.position = idx + 1;
        });

        const finalSettings = { ...settingsForm, customPages: currentPages };
        await set(dbRef(db, 'settings'), finalSettings);
        setSettingsForm(finalSettings);
        setSiteSettings(finalSettings);
      }
    } catch (err: any) {
      alert("Error reordering pages: " + err.message);
    }
    setIsLoading(false);
  };

  const handleHomeSectionSave = async (section: any) => {
    setIsLoading(true);
    try {
      const currentSections = settingsForm.homeSections ? [...settingsForm.homeSections] : [];
      const idx = currentSections.findIndex(s => s.id === section.id || s.key === section.key);
      if (idx !== -1) {
        currentSections[idx] = section;
      } else {
        currentSections.push(section);
      }
      const finalSettings = { ...settingsForm, homeSections: currentSections };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert(`Home Section [${section.key.toUpperCase()}] saved successfully!`);
    } catch (err: any) {
      alert("Error saving section: " + err.message);
    }
    setIsLoading(false);
  };

  const handleReorderHomeSection = async (sectionKey: string, direction: 'up' | 'down') => {
    setIsLoading(true);
    try {
      const currentSections = settingsForm.homeSections ? [...settingsForm.homeSections] : [];
      const index = currentSections.findIndex(s => s.key === sectionKey);
      if (index !== -1) {
        if (direction === 'up' && index > 0) {
          const temp = currentSections[index];
          currentSections[index] = currentSections[index - 1];
          currentSections[index - 1] = temp;
        } else if (direction === 'down' && index < currentSections.length - 1) {
          const temp = currentSections[index];
          currentSections[index] = currentSections[index + 1];
          currentSections[index + 1] = temp;
        }

        // Re-assign positions
        currentSections.forEach((sec, idx) => {
          sec.position = idx + 1;
        });

        const finalSettings = { ...settingsForm, homeSections: currentSections };
        await set(dbRef(db, 'settings'), finalSettings);
        setSettingsForm(finalSettings);
        setSiteSettings(finalSettings);
      }
    } catch (err: any) {
      alert("Error reordering section: " + err.message);
    }
    setIsLoading(false);
  };

  const handleCreateHomeSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionForm.title) {
      alert("Section title is required!");
      return;
    }
    setIsLoading(true);
    try {
      const currentSections = settingsForm.homeSections ? [...settingsForm.homeSections] : [];
      const newSection = {
        id: 'sec_' + Date.now(),
        key: newSectionForm.key || 'games',
        title: newSectionForm.title,
        subtitle: newSectionForm.subtitle,
        badge: newSectionForm.badge,
        btnText: newSectionForm.btnText,
        btnLink: newSectionForm.btnLink,
        visible: newSectionForm.visible !== false,
        position: currentSections.length + 1
      };
      currentSections.push(newSection);
      const finalSettings = { ...settingsForm, homeSections: currentSections };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      setNewSectionForm({
        title: '',
        key: 'games',
        subtitle: '',
        badge: '',
        btnText: '',
        btnLink: '',
        visible: true
      });
      alert("New dynamic home section created successfully!");
    } catch (err: any) {
      alert("Error creating section: " + err.message);
    }
    setIsLoading(false);
  };

  const handleDeleteHomeSection = async (sectionId: string) => {
    if (!window.confirm("Are you sure you want to completely delete this homepage section from database node?")) return;
    setIsLoading(true);
    try {
      const currentSections = settingsForm.homeSections ? settingsForm.homeSections.filter(s => s.id !== sectionId) : [];
      // re-index positions
      currentSections.forEach((sec, idx) => {
        sec.position = idx + 1;
      });
      const finalSettings = { ...settingsForm, homeSections: currentSections };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Section deleted successfully.");
    } catch (err: any) {
      alert("Error deleting section: " + err.message);
    }
    setIsLoading(false);
  };

  // --- COUNTERS PLATFORM CRUD ---
  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterForm.title || !counterForm.value) {
      alert("Title and Counter Value are required!");
      return;
    }
    setIsLoading(true);
    try {
      const currentCounters = settingsForm.counters ? [...settingsForm.counters] : [];
      const counterData = {
        id: selectedCounterId || 'counter_' + Date.now(),
        title: counterForm.title,
        value: counterForm.value,
        icon: counterForm.icon || 'Sparkles',
        animation: counterForm.animation !== false,
        position: parseInt(String(counterForm.position || 0), 10),
        visible: counterForm.visible !== false
      };

      if (selectedCounterId) {
        const idx = currentCounters.findIndex(c => c.id === selectedCounterId);
        if (idx !== -1) currentCounters[idx] = counterData;
      } else {
        currentCounters.push(counterData);
      }

      currentCounters.sort((a, b) => (a.position || 0) - (b.position || 0));

      const finalSettings = { ...settingsForm, counters: currentCounters };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Counters updated successfully.");
      setCounterForm({ title: '', value: '', icon: 'Sparkles', animation: true, position: 0, visible: true });
      setSelectedCounterId(null);
    } catch (err: any) {
      alert("Database Counters write error: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditCounter = (counter: any) => {
    setSelectedCounterId(counter.id);
    setCounterForm({
      title: counter.title || '',
      value: counter.value || '',
      icon: counter.icon || 'Sparkles',
      animation: counter.animation !== false,
      position: counter.position || 0,
      visible: counter.visible !== false
    });
  };

  const handleDeleteCounter = async (counterId: string) => {
    if (!window.confirm("Delete this animated counter display?")) return;
    setIsLoading(true);
    try {
      const currentCounters = settingsForm.counters ? settingsForm.counters.filter(c => c.id !== counterId) : [];
      const finalSettings = { ...settingsForm, counters: currentCounters };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Counter removed.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setIsLoading(false);
  };

  // --- CUSTOM SOCIAL PLATFORMS CRUD ---
  const handleCustomSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSocialForm.platform || !customSocialForm.url) {
      alert("Platform name and redirection URL are required variables!");
      return;
    }
    setIsLoading(true);
    try {
      const currentSocials = settingsForm.customSocialLinks ? [...settingsForm.customSocialLinks] : [];
      const socialData = {
        id: selectedCustomSocialId || 'cs_' + Date.now(),
        platform: customSocialForm.platform,
        url: customSocialForm.url,
        icon: customSocialForm.icon,
        status: customSocialForm.status !== false
      };

      if (selectedCustomSocialId) {
        const idx = currentSocials.findIndex(s => s.id === selectedCustomSocialId);
        if (idx !== -1) currentSocials[idx] = socialData;
      } else {
        currentSocials.push(socialData);
      }

      const finalSettings = { ...settingsForm, customSocialLinks: currentSocials };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Independent custom socials committed with real icons.");
      setCustomSocialForm({ platform: '', url: '', icon: 'Share2', status: true });
      setSelectedCustomSocialId(null);
    } catch (err: any) {
      alert("Database Custom Social links write crashed: " + err.message);
    }
    setIsLoading(false);
  };

  const handleEditCustomSocial = (socialItem: any) => {
    setSelectedCustomSocialId(socialItem.id);
    setCustomSocialForm({
      platform: socialItem.platform || '',
      url: socialItem.url || '',
      icon: socialItem.icon || 'Share2',
      status: socialItem.status !== false
    });
  };

  const handleDeleteCustomSocial = async (csId: string) => {
    if (!window.confirm("Purge this custom icon redirect?")) return;
    setIsLoading(true);
    try {
      const currentSocials = settingsForm.customSocialLinks ? settingsForm.customSocialLinks.filter(s => s.id !== csId) : [];
      const finalSettings = { ...settingsForm, customSocialLinks: currentSocials };
      await set(dbRef(db, 'settings'), finalSettings);
      setSettingsForm(finalSettings);
      setSiteSettings(finalSettings);
      alert("Social entry purged.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setIsLoading(false);
  };

  // --- SITE DIRECT SETTINGS SAVING ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await set(dbRef(db, 'settings'), settingsForm);
      setSiteSettings(settingsForm);
      alert("Global Site dynamic parameters successfully synchronized with realtime DB!");
    } catch (err: any) {
      alert("Settings write error: " + err.message);
    }
    setIsLoading(false);
  };

  const handleSaveMaintenanceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await set(dbRef(db, 'settings/maintenance'), maintenanceForm);
      setSiteSettings({
        ...siteSettings,
        maintenance: maintenanceForm
      });
      showToast("Maintenance parameters successfully synchronized with Realtime DB!", "success");
    } catch (err: any) {
      showToast("Maintenance write error: " + err.message, "error");
    }
    setIsLoading(false);
  };

  // AUTO GENERATE SLUG FROM TITLE
  const handlePostTitleChange = (val: string) => {
    const slugged = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setPostForm(prev => ({
      ...prev,
      title: val,
      slug: slugged,
      seoTitle: `${val} | Games Tonic`
    }));
  };

  // TAXONOMIES MUTATORS
  const safeGetArray = <T,>(val: any, fallback: T[] = []): T[] => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val) as T[];
    return fallback;
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.trim();
    const currentCats = safeGetArray<string>(settingsForm.categories, ["Action", "RPG", "Graphics", "Utility Scripts", "Events", "Patch Logs"]);
    if (currentCats.includes(cat)) {
      alert("Category already exists.");
      return;
    }
    const updated = [...currentCats, cat];
    const finalSettings = { ...settingsForm, categories: updated };
    setSettingsForm(finalSettings);
    setNewCategory('');
    try {
      await set(dbRef(db, 'settings'), finalSettings);
      setSiteSettings(finalSettings);
    } catch (err: any) {
      console.error("Error auto-saving category to database:", err);
    }
  };

  const handleRemoveCategory = async (cat: string) => {
    const currentCats = safeGetArray<string>(settingsForm.categories);
    const updated = currentCats.filter(c => c !== cat);
    const finalSettings = { ...settingsForm, categories: updated };
    setSettingsForm(finalSettings);
    try {
      await set(dbRef(db, 'settings'), finalSettings);
      setSiteSettings(finalSettings);
    } catch (err: any) {
      console.error("Error removing category from database:", err);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const t = newTag.trim().toLowerCase();
    const currentTags = safeGetArray<string>(settingsForm.tags);
    if (currentTags.includes(t)) {
      alert("Tag already exists.");
      return;
    }
    const updated = [...currentTags, t];
    const finalSettings = { ...settingsForm, tags: updated };
    setSettingsForm(finalSettings);
    setNewTag('');
    try {
      await set(dbRef(db, 'settings'), finalSettings);
      setSiteSettings(finalSettings);
    } catch (err: any) {
      console.error("Error auto-saving tag to database:", err);
    }
  };

  const handleRemoveTag = async (t: string) => {
    const currentTags = safeGetArray<string>(settingsForm.tags);
    const updated = currentTags.filter(tg => tg !== t);
    const finalSettings = { ...settingsForm, tags: updated };
    setSettingsForm(finalSettings);
    try {
      await set(dbRef(db, 'settings'), finalSettings);
      setSiteSettings(finalSettings);
    } catch (err: any) {
      console.error("Error removing tag from database:", err);
    }
  };

  const handleTagsCheckboxToggle = (t: string) => {
    const currentTags = Array.isArray(postForm.tags)
      ? postForm.tags
      : typeof postForm.tags === 'string' && postForm.tags.trim()
      ? postForm.tags.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const exists = currentTags.includes(t);
    if (exists) {
      setPostForm(prev => ({ ...prev, tags: currentTags.filter(tg => tg !== t) }));
    } else {
      setPostForm(prev => ({ ...prev, tags: [...currentTags, t] }));
    }
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07070c] backdrop-blur-xl">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-cyber-cyan animate-spin" />
          <div className="absolute inset-3 rounded-full border-r-2 border-l-2 border-cyber-magenta animate-spin duration-1000" />
        </div>
        <p className="font-display text-cyber-cyan text-xs tracking-[0.2em] uppercase mt-8 animate-pulse">Syncing Admin Terminal...</p>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-[#07070c] flex items-center justify-center p-4">
        {/* Abstract cyber visual asset backdrop */}
        <div className="absolute inset-x-0 top-1/4 h-72 bg-gradient-to-r from-cyber-cyan/10 via-transparent to-cyber-magenta/10 select-none pointer-events-none blur-3xl" />
        
        <div className="w-full max-w-md bg-cyber-dark/90 backdrop-blur-2xl p-8 rounded-2xl border border-cyber-cyan/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] relative overflow-hidden transition-all duration-300">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 text-[10px] uppercase font-display text-gray-500 hover:text-white border border-white/5 bg-white/5 hover:border-cyber-cyan/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Terminal Exit
          </button>
          
          <div className="text-center space-y-2 mb-8 mt-2">
            <div className="inline-flex p-3 bg-cyber-cyan/5 rounded-full border border-cyber-cyan/20 text-cyber-cyan animate-pulse">
              <Laptop className="w-6 h-6 " />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-[0.15em] text-glow uppercase leading-none">
              ADMINISTRATIVE TERMINAL
            </h1>
            <p className="text-[10px] text-cyber-cyan font-mono tracking-widest uppercase">FIREBASE AUTHENTICATION ROUTING</p>
          </div>

          {error && (
            <div className="p-3 bg-cyber-magenta/15 border border-cyber-magenta/30 rounded-xl text-cyber-magenta text-xs font-sans flex items-start gap-2 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-normal">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-sans text-sm">
            <div>
              <label className="block text-[10px] uppercase text-gray-400 tracking-wider mb-2 font-display font-bold">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gamestonicofficial.com"
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-gray-400 tracking-wider mb-2 font-display font-bold">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-magenta text-black font-display font-black uppercase text-xs tracking-widest rounded-xl hover:brightness-125 hover:shadow-[0_0_24px_rgba(0,240,255,0.4)] transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {authLoading ? 'Authenticating...' : 'Authorize Security Session'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // FULLY DYNAMIC SIDEBAR TABS DEFINITION
  const sidebarItems = [
    { key: 'dashboard', label: 'Dashboard Control', icon: LayoutDashboard, color: 'text-cyber-cyan' },
    { key: 'posts', label: 'Content Manager', icon: FileText, color: 'text-cyber-cyan' },
    { key: 'post-form', label: 'Create Content', icon: Plus, color: 'text-cyber-cyan' },
    { key: 'featured-games', label: 'Featured Games', icon: Gamepad2, color: 'text-cyber-cyan' },
    { key: 'featured-game-form', label: 'Add Featured Game', icon: Plus, color: 'text-cyber-cyan' },
    { key: 'videos', label: 'Video Archives', icon: Video, color: 'text-cyber-purple' },
    { key: 'video-form', label: 'Embed Streaming', icon: Code, color: 'text-cyber-purple' },
    { key: 'buttons', label: 'Global Buttons', icon: LinkIcon, color: 'text-cyber-purple' },
    { key: 'menus', label: 'Header Navigation', icon: ListOrdered, color: 'text-cyber-cyan' },
    { key: 'custom-pages', label: 'Custom Page Builder', icon: FileText, color: 'text-cyber-cyan' },
    { key: 'counters', label: 'Animated Counters', icon: Grid, color: 'text-cyber-magenta' },
    { key: 'footer', label: 'Footer Layout', icon: Grid, color: 'text-cyber-magenta' },
    { key: 'home-builder', label: 'Home Page Builder', icon: Sparkles, color: 'text-cyber-cyan' },
    { key: 'announcements', label: 'Announcements System', icon: Radio, color: 'text-pink-500' },
    { key: 'socials', label: 'Social Platforms', icon: Share2, color: 'text-cyber-purple' },
    { key: 'settings', label: 'Site Specifications', icon: Settings, color: 'text-cyber-cyan' },
    { key: 'maintenance', label: 'Maintenance Mode', icon: ShieldAlert, color: 'text-red-500' },
    { key: 'sponsor-ads', label: 'Sponsor Ads', icon: DollarSign, color: 'text-cyber-magenta' },
    { key: 'adsense', label: 'Google AdSense', icon: Cpu, color: 'text-amber-400' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-[#07070c] flex flex-col overflow-hidden text-gray-100 font-sans">
      {/* ANIMATED TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl flex items-center gap-3 font-display font-bold text-xs uppercase tracking-wider ${
            toast.type === 'success' ? 'bg-black/90 border-cyber-cyan text-cyber-cyan shadow-[0_0_25px_rgba(0,240,255,0.3)]' :
            toast.type === 'error' ? 'bg-black/90 border-cyber-magenta text-cyber-magenta shadow-[0_0_25px_rgba(255,0,85,0.3)]' :
            'bg-black/90 border-amber-400 text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* GLOWING ADMIN HEADER */}
      <header className="h-16 shrink-0 bg-black/90 backdrop-blur-md border-b border-cyber-cyan/15 px-4 md:px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 hidden md:block"
          >
            <Menu className="w-5 h-5 text-cyber-cyan" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-tr from-cyber-cyan to-cyber-magenta rounded-lg flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-[#07070c] rounded-md flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyber-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-sm md:text-base font-display font-black tracking-widest text-white uppercase text-glow leading-none">
                {settingsForm.siteName || 'GAMES TONIC'}
              </h1>
              <p className="text-[9px] text-cyber-cyan font-mono leading-none tracking-wider uppercase mt-1">OPERATIONS CONSOLE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] md:text-xs font-mono bg-white/5 px-2.5 py-1.5 border border-white/5 rounded-lg text-gray-400 hidden sm:inline-block">
            {user.email}
          </span>
          
          <button
            onClick={handleLogout}
            className="p-2 bg-cyber-magenta/10 border border-cyber-magenta/20 text-cyber-magenta rounded-lg hover:bg-cyber-magenta hover:text-white transition-all cursor-pointer"
            title="Terminate Credentials Uplink"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:border-cyber-cyan hover:text-cyber-cyan rounded-lg text-[10px] md:text-xs font-display tracking-wider cursor-pointer font-black transition-all"
          >
            RETURN TO APP
          </button>
        </div>
      </header>

      {/* ADMIN HUB CONTAINER CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* COLLAPSIBLE SIDEBAR */}
        <aside className={`shrink-0 bg-black/60 border-r border-[#1b1b2a] transition-all duration-300 flex flex-col justify-between overflow-y-auto ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex`}>
          <div className="p-4 space-y-1">
            <p className={`text-[9px] font-mono font-bold tracking-widest text-gray-500 uppercase px-2 mb-3 truncate transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Console Memory Maps
            </p>
            {sidebarItems.map((item) => {
              const active = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
                  className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left text-xs tracking-wider transition-all cursor-pointer border ${active ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan font-bold shadow-[inset_0_0_8px_rgba(0,240,255,0.05)]' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-[#1b1b2a] space-y-1">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 uppercase">
                <span>DATABASE STATUS</span>
                <span className="text-green-400 font-bold animate-pulse">● RTDB ACTIVE</span>
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE NAVIGATION TRAY */}
        <div className="md:hidden absolute bottom-4 right-4 z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black rounded-full shadow-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {mobileMenuOpen && (
            <div className="absolute bottom-16 right-0 w-52 bg-cyber-dark border border-white/10 rounded-xl shadow-2xl p-2.5 space-y-1 glass-panel">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key as any);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-gray-300 hover:bg-white/5"
                  >
                    <Icon className="w-4 h-4 text-cyber-cyan" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRIMARY ACTIVE INTERFACE SHEET */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#0a0a14] relative">
          
          {/* TAB 1: DASHBOARD AND STATISTICS OVERALL VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in max-w-6xl">
              <div>
                <h2 className="text-xl md:text-3xl font-display font-black text-white tracking-widest text-glow uppercase leading-none">Console Executive Monitor</h2>
                <p className="text-xs text-gray-400 mt-2">Dynamic real-time platform measurements retrieved instantly from dynamic database nodes.</p>
              </div>

              {/* STATS COUNTUP CARDS GRID */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                
                <div className="p-6 glass-panel border border-cyber-cyan/10 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyber-cyan/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                    <FileText className="w-24 h-24 text-cyber-cyan" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">DYNAMIC PUBLICATIONS</span>
                    <p className="text-3xl md:text-5xl font-display font-black text-cyber-cyan mt-1 text-glow">{stats.posts}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4">Total customized games, patch updates, and timeline streams.</p>
                </div>

                <div className="p-6 glass-panel border border-cyber-magenta/10 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyber-magenta/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Video className="w-24 h-24 text-cyber-magenta" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-black">STREAMING ARCHIVES</span>
                    <p className="text-3xl md:text-5xl font-display font-black text-cyber-magenta mt-1 text-glow-magenta">{stats.videos}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4">Active broadcast frames automatically rendered on client screens.</p>
                </div>

                <div className="p-6 glass-panel border border-cyber-cyan/10 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyber-cyan/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Layers className="w-24 h-24 text-cyber-cyan" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-bold">ASSET MODIFICATIONS</span>
                    <p className="text-3xl md:text-5xl font-display font-black text-cyber-cyan mt-1 text-glow">{stats.mods}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4">Total active modification scripts and realism graphics archives.</p>
                </div>

                <div className="p-6 glass-panel border border-white/5 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-white/10 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Grid className="w-24 h-24 text-gray-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">TAXONOMY CATEGORIES</span>
                    <p className="text-3xl md:text-5xl font-display font-black text-white mt-1">{stats.categories}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4">Active filter categories editable from specifications manager.</p>
                </div>

                <div className="p-6 glass-panel border border-cyber-cyan/10 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-cyber-cyan/30 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <ListOrdered className="w-24 h-24 text-cyber-cyan" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase">NAVIGATION MENUS</span>
                    <p className="text-3xl md:text-5xl font-display font-black text-cyber-cyan mt-1 text-glow">{stats.menus}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-4">Active header routes sorted by priorities instantly.</p>
                </div>

              </div>

              {/* QUICK LINKS BOARD */}
              <div className="p-6 glass-panel rounded-2xl space-y-4">
                <h3 className="font-display font-black text-white tracking-widest text-xs uppercase">Terminal Quick Access Hub</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => setActiveTab('post-form')} className="p-4 bg-white/5 border border-white/10 hover:border-cyber-cyan/30 rounded-xl transition-all cursor-pointer text-left space-y-1">
                    <p className="text-xs font-bold font-display text-white">Create New Post</p>
                    <p className="text-[10px] text-gray-400">Launch dynamic publishing wizard form.</p>
                  </button>
                  <button onClick={() => setActiveTab('video-form')} className="p-4 bg-white/5 border border-white/10 hover:border-cyber-purple/30 rounded-xl transition-all cursor-pointer text-left space-y-1">
                    <p className="text-xs font-bold font-display text-cyber-purple">Embed Video Broadcast</p>
                    <p className="text-[10px] text-gray-400">Add dynamic frame code blocks.</p>
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="p-4 bg-white/5 border border-white/10 hover:border-cyber-magenta/30 rounded-xl transition-all cursor-pointer text-left space-y-1">
                    <p className="text-xs font-bold font-display text-cyber-magenta">Change Site Meta</p>
                    <p className="text-[10px] text-gray-400">Modify site name, scripts, analytics and SEO.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FEATURED GAMES INDEX LIST */}
          {activeTab === 'featured-games' && (
            <div className="space-y-6 animate-fade-in max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">
                    FEATURED GAMES & SPECS INDEX
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Manage game titles, developer info, download links, and storage weights displayed on user homepage</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFeaturedGameId(null);
                    setFeaturedGameForm({
                      gameName: '',
                      developerName: '',
                      developerEmail: '',
                      developerWebsite: '',
                      gameLink: '',
                      promptLink: '',
                      imageLink: '',
                      status: 'published',
                      position: 0
                    });
                    setActiveTab('featured-game-form');
                  }}
                  className="px-4 py-2.5 bg-cyber-cyan text-black font-display font-bold text-xs tracking-wider rounded-xl hover:brightness-110 hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD FEATURED GAME</span>
                </button>
              </div>

              {featuredGames.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-sans">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyber-cyan animate-pulse" />
                  <p className="text-sm">No Featured Games added yet.</p>
                  <p className="text-xs text-gray-600 mt-1">Click "ADD FEATURED GAME" to create your first game specs item.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredGames.map((game) => (
                    <div key={game.id} className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-cyber-cyan/40 transition-all">
                      <div className="relative aspect-video bg-black/60 overflow-hidden">
                        <img 
                          src={game.imageLink || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'} 
                          alt={game.gameName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        {game.promptLink && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-cyber-cyan/30 text-cyber-cyan font-mono text-[10px] font-bold rounded-lg uppercase shadow">
                            PROMPT LINKED
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-bold text-white text-base uppercase tracking-wider line-clamp-1">
                            {game.gameName}
                          </h3>
                          <div className="mt-2 space-y-1 text-xs text-gray-400 font-sans">
                            <p><strong className="text-gray-300">Developer:</strong> {game.developerName || 'N/A'}</p>
                            {game.developerEmail && <p><strong className="text-gray-300">Email:</strong> {game.developerEmail}</p>}
                            {game.developerWebsite && (
                              <p className="truncate">
                                <strong className="text-gray-300">Website:</strong>{' '}
                                <a href={game.developerWebsite} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">
                                  {game.developerWebsite}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <a 
                            href={game.gameLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-3 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan rounded-lg text-xs font-mono font-bold hover:bg-cyber-cyan hover:text-black transition-all flex items-center gap-1.5"
                          >
                            <span>Game Link</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditFeaturedGame(game)}
                              className="p-2 bg-white/5 hover:bg-cyber-cyan/20 text-gray-300 hover:text-cyber-cyan border border-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Edit Game Specs"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFeaturedGame(game.id)}
                              className="p-2 bg-white/5 hover:bg-cyber-magenta/20 text-gray-300 hover:text-cyber-magenta border border-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Game Specs"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: FEATURED GAME FORM */}
          {activeTab === 'featured-game-form' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">
                    {selectedFeaturedGameId ? 'EDIT FEATURED GAME FORM' : 'CREATE FEATURED GAME FORM'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Specify Game Name, Game Weight, Developer Specs, Game Link, and Cover Image</p>
                </div>
                <button
                  onClick={() => setActiveTab('featured-games')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-display font-bold rounded-xl transition-all cursor-pointer"
                >
                  CANCEL / BACK TO LIST
                </button>
              </div>

              <form onSubmit={handleFeaturedGameSubmit} className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Field 1: Game Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Game Name <span className="text-cyber-magenta">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={featuredGameForm.gameName}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, gameName: e.target.value })}
                      placeholder="e.g. Cyberpunk 2077: Phantom Liberty"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 2: Prompt Link */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Prompt Link (URL)
                    </label>
                    <input
                      type="url"
                      value={featuredGameForm.promptLink || ''}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, promptLink: e.target.value })}
                      placeholder="e.g. https://prompt-page-link.com"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 3: Developer Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Developer Name
                    </label>
                    <input
                      type="text"
                      value={featuredGameForm.developerName}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, developerName: e.target.value })}
                      placeholder="e.g. CD Projekt Red / Rockstar Games"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 4: Developer Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Developer Email
                    </label>
                    <input
                      type="email"
                      value={featuredGameForm.developerEmail}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, developerEmail: e.target.value })}
                      placeholder="e.g. dev@gamestudio.com"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 5: Developer Website */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Developer Website
                    </label>
                    <input
                      type="url"
                      value={featuredGameForm.developerWebsite}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, developerWebsite: e.target.value })}
                      placeholder="e.g. https://www.developer.com"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 6: Link to a Game */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Link to a Game (Download / Store Link) <span className="text-cyber-magenta">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={featuredGameForm.gameLink}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, gameLink: e.target.value })}
                      placeholder="e.g. https://store.steampowered.com/app/271590"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  {/* Field 7: Link to an Image */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Link to an Image (Cover / Banner Image URL) <span className="text-cyber-magenta">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={featuredGameForm.imageLink}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, imageLink: e.target.value })}
                      placeholder="e.g. https://images.unsplash.com/photo-1542751371-adc38448a05e"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                    {featuredGameForm.imageLink && (
                      <div className="mt-3 relative aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={featuredGameForm.imageLink} 
                          alt="Image Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Field 8: Category & Version */}
                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Category
                    </label>
                    <input
                      type="text"
                      value={featuredGameForm.category || 'FEATURED GAME'}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, category: e.target.value })}
                      placeholder="e.g. FEATURED GAME / ACTION / RPG"
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-display font-bold text-gray-300 uppercase tracking-wider">
                      Version
                    </label>
                    <input
                      type="text"
                      value={featuredGameForm.version || '1.0'}
                      onChange={(e) => setFeaturedGameForm({ ...featuredGameForm, version: e.target.value })}
                      placeholder="e.g. 1.0 / 2.1.4"
                      className="w-full px-4 py-3 bg-black/60 border border-cyber-cyan focus:outline-none text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('featured-games')}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-cyber-cyan text-black font-display font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{selectedFeaturedGameId ? 'UPDATE FEATURED GAME' : 'SAVE FEATURED GAME'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: POSTS LIST / CRUD TABLE */}
          {activeTab === 'posts' && (
            <div className="space-y-6 animate-fade-in max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Content Registry Index</h2>
                  <p className="text-xs text-gray-400 mt-1">Select publications, modify records, or purge items from active memory</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPostId(null);
                    setPostForm({
                      type: 'games',
                      title: '',
                      slug: '',
                      thumbnail: '',
                      buttonText: '',
                      buttonLink: '',
                      description: '',
                      shortDescription: '',
                      category: '',
                      tags: [],
                      author: 'Admin',
                      publishDate: new Date().toISOString().split('T')[0],
                      status: 'published',
                      featured: false,
                      extraLink: '',
                      viewsCount: 0
                    });
                    setActiveTab('post-form');
                  }}
                  className="px-4 py-2.5 bg-cyber-cyan text-black font-display font-bold text-xs tracking-wider rounded-xl hover:brightness-110 hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD CONTENT</span>
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-sans">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyber-cyan animate-pulse" />
                  <p className="text-sm">No recorded contents found in Database.</p>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-white/5 text-gray-400 font-display font-bold uppercase tracking-wider border-b border-white/10">
                          <th className="p-4">Visual Icon</th>
                          <th className="p-4">Title & Details</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4">
                              <img
                                src={post.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80'}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 object-cover rounded-lg border border-white/10 bg-black/60"
                              />
                            </td>
                            <td className="p-4 truncate max-w-[240px]">
                              <p className="font-bold text-white text-sm truncate" title={post.title}>{post.title}</p>
                              <div className="flex gap-1.5 items-center mt-1.5">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest bg-cyber-cyan/15 text-cyber-cyan uppercase font-bold">
                                  [{post.type}]
                                </span>
                                {post.featured && (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest bg-cyber-magenta/15 text-cyber-magenta uppercase font-bold">
                                    ★ FEATURED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono text-gray-400 uppercase font-black">{post.category || 'N/A'}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider ${post.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                                {post.status?.toUpperCase() || 'PUBLISHED'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="p-2 bg-cyber-cyan/10 border border-cyber-cyan/20 hover:bg-cyber-cyan hover:text-black rounded-lg text-cyber-cyan cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-2 bg-cyber-magenta/10 border border-cyber-magenta/20 hover:bg-cyber-magenta hover:text-white rounded-lg text-cyber-magenta cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE / EDIT POST FORM */}
          {activeTab === 'post-form' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">
                  {selectedPostId ? 'Edit Content Details' : 'Curate New Content Record'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Specify layout, metadata, tags, cover assets and direct click buttons.</p>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-6 font-sans text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Content Class Node</label>
                    <select
                      value={postForm.type}
                      onChange={(e) => setPostForm({ ...postForm, type: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none"
                    >
                      <option value="games">Gaming Core Index (Games)</option>
                      <option value="mods">Modification Package (Mods)</option>
                      <option value="updates">Release Patch Log (Updates)</option>
                      <option value="announcements">Platform Announcements</option>
                      <option value="events">Live Match Event (Events)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Display Title</label>
                    <input
                      type="text"
                      required
                      value={postForm.title}
                      onChange={(e) => handlePostTitleChange(e.target.value)}
                      placeholder="e.g. ULTRA REALISM GRAPHICS PACK V2"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Dynamic Route URL Slug</label>
                    <input
                      type="text"
                      required
                      value={postForm.slug}
                      onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                      placeholder="ultra-realism-graphics-pack"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Select Active Category</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {safeGetArray<string>(settingsForm.categories).map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Content Author</label>
                    <input
                      type="text"
                      value={postForm.author}
                      onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Contact Email</label>
                    <input
                      type="email"
                      value={postForm.authorEmail || ''}
                      onChange={(e) => setPostForm({ ...postForm, authorEmail: e.target.value })}
                      placeholder="author@example.com"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Official Profile / Website</label>
                    <input
                      type="url"
                      value={postForm.authorWebsite || ''}
                      onChange={(e) => setPostForm({ ...postForm, authorWebsite: e.target.value })}
                      placeholder="https://authorwebsite.com"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Release Timestamp</label>
                    <input
                      type="date"
                      value={postForm.publishDate}
                      onChange={(e) => setPostForm({ ...postForm, publishDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* VISUAL LAYOUT ASSETS */}
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-cyber-purple font-display font-medium text-xs tracking-wider uppercase">
                    <Laptop className="w-4 h-4 text-cyber-cyan" />
                    <span>Visual Assets Configuration (No Upload - URL links only)</span>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1 font-bold uppercase">Thumbnail / Cover Image URL (Single Image Only)</label>
                    <input
                      type="url"
                      value={postForm.thumbnail}
                      onChange={(e) => setPostForm({ ...postForm, thumbnail: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>
                </div>

                {/* CALL TO ACTION BUTTON FIELDS */}
                <div className="p-5 bg-[#0e0e14] border border-cyber-cyan/10 rounded-2xl space-y-4">
                  <p className="text-xs font-display font-black text-cyber-cyan uppercase tracking-wider">CURATE DIRECT CTA BUTTONS</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Custom Button Text</label>
                      <input
                        type="text"
                        value={postForm.buttonText}
                        onChange={(e) => setPostForm({ ...postForm, buttonText: e.target.value })}
                        placeholder="e.g. GET DOWNLOAD LINK"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Custom Target Action URL</label>
                      <input
                        type="url"
                        value={postForm.buttonLink}
                        onChange={(e) => setPostForm({ ...postForm, buttonLink: e.target.value })}
                        placeholder="e.g. https://github.com/or-download-file..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Link Status (Enable / Disable)</label>
                      <select
                        value={postForm.linkEnabled !== false ? 'enabled' : 'disabled'}
                        onChange={(e) => setPostForm({ ...postForm, linkEnabled: e.target.value === 'enabled' })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-cyan"
                      >
                        <option value="enabled">Link Enabled (Show Button if Link exists)</option>
                        <option value="disabled">Link Disabled (Hide Button completely)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SYNOPSIS EXCERPT */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">One-Sentence Dynamic Teaser</label>
                  <input
                    type="text"
                    required
                    value={postForm.shortDescription}
                    onChange={(e) => setPostForm({ ...postForm, shortDescription: e.target.value })}
                    placeholder="Short 1-sentence resume displayed on browsing directories..."
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-cyan focus:outline-none text-xs"
                  />
                </div>

                {/* MAIN CONTENT BLOCK */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Platform Curated Specifications Markdown</label>
                  <textarea
                    rows={8}
                    required
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                    placeholder="Provide full features, changelogs, guidelines, or specs in pure markdown/HTML..."
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:outline-none focus:border-cyber-cyan font-mono text-xs resize-none"
                  />
                </div>

                {/* TAXONOMY CHECKLISTS */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono uppercase text-gray-400 font-bold">Link Query Tags</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-black/60 border border-white/5 rounded-xl max-h-[140px] overflow-y-auto">
                    {safeGetArray<string>(settingsForm.tags).map((t, idx) => {
                      const enabled = postForm.tags?.includes(t);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleTagsCheckboxToggle(t)}
                          className={`text-[10px] px-3 py-1 rounded-lg border transition-all cursor-pointer font-bold uppercase font-mono ${enabled ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple' : 'bg-transparent border-white/5 text-gray-400 hover:border-white/25'}`}
                        >
                          #{t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VISUAL CLASSIFICATION FEAT/STATUS OVERRIDES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Promote as Featured Content</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Anchors item at the absolute top hero grid.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!postForm.featured}
                      onChange={(e) => setPostForm({ ...postForm, featured: e.target.checked })}
                      className="w-4 h-4 accent-cyber-cyan cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-cyber-cyan block">Status Visibility</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Determine live database index layout.</span>
                    </div>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm({ ...postForm, status: e.target.value as any })}
                      className="px-3 py-1 bg-black/60 border border-white/10 rounded-lg text-xs"
                    >
                      <option value="published">Visible (Published)</option>
                      <option value="draft">Invisible (Draft)</option>
                    </select>
                  </div>
                </div>

                {/* EXECUATOR BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  {selectedPostId ? 'COMMIT MEMORY UPDATES' : 'DISPATCH NEW PUBLICATION'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: VIDEOS LISTING */}
          {activeTab === 'videos' && (
            <div className="space-y-6 animate-fade-in max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Video Broadcast Registry</h2>
                  <p className="text-xs text-gray-400 mt-1">Embed trailers, dynamic layouts and live patch correspondences</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedVideoId(null);
                    setVideoForm({ title: '', thumbnail: '', embedCode: '', description: '', category: '', featured: false, position: 0 });
                    setActiveTab('video-form');
                  }}
                  className="px-4 py-2.5 bg-cyber-purple text-white font-display font-bold text-xs tracking-wider rounded-xl hover:brightness-110 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>EMBED BROADCAST</span>
                </button>
              </div>

              {videos.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-gray-500 font-sans">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyber-purple animate-pulse" />
                  <p className="text-sm">No streaming embeds found in active database nodes.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.sort((a,b) => (a.position || 0) - (b.position || 0)).map((video) => (
                    <div key={video.id} className="p-5 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between space-y-4">
                      
                      <div className="relative aspect-video rounded-xl overflow-hidden [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:aspect-video filter drop-shadow-md bg-black/80">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 bg-[#000]" dangerouslySetInnerHTML={{ __html: video.embedCode || '' }} />
                        )}
                        {video.featured && (
                          <span className="absolute top-2 right-2 text-[9px] font-bold text-black bg-cyber-purple px-2 py-0.5 rounded uppercase">★ Curated Video</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-display font-bold text-white text-base truncate">{video.title}</h3>
                          <span className="text-[10px] uppercase font-mono font-bold text-cyber-purple">Pos: {video.position || 0}</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{video.description || 'No descriptive excerpt entered.'}</p>
                      </div>

                      <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleEditVideo(video)}
                          className="px-3.5 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan/25 text-cyber-cyan rounded-lg text-xs"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="px-3.5 py-1.5 bg-cyber-magenta/10 border border-cyber-magenta/25 text-cyber-magenta rounded-lg text-xs"
                        >
                          DELETE
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: VIDEO FORM */}
          {activeTab === 'video-form' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">
                  {selectedVideoId ? 'Edit Broadcast Embed' : 'Route Direct Video Embed'}
                </h2>
                <p className="text-xs text-gray-400 mt-1">Paste standard iframe code triggers from YouTube, Twitch or shorts portals directly.</p>
              </div>

              <form onSubmit={handleVideoSubmit} className="space-y-6 font-sans text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Video Clip Heading</label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      placeholder="e.g. GRAND THEFT AUTO VI OFFICIAL EXTENDED LOGS"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-purple focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Optional Thumbnail Image URL</label>
                    <input
                      type="url"
                      value={videoForm.thumbnail || ''}
                      onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-purple focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Priority Array Position</label>
                    <input
                      type="number"
                      value={videoForm.position}
                      onChange={(e) => setVideoForm({ ...videoForm, position: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:border-cyber-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Video Category / Tag label</label>
                    <input
                      type="text"
                      value={videoForm.category || ''}
                      onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                      placeholder="e.g. Official Trailer"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Promote Clip</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Highlight video in primary grids.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!videoForm.featured}
                      onChange={(e) => setVideoForm({ ...videoForm, featured: e.target.checked })}
                      className="w-4 h-4 accent-cyber-purple cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Iframe Embed Code Block</label>
                  <textarea
                    rows={4}
                    required
                    value={videoForm.embedCode}
                    onChange={(e) => setVideoForm({ ...videoForm, embedCode: e.target.value })}
                    placeholder='e.g. <iframe width="560" height="315" src="https://www.youtube.com/embed/..." ...></iframe>'
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:outline-none focus:border-cyber-purple font-mono text-xs resize-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 font-mono">Website automatically parses and displays videos from pasted embed codes.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1.5 font-bold">Video Context Descriptive Note</label>
                  <textarea
                    rows={3}
                    value={videoForm.description || ''}
                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                    placeholder="Short summary detailing content timeline..."
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                {/* VIDEO ACTION LINK SYSTEM FIELDS */}
                <div className="p-5 bg-[#0e0e14] border border-cyber-purple/10 rounded-2xl space-y-4">
                  <p className="text-xs font-display font-black text-cyber-purple uppercase tracking-wider">CURATE VIDEO ACTION LINK</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Custom Button Text</label>
                      <input
                        type="text"
                        value={videoForm.buttonText || ''}
                        onChange={(e) => setVideoForm({ ...videoForm, buttonText: e.target.value })}
                        placeholder="e.g. WATCH FULL EVENT"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Custom Target Action URL</label>
                      <input
                        type="url"
                        value={videoForm.buttonLink || ''}
                        onChange={(e) => setVideoForm({ ...videoForm, buttonLink: e.target.value })}
                        placeholder="e.g. https://youtube.com/watch?v=..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-purple"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Link Status (Enable / Disable)</label>
                      <select
                        value={videoForm.linkEnabled !== false ? 'enabled' : 'disabled'}
                        onChange={(e) => setVideoForm({ ...videoForm, linkEnabled: e.target.value === 'enabled' })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyber-purple"
                      >
                        <option value="enabled">Link Enabled (Show Button if Link exists)</option>
                        <option value="disabled">Link Disabled (Hide Button completely)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-cyber-purple text-white font-display font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg cursor-pointer transition-all disabled:opacity-50"
                >
                  {selectedVideoId ? 'COMMIT VIDEO MEMORY' : 'DISPATCH MOUNT BROADSHEET'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: GLOBAL BUTTON MANAGEMENT */}
          {activeTab === 'buttons' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Dynamic Core Action Buttons</h2>
                <p className="text-xs text-gray-400 mt-1">Admin controls every main CTA button and layout redirects on Games Tonic.</p>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1.5 font-bold">Choose target buttons path</label>
                  <select
                    value={selectedButtonKey}
                    onChange={(e) => setSelectedButtonKey(e.target.value)}
                    className="px-4 py-2 bg-black/60 border border-white/10 text-xs text-cyber-cyan font-bold rounded-xl focus:outline-none"
                  >
                    <option value="exploreNow">Hero Main Action (exploreNow)</option>
                    <option value="latestUpdates">Hero Sub Action (latestUpdates)</option>
                    <option value="joinCommunity">Footer Portal Badge (joinCommunity)</option>
                    <option value="contact">Newsletter Contact Hook (contact)</option>
                    {settingsForm.buttons && Object.keys(settingsForm.buttons)
                      .filter(k => !['exploreNow', 'latestUpdates', 'joinCommunity', 'contact'].includes(k))
                      .map(k => (
                        <option key={k} value={k}>Custom Button: {settingsForm.buttons![k]?.text || k} ({k})</option>
                      ))
                    }
                    <option value="NEW_BUTTON">+ CREATE NEW BUTTON...</option>
                  </select>
                </div>

                {selectedButtonKey === 'NEW_BUTTON' && (
                  <div className="p-4 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-xl space-y-2 max-w-md">
                    <label className="block text-[10px] uppercase font-mono text-cyber-cyan font-bold">New Custom Button Key Code (No spaces, alphanumeric)</label>
                    <input
                      type="text"
                      required
                      value={newButtonKey}
                      onChange={(e) => setNewButtonKey(e.target.value)}
                      placeholder="e.g. claimGift, viewCatalog"
                      className="w-full px-4 py-2.5 bg-black/60 border border-cyber-cyan/30 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              <form onSubmit={handleButtonSubmit} className="space-y-6 font-sans text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Button Plain Text Display</label>
                    <input
                      type="text"
                      required
                      value={buttonForm.text}
                      onChange={(e) => setButtonForm({ ...buttonForm, text: e.target.value })}
                      placeholder="e.g. GET DOWNLOAD STREAM"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Target Redirection URL Page ID</label>
                    <input
                      type="text"
                      required
                      value={buttonForm.link}
                      onChange={(e) => setButtonForm({ ...buttonForm, link: e.target.value })}
                      placeholder="e.g. content, contact, or https://..."
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Lucide Vector Icon Title Class</label>
                    <select
                      value={buttonForm.icon}
                      onChange={(e) => setButtonForm({ ...buttonForm, icon: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl"
                    >
                      <option value="ArrowRight">ArrowRight</option>
                      <option value="Users">Users</option>
                      <option value="Mail">Mail</option>
                      <option value="Download">Download</option>
                      <option value="Sparkles">Sparkles</option>
                      <option value="Layers">Layers</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Open link in new browser tab</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Enables target=_blank commands inside iframe layout.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!buttonForm.openInNewTab}
                      onChange={(e) => setButtonForm({ ...buttonForm, openInNewTab: e.target.checked })}
                      className="w-4 h-4 accent-cyber-cyan cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl md:col-span-2">
                    <div>
                      <span className="text-xs font-bold text-white block">Status Visibility (Active Toggle)</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Whether this action button compiles in layout.</span>
                    </div>
                    <select
                      value={buttonForm.status || 'active'}
                      onChange={(e) => setButtonForm({ ...buttonForm, status: e.target.value as any })}
                      className="px-4 py-1 bg-black/60 border border-white/10 rounded-lg text-xs"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-cyber-pink bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase rounded-xl hover:brightness-110 cursor-pointer"
                  >
                    SAVE BUTTON PARAMETERS
                  </button>

                  {!['exploreNow', 'latestUpdates', 'joinCommunity', 'contact', 'NEW_BUTTON'].includes(selectedButtonKey) && (
                    <button
                      type="button"
                      onClick={handleDeleteButton}
                      className="px-6 py-3 bg-cyber-magenta/15 border border-cyber-magenta/30 hover:bg-cyber-magenta/30 text-cyber-magenta font-display font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition"
                    >
                      DELETE CUSTOM BUTTON
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: HEADER MENU MANAGEMENT */}
          {activeTab === 'menus' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Header Navigation routing</h2>
                <p className="text-xs text-gray-400 mt-1">Create, Edit, Sort, and Delete dynamic header paths on Games Tonic Hub on the fly.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Form column */}
                <form onSubmit={handleMenuSubmit} className="lg:col-span-1 p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4 text-xs font-sans">
                  <p className="text-xs font-display font-black text-white uppercase tracking-wider block border-b border-white/5 pb-2">
                    {selectedMenuId ? 'Edit Menu Node' : 'Initialize New Routing Path'}
                  </p>
                  
                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Route Path Name</label>
                    <input
                      type="text"
                      required
                      value={menuForm.name}
                      onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                      placeholder="e.g. TIMELINES"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Navigation Target Page Link ID</label>
                    <input
                      type="text"
                      required
                      value={menuForm.link}
                      onChange={(e) => setMenuForm({ ...menuForm, link: e.target.value })}
                      placeholder="e.g. content, mods, upcoming, contact"
                      className="w-full px-3 py-2 bg-[#000]/60 border border-white/10 rounded-lg focus:border-cyber-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Lucide Icon name</label>
                    <select
                      value={menuForm.icon}
                      onChange={(e) => setMenuForm({ ...menuForm, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-gray-300"
                    >
                      <option value="Layers">Layers</option>
                      <option value="FileText">FileText</option>
                      <option value="Video">Video</option>
                      <option value="Globe">Globe</option>
                      <option value="Mail">Mail</option>
                      <option value="Calendar">Calendar</option>
                      <option value="Sparkles">Sparkles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase text-gray-400 mb-1">Ordering Position index (Sort Order)</label>
                    <input
                      type="number"
                      value={menuForm.position}
                      onChange={(e) => setMenuForm({ ...menuForm, position: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/25 rounded-lg">
                    <span className="text-gray-400">Visibility status</span>
                    <input
                      type="checkbox"
                      checked={menuForm.visibility !== false}
                      onChange={(e) => setMenuForm({ ...menuForm, visibility: e.target.checked })}
                      className="w-3.5 h-3.5 accent-cyber-cyan cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2 bg-cyber-cyan text-black font-display font-black rounded-lg">
                      {selectedMenuId ? 'UPDATE' : 'COMPILE PATH'}
                    </button>
                    {selectedMenuId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMenuId(null);
                          setMenuForm({ name: '', link: '', icon: 'Layers', position: 0, visibility: true });
                        }}
                        className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {/* List column */}
                <div className="lg:col-span-2 bg-[#000]/20 border border-white/5 rounded-2xl p-5 space-y-4">
                  <p className="text-xs font-display font-black text-cyber-cyan uppercase tracking-wider block">Active Header Routing Maps</p>
                  
                  {(!settingsForm.menus || settingsForm.menus.length === 0) ? (
                    <p className="text-xs text-gray-500 font-sans">Header navigation uses base site settings. Create paths above to inject dynamic headers.</p>
                  ) : (
                    <div className="space-y-3">
                      {settingsForm.menus.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3.5 bg-white/[0.01] border border-white/5 rounded-xl hover:border-cyber-cyan/20 transition-all">
                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-cyber-cyan" />
                            <div>
                              <p className="text-xs font-bold font-display text-white">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-mono tracking-wider">Map: /{item.link} | Pos: {item.position || 0}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditMenu(item)}
                              className="px-2.5 py-1 bg-cyber-cyan/15 rounded text-cyber-cyan hover:bg-cyber-cyan hover:text-black font-display font-black text-[10px]"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={() => handleDeleteMenu(item.id)}
                              className="px-2.5 py-1 bg-cyber-magenta/15 rounded text-cyber-magenta hover:bg-cyber-magenta hover:text-white font-display font-black text-[10px]"
                            >
                              PURGE
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 8: FOOTER LAYOUT */}
          {activeTab === 'footer' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Curate Footer Parameters</h2>
                <p className="text-xs text-gray-400 mt-1">Amend dynamic descriptions, active copywright metadata and information credentials.</p>
              </div>

              <form onSubmit={handleFooterSubmit} className="space-y-6 font-sans text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Standard Copyright Line</label>
                    <input
                      type="text"
                      required
                      value={footerForm.copyright}
                      onChange={(e) => setFooterForm({ ...footerForm, copyright: e.target.value })}
                      placeholder="e.g. © 2026 Games Tonic. All rights reserved."
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Site Footer Tagline Summary</label>
                    <input
                      type="text"
                      value={footerForm.text}
                      onChange={(e) => setFooterForm({ ...footerForm, text: e.target.value })}
                      placeholder="e.g. CONNECTING GAMING CHANNELS IN REALTIME"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Footer Informational Excerpt (About Us column override)</label>
                    <textarea
                      rows={4}
                      required
                      value={footerForm.about}
                      onChange={(e) => setFooterForm({ ...footerForm, about: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Footer Support Guidelines (Reach Us column override)</label>
                    <textarea
                      rows={4}
                      required
                      value={footerForm.support}
                      onChange={(e) => setFooterForm({ ...footerForm, support: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase"
                >
                  SAVE FOOTER SPECIFICATIONS
                </button>
              </form>
            </div>
          )}

          {/* TAB 10: HOME PAGE BUILDER */}
          {activeTab === 'home-builder' && (
            <div className="space-y-8 animate-fade-in max-w-5xl text-xs">
              {/* HERO CONFIGURATION CARD */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-left">
                <h2 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyber-cyan text-glow" />
                  <span>1. HERO SEGMENT CONTROLLER</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Configure entry display headings, subtitles and immersive backdrop effect.</p>
                
                <form onSubmit={handleHeroSubmit} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Title Heading Text</label>
                      <input
                        type="text"
                        required
                        value={heroForm.title}
                        onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Subtitle brief highlight</label>
                      <input
                        type="text"
                        required
                        value={heroForm.subtitle}
                        onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Visual backdrop effect selection</label>
                      <select
                        value={heroForm.backgroundEffect}
                        onChange={(e) => setHeroForm({ ...heroForm, backgroundEffect: e.target.value as any })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white"
                      >
                        <option value="particles">Cybernetic Particles</option>
                        <option value="matrix">Digital Matrix Rain</option>
                        <option value="waves">Cosmic Waveform</option>
                        <option value="stars">Twinkling Stardust Grid</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-125 transition-all w-full md:w-auto"
                      >
                        COMMIT HERO SECTOR
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* HOMEPAGE SECTION BUILDER */}
              <div className="space-y-4">
                <div className="text-left">
                  <h2 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyber-purple" />
                    <span>2. HOMEPAGE SECTIONS CONFIGURATION (CREATE / SORT / RENDER)</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Add titles, subtitles, custom CTA link keys, toggle status and reorder positions for each catalog grid section. All sections can be sorted in realtime with zero latency.
                  </p>
                </div>

                <div className="space-y-4">
                  {(!settingsForm.homeSections || settingsForm.homeSections.length === 0) ? (
                    <div className="p-6 bg-white/[0.01] border border-white/5 rounded-xl text-center space-y-3">
                      <p className="text-xs text-gray-400 italic">No custom section instances found in database settings node.</p>
                      <button
                        type="button"
                        onClick={async () => {
                          const defaults = [
                            { id: 'sec_1', key: 'games', title: 'LATEST CONTENT', subtitle: 'Explore official indexes, system requirements & specifications', badge: 'CATALOGUE ENGINE', btnText: 'BROWSE ALL', btnLink: '#', visible: true, position: 1 },
                            { id: 'sec_2', key: 'mods', title: 'LATEST GAMING MODS', subtitle: 'Upgrade game script, visual shaders and gameplay features', badge: 'REVISIONS & SOURCE', btnText: 'EXPLORE MODS', btnLink: '#', visible: true, position: 2 },
                            { id: 'sec_3', key: 'videos', title: 'VIDEO BROADCAST CENTER', subtitle: 'Premium streaming highlights, visual overviews and video catalogs', badge: 'PREMIUM CHANNELS', btnText: 'WATCH MORE', btnLink: '#', visible: true, position: 3 },
                            { id: 'sec_5', key: 'upcoming', title: 'UPCOMING EVENTS', subtitle: 'Live releases, virtual campaigns and community competitions', badge: 'BROADCAST HORIZONS', btnText: 'VIEW TIMELINE', btnLink: '#', visible: true, position: 4 }
                          ];
                          setIsLoading(true);
                          try {
                            const final = { ...settingsForm, homeSections: defaults };
                            await set(dbRef(db, 'settings'), final);
                            setSettingsForm(final);
                            setSiteSettings(final);
                            alert("Homepage sections list populated successfully.");
                          } catch(e: any) {
                            alert("Hydrating failed: " + e.message);
                          }
                          setIsLoading(false);
                        }}
                        className="px-4 py-2 bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan font-bold tracking-wider hover:bg-cyber-cyan/35 rounded-lg uppercase"
                      >
                        HYDRATE SECTIONS DIRECTORY
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {settingsForm.homeSections.map((sec, idx) => {
                        return (
                          <div key={sec.id} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-all font-sans text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-cyber-cyan bg-cyber-cyan/10 px-2 py-1 rounded">
                                  [{sec.key.toUpperCase()}]
                                </span>
                                <div>
                                  <h4 className="text-white font-display text-sm font-bold">{sec.title || 'Untitled Section'}</h4>
                                  <p className="text-[10px] text-gray-400">Position rank: <strong className="text-white">{sec.position}</strong> / Display Order</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end md:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleReorderHomeSection(sec.key, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 px-2 text-white bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded cursor-pointer transition"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-white" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReorderHomeSection(sec.key, 'down')}
                                  disabled={idx === settingsForm.homeSections!.length - 1}
                                  className="p-1 px-2 text-white bg-white/5 hover:bg-white/10 disabled:opacity-20 border border-white/10 rounded cursor-pointer transition"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-white" />
                                </button>

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <span className="text-[10px] font-mono font-bold mr-1 text-gray-400">ENABLE:</span>
                                <input
                                  type="checkbox"
                                  checked={sec.visible !== false}
                                  onChange={(e) => {
                                    const updated = { ...sec, visible: e.target.checked };
                                    handleHomeSectionSave(updated);
                                  }}
                                  className="h-4 w-4 bg-black/50 border-white/10 text-cyber-cyan rounded cursor-pointer"
                                />

                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteHomeSection(sec.id)}
                                  className="p-1 px-2 text-cyber-magenta hover:bg-cyber-magenta/20 hover:text-white border border-cyber-magenta/30 rounded cursor-pointer transition text-[10px] font-mono font-bold uppercase"
                                  title="Delete Section"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5 text-xs text-left">
                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">Section title</label>
                                <input
                                  type="text"
                                  value={sec.title || ''}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], title: e.target.value };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">Subtitle brief</label>
                                <input
                                  type="text"
                                  value={sec.subtitle || ''}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], subtitle: e.target.value };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">Badge tag</label>
                                <input
                                  type="text"
                                  value={sec.badge || ''}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], badge: e.target.value };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">CTA click text</label>
                                <input
                                  type="text"
                                  value={sec.btnText || ''}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], btnText: e.target.value };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">CTA target destination link</label>
                                <input
                                  type="text"
                                  value={sec.btnLink || ''}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], btnLink: e.target.value };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] uppercase font-mono text-gray-400 mb-1 font-bold">Action Buttons</label>
                                <select
                                  value={sec.enableActionButtons !== false ? 'enabled' : 'disabled'}
                                  onChange={(e) => {
                                    const list = [...settingsForm.homeSections!];
                                    const sIdx = list.findIndex(s => s.id === sec.id);
                                    if (sIdx !== -1) {
                                      list[sIdx] = { ...list[sIdx], enableActionButtons: e.target.value === 'enabled' };
                                      setSettingsForm({ ...settingsForm, homeSections: list });
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 rounded text-white font-sans text-xs"
                                >
                                  <option value="enabled">Buttons Enabled (Visible)</option>
                                  <option value="disabled">Buttons Disabled (Hidden)</option>
                                </select>
                              </div>

                              <div className="flex items-end shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => handleHomeSectionSave(sec)}
                                  className="px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-cyber-cyan hover:text-black font-display font-black tracking-widest text-[9px] uppercase rounded transition w-full cursor-pointer"
                                >
                                  SAVE REVISION
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* NEW HOMEPAGE SECTION CREATOR CONTAINER */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-left">
                <h2 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyber-cyan text-glow" />
                  <span>3. NEW HOMEPAGE SECTION CREATOR</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">Create a brand-new dynamic content grid on the homepage mapped to a key section block.</p>
                
                <form onSubmit={handleCreateHomeSection} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Section Key Mapping</label>
                      <select
                        value={newSectionForm.key}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, key: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      >
                        <option value="games">Games Catalog (games)</option>
                        <option value="mods">Gaming Mods (mods)</option>
                        <option value="videos">Video Center (videos)</option>
                        <option value="upcoming">Upcoming Events (upcoming)</option>
                        <option value="trending">Trending Matrix (trending)</option>
                        <option value="stats">Stats Counters (stats)</option>
                        <option value="newsletter">Newsletter Form (newsletter)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Section Title Heading</label>
                      <input
                        type="text"
                        required
                        value={newSectionForm.title}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, title: e.target.value })}
                        placeholder="e.g. SPECIAL EXPANSIONS"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Subtitle brief highlight</label>
                      <input
                        type="text"
                        value={newSectionForm.subtitle}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, subtitle: e.target.value })}
                        placeholder="e.g. Inspect the latest community-contributed patch releases instantly"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Badge tag label</label>
                      <input
                        type="text"
                        value={newSectionForm.badge}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, badge: e.target.value })}
                        placeholder="e.g. HOT UPDATES"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">CTA Button text</label>
                      <input
                        type="text"
                        value={newSectionForm.btnText}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, btnText: e.target.value })}
                        placeholder="e.g. EXPLORE NOW"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">CTA click target link</label>
                      <input
                        type="text"
                        value={newSectionForm.btnLink}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, btnLink: e.target.value })}
                        placeholder="e.g. #, mods, contact"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-xs">
                      <div>
                        <span className="text-xs font-bold text-white block uppercase">Visible / Active Status</span>
                        <span className="text-[9px] text-gray-400">Controls immediate grid rendering on homepage</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newSectionForm.visible}
                        onChange={(e) => setNewSectionForm({ ...newSectionForm, visible: e.target.checked })}
                        className="h-4 w-4 rounded bg-black/60 border-white/10 text-cyber-cyan cursor-pointer"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-125 transition-all w-full md:w-auto cursor-pointer"
                      >
                        CREATE NEW DYNAMIC HOMEPAGE SECTOR
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* NEWSLETTER SECTOR CONTROLLER CARD */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-left font-sans text-xs">
                <h2 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyber-cyan text-glow animate-pulse" />
                  <span>4. JOIN THE DISPATCH (NEWSLETTER) SECTOR CONTROLLER</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Fully customize or disable the Dispatch / Newsletter subscription box displayed on the homepage. Support redirect button URLs or standard automated email linking list.
                </p>

                <form onSubmit={handleNewsletterSectionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Section Badge Uplink Header</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.badge}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, badge: e.target.value })}
                        placeholder="UPLINK SUBSCRIPTION"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Section Title Heading</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.title}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, title: e.target.value })}
                        placeholder="JOIN THE DISPATCH"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Section Description text</label>
                      <textarea
                        rows={2}
                        value={newsletterSectionForm.description}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, description: e.target.value })}
                        placeholder="Receive weekly modification highlights, script patch updates, and official cyber event listings instantly."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Form Input Placeholder email text</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.placeholder}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, placeholder: e.target.value })}
                        placeholder="ENTER DISPATCH EMAIL..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Form Submit Button Text</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.buttonText}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, buttonText: e.target.value })}
                        placeholder="SUBSCRIBE"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Custom Redirect Button URL (Optional - overrides Email form subscription)</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.buttonUrl}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, buttonUrl: e.target.value })}
                        placeholder="Leave empty to submit emails locally, or specify a URL link like https://your-patreon.com"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Success Confirmation Message</label>
                      <input
                        type="text"
                        value={newsletterSectionForm.successMessage}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, successMessage: e.target.value })}
                        placeholder="Uplink established! You have subscribed to official dispatches."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-xs">
                      <div>
                        <span className="text-xs font-bold text-white block uppercase">Section visibility status</span>
                        <span className="text-[9px] text-gray-400">Completely hide/render the Dispatch card on homepage</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newsletterSectionForm.visible}
                        onChange={(e) => setNewsletterSectionForm({ ...newsletterSectionForm, visible: e.target.checked })}
                        className="h-4 w-4 rounded bg-black/60 border-white/10 text-cyber-cyan cursor-pointer"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-125 transition-all w-full md:w-auto cursor-pointer"
                      >
                        SAVE DISPATCH SECTOR SPECIFICATIONS
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 10.5: ANNOUNCEMENTS SYSTEM */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="text-left">
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Live Announcement alert logs</h2>
                <p className="text-xs text-gray-400 mt-1">Manage infinite banner lines, sticky popup models, and flash alerts across directories in Realtime.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Announcement creation/edit form */}
                <div className="lg:col-span-1 bg-white/[0.01] border border-white/5 p-5 rounded-2xl space-y-4 text-xs text-left">
                  <h3 className="font-display font-black text-white uppercase text-xs tracking-wider border-b border-white/5 pb-2">
                    Compile Announcement Alert
                  </h3>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Alert Broadcaster Text</label>
                    <textarea
                      rows={3}
                      value={announcementInputText}
                      onChange={(e) => setAnnouncementInputText(e.target.value)}
                      placeholder="e.g. 🔥 HOT FIX: Version 1.7.0 is now live with enhanced rendering engines."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Background color hex</label>
                      <input
                        type="text"
                        value={announcementBgColor}
                        onChange={(e) => setAnnouncementBgColor(e.target.value)}
                        placeholder="#ff007f"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Display location</label>
                      <select
                        value={announcementDisplayPosition}
                        onChange={(e) => setAnnouncementDisplayPosition(e.target.value as any)}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs"
                      >
                        <option value="top_bar">Header Wide Bar</option>
                        <option value="hero">Hero Alert Line</option>
                        <option value="right_panel">Sider Alert Badge</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Redirect Button Action URL (Optional)</label>
                    <input
                      type="text"
                      value={announcementLink}
                      onChange={(e) => setAnnouncementLink(e.target.value)}
                      placeholder="e.g. /dmca"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <span className="text-xs font-bold text-white">Toggle Alert Live Status</span>
                    <input
                      type="checkbox"
                      checked={announcementVisible}
                      onChange={(e) => setAnnouncementVisible(e.target.checked)}
                      className="h-4 w-4 bg-black/50 border-white/10 text-cyber-cyan cursor-pointer rounded"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!announcementInputText) {
                        alert("Announcement text cannot be blank.");
                        return;
                      }
                      setIsLoading(true);
                      try {
                        const currentList = settingsForm.announcementsList ? [...settingsForm.announcementsList] : [];
                        const target = {
                          id: selectedAnnouncementId || 'ann_' + Date.now(),
                          text: announcementInputText,
                          visible: announcementVisible,
                          bgColor: announcementBgColor,
                          displayPosition: announcementDisplayPosition,
                          link: announcementLink,
                          position: selectedAnnouncementId ? currentList.find(x => x.id === selectedAnnouncementId)?.position || 0 : currentList.length + 1
                        };

                        if (selectedAnnouncementId) {
                          const idx = currentList.findIndex(a => a.id === selectedAnnouncementId);
                          if (idx !== -1) currentList[idx] = target;
                        } else {
                          currentList.push(target);
                        }

                        const finalSettings = { ...settingsForm, announcementsList: currentList };
                        await set(dbRef(db, 'settings'), finalSettings);
                        setSettingsForm(finalSettings);
                        setSiteSettings(finalSettings);
                        
                        setAnnouncementInputText('');
                        setAnnouncementBgColor('#121225');
                        setAnnouncementDisplayPosition('top_bar');
                        setAnnouncementLink('');
                        setAnnouncementVisible(true);
                        setSelectedAnnouncementId(null);
                        alert("Alert settings successfully written to databases.");
                      } catch (err: any) {
                        alert("Failed to save announcement: " + err.message);
                      }
                      setIsLoading(false);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-display font-black text-xs uppercase rounded-lg tracking-widest hover:brightness-125 transition-all text-center cursor-pointer"
                  >
                    {selectedAnnouncementId ? 'MODIFY SPECIFIC ALERT' : 'BROADCAST ALERT'}
                  </button>

                  {selectedAnnouncementId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnnouncementId(null);
                        setAnnouncementInputText('');
                        setAnnouncementBgColor('');
                        setAnnouncementDisplayPosition('top_bar');
                        setAnnouncementLink('');
                        setAnnouncementVisible(true);
                      }}
                      className="w-full py-1.5 bg-white/5 border border-white/10 text-white font-bold rounded-lg cursor-pointer text-center"
                    >
                      CANCEL EDIT
                    </button>
                  )}
                </div>

                {/* Dynamic Alerts logs List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl text-left">
                    <h3 className="font-display font-black text-white text-xs tracking-wider uppercase mb-3">Live Broadcast Alert Registry</h3>

                    {!settingsForm.announcementsList || settingsForm.announcementsList.length === 0 ? (
                      <p className="text-xs text-gray-500 font-sans italic py-4">No active broadcasts logged in DB settings node. Top level announcement bar will act as fallback.</p>
                    ) : (
                      <div className="space-y-3">
                        {settingsForm.announcementsList.map((annItem) => (
                          <div key={annItem.id} className="p-3.5 bg-black/40 border border-white/5 rounded-xl hover:border-pink-500/20 text-xs font-sans text-left space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded font-black tracking-widest">
                                {annItem.displayPosition?.toUpperCase() || 'TOP_BAR'}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${annItem.visible ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                  {annItem.visible ? 'ACTIVE BROADCAST' : 'MUTED'}
                                </span>
                              </div>
                            </div>

                            <p className="font-semibold text-white leading-relaxed">{annItem.text}</p>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <div className="flex items-center gap-3 font-mono text-[10px] text-gray-400">
                                <span>Bg: <strong className="text-white" style={{ color: annItem.bgColor }}>{annItem.bgColor || '#default'}</strong></span>
                                {annItem.link && <span className="truncate max-w-[120px]">Link: <strong className="text-white">{annItem.link}</strong></span>}
                              </div>

                              <div className="flex gap-1.5 text-[9px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAnnouncementId(annItem.id);
                                    setAnnouncementInputText(annItem.text || '');
                                    setAnnouncementBgColor(annItem.bgColor || '');
                                    setAnnouncementDisplayPosition(annItem.displayPosition || 'top_bar');
                                    setAnnouncementLink(annItem.link || '');
                                    setAnnouncementVisible(annItem.visible !== false);
                                  }}
                                  className="px-2 py-1 bg-white/5 rounded border border-white/10 hover:bg-cyber-cyan hover:text-black cursor-pointer text-white"
                                >
                                  EDIT
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!window.confirm("Permanently erase this announcement broadcast?")) return;
                                    setIsLoading(true);
                                    try {
                                      const updated = settingsForm.announcementsList?.filter(x => x.id !== annItem.id) || [];
                                      const final = { ...settingsForm, announcementsList: updated };
                                      await set(dbRef(db, 'settings'), final);
                                      setSettingsForm(final);
                                      setSiteSettings(final);
                                    } catch (e: any) {
                                      alert("Purge failed: " + e.message);
                                    }
                                    setIsLoading(false);
                                  }}
                                  className="px-2 py-1 bg-cyber-magenta/15 text-cyber-magenta rounded border border-cyber-magenta/30 hover:bg-cyber-magenta hover:text-white cursor-pointer"
                                >
                                  PURGE
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GLOBAL POPUP CALL TO ACTION DIALOGUE CONTROLLER */}
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4 text-left font-sans text-xs mt-6">
                <h2 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                  <Radio className="w-5 h-5 text-cyber-cyan text-glow" />
                  <span>POPUP DIALOGUE / CALL TO ACTION MODAL SETTINGS</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Fully configure a high-priority popup dialogue modal that triggers when an end-user connects to the homepage node.
                </p>

                <form onSubmit={handlePopupMessageSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Dialogue Title</label>
                      <input
                        type="text"
                        required
                        value={popupMessageForm.title}
                        onChange={(e) => setPopupMessageForm({ ...popupMessageForm, title: e.target.value })}
                        placeholder="e.g. UPLINK SYSTEM ANNOUNCEMENT"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Button CTA text</label>
                      <input
                        type="text"
                        required
                        value={popupMessageForm.buttonText}
                        onChange={(e) => setPopupMessageForm({ ...popupMessageForm, buttonText: e.target.value })}
                        placeholder="e.g. Acknowledge Connection"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1 font-bold">Dialogue Description Text Content</label>
                      <textarea
                        rows={3}
                        required
                        value={popupMessageForm.text}
                        onChange={(e) => setPopupMessageForm({ ...popupMessageForm, text: e.target.value })}
                        placeholder="Specify details or announcements to display inside the critical modal..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl font-mono text-xs md:col-span-2">
                      <div>
                        <span className="text-xs font-bold text-white block uppercase">Toggle Modal Visibility</span>
                        <span className="text-[9px] text-gray-400">Instantly activate or deactivate the popup modal</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={popupMessageForm.visible}
                        onChange={(e) => setPopupMessageForm({ ...popupMessageForm, visible: e.target.checked })}
                        className="h-4 w-4 bg-black/50 border-white/10 text-cyber-cyan cursor-pointer"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-lg hover:brightness-125 transition-all w-full md:w-auto cursor-pointer"
                      >
                        SAVE POPUP PARAMETERS
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 11: SOCIAL MEDIAS EXPORTS */}
          {/* TAB: CUSTOM PAGES BUILDER */}
          {activeTab === 'custom-pages' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Page & Landing Page Management</h2>
                <p className="text-xs text-gray-400 mt-1">Design unlimited support pages, landing pages, information hubs, or custom sections on Games Tonic.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Custom Page Form */}
                <form onSubmit={handleCustomPageSubmit} className="lg:col-span-1 space-y-4 font-sans text-xs bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                  <h3 className="font-display font-bold text-white text-xs tracking-wider uppercase border-b border-light-gray/10 pb-2">
                    {selectedCustomPageId ? 'Modify Selected Page' : 'Create Custom Page'}
                  </h3>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Page Title</label>
                    <input
                      type="text"
                      required
                      value={customPageForm.title}
                      onChange={(e) => {
                        const slugged = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        setCustomPageForm({ ...customPageForm, title: e.target.value, slug: slugged, seoTitle: `${e.target.value} | ${settingsForm.siteName || 'Games Tonic'}` });
                      }}
                      placeholder="e.g. Community Tournament"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">URL Slug Identifier (No spaces)</label>
                    <input
                      type="text"
                      required
                      value={customPageForm.slug}
                      onChange={(e) => setCustomPageForm({ ...customPageForm, slug: e.target.value })}
                      placeholder="e.g. tournament-hub"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Markdown Page Body Content</label>
                    <textarea
                      rows={8}
                      required
                      value={customPageForm.content}
                      onChange={(e) => setCustomPageForm({ ...customPageForm, content: e.target.value })}
                      placeholder="# Interactive Tournament Info&#10;&#10;Welcome to our custom campaign catalog context..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-indigo-400 mb-1 font-bold font-mono">Custom SEO Title Override</label>
                    <input
                      type="text"
                      value={customPageForm.seoTitle}
                      onChange={(e) => setCustomPageForm({ ...customPageForm, seoTitle: e.target.value })}
                      placeholder="e.g. Esports Arena - Games Tonic"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-indigo-400 mb-1 font-bold font-mono">Custom SEO Description</label>
                    <textarea
                      rows={2}
                      value={customPageForm.seoDescription}
                      onChange={(e) => setCustomPageForm({ ...customPageForm, seoDescription: e.target.value })}
                      placeholder="e.g. Join the ultimate gaming community arena..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Page Status</label>
                    <select
                      value={customPageForm.status}
                      onChange={(e) => setCustomPageForm({ ...customPageForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                    >
                      <option value="published">LIVE & INDEXABLE (Published)</option>
                      <option value="draft">STAGED DRAFT (In Progress)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black uppercase tracking-wider rounded-lg text-[10px] cursor-pointer"
                    >
                      {selectedCustomPageId ? 'MODIFY PAGE' : 'PUBLISH PAGE'}
                    </button>
                    {selectedCustomPageId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomPageId(null);
                          setCustomPageForm({ title: '', slug: '', content: '', seoTitle: '', seoDescription: '', status: 'published' });
                        }}
                        className="px-3 bg-white/5 border border-white/10 text-white rounded-lg text-[10px]"
                      >
                        CANCEL
                      </button>
                    )}
                  </div>
                </form>

                {/* Pages List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                    <h3 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-3">Active Custom Pages Directory</h3>
                    
                    {!settingsForm.customPages || settingsForm.customPages.length === 0 ? (
                      <p className="text-xs text-gray-500 font-sans italic py-4">No custom pages compiled yet. Use form on left to authorize dynamic pages.</p>
                    ) : (
                      <div className="space-y-3">
                        {settingsForm.customPages.map((page) => (
                          <div key={page.id} className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-xl hover:border-cyber-cyan/20 transition-all font-sans text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{page.title}</span>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${page.status === 'draft' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                  {page.status || 'published'}
                                </span>
                              </div>
                              <p className="text-[10px] text-cyber-cyan font-mono mt-1">Route link: <span className="text-white select-all">/{page.slug}</span></p>
                              {page.seoTitle && <p className="text-[10px] text-gray-400 mt-1 truncate max-w-md">SEO: {page.seoTitle}</p>}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleReorderCustomPage(page.id, 'up')}
                                className="p-1 px-1.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 cursor-pointer"
                                title="Move Page Up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReorderCustomPage(page.id, 'down')}
                                className="p-1 px-1.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 cursor-pointer"
                                title="Move Page Down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>

                              <div className="h-4 w-px bg-white/10 mx-1"></div>

                              <button
                                onClick={() => handleCloneCustomPage(page)}
                                className="p-1 px-2.5 bg-white/5 hover:bg-cyber-purple font-display text-[10px] font-bold text-gray-300 hover:text-white rounded border border-white/10 cursor-pointer flex items-center gap-1"
                                title="Duplicate Page"
                              >
                                <Copy className="w-3 h-3" />
                                <span>CLONE</span>
                              </button>
                              <button
                                onClick={() => handleEditCustomPage(page)}
                                className="p-1 px-2.5 bg-white/5 hover:bg-cyber-cyan font-display text-[10px] font-bold text-gray-300 hover:text-black rounded border border-white/10 cursor-pointer"
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => handleDeleteCustomPage(page.id)}
                                className="p-1 px-2.5 bg-cyber-magenta/10 hover:bg-cyber-magenta text-cyber-magenta hover:text-white rounded border border-cyber-magenta/20 cursor-pointer text-[10px] font-bold"
                              >
                                TRASH
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANIMATED COUNTERS */}
          {activeTab === 'counters' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Community & Stat Counter Management</h2>
                <p className="text-xs text-gray-400 mt-1">Configure live statistics cards dynamically mapped directly on the website layout.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Counter Form */}
                <form onSubmit={handleCounterSubmit} className="lg:col-span-1 space-y-4 font-sans text-xs bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                  <h3 className="font-display font-bold text-white text-xs tracking-wider uppercase border-b border-light-gray/10 pb-2">
                    {selectedCounterId ? 'Modify Selected Counter' : 'Create Stat Counter'}
                  </h3>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Counter Title / Label</label>
                    <input
                      type="text"
                      required
                      value={counterForm.title}
                      onChange={(e) => setCounterForm({ ...counterForm, title: e.target.value })}
                      placeholder="e.g. ACTIVE USERS"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white uppercase font-display"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Statistical Value (Strings allowed)</label>
                    <input
                      type="text"
                      required
                      value={counterForm.value}
                      onChange={(e) => setCounterForm({ ...counterForm, value: e.target.value })}
                      placeholder="e.g. 1500+, 99.8K, premium"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold font-mono">Lucide Vector Icon Name</label>
                    <select
                      value={counterForm.icon}
                      onChange={(e) => setCounterForm({ ...counterForm, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                    >
                      <option value="Sparkles">Sparkles</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Users">Users</option>
                      <option value="Video">Video</option>
                      <option value="Code">Code</option>
                      <option value="Globe">Globe</option>
                      <option value="TrendingUp">TrendingUp</option>
                      <option value="ShieldAlert">ShieldAlert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Display Order Position</label>
                    <input
                      type="number"
                      required
                      value={counterForm.position}
                      onChange={(e) => setCounterForm({ ...counterForm, position: parseInt(e.target.value || '0', 10) })}
                      placeholder="e.g. 0, 1, 2"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Count-up Animated Transition</span>
                      <span className="text-[10px] text-gray-400">Triggers roll numerical counters automatically</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={counterForm.animation}
                      onChange={(e) => setCounterForm({ ...counterForm, animation: e.target.checked })}
                      className="h-4 w-4 rounded bg-black/60 border-white/10 text-cyber-cyan cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-white block">Enable / Active Status</span>
                      <span className="text-[10px] text-gray-400">Uncheck to hide this counter from homepage</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={counterForm.visible !== false}
                      onChange={(e) => setCounterForm({ ...counterForm, visible: e.target.checked })}
                      className="h-4 w-4 rounded bg-black/60 border-white/10 text-cyber-cyan cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black uppercase tracking-wider rounded-lg text-[10px] cursor-pointer animate-pulse"
                    >
                      {selectedCounterId ? 'MODIFY STAT' : 'PUBLISH STAT'}
                    </button>
                    {selectedCounterId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCounterId(null);
                          setCounterForm({ title: '', value: '', icon: 'Sparkles', animation: true, position: 0, visible: true });
                        }}
                        className="px-3 bg-white/5 border border-white/10 text-white rounded-lg text-[10px]"
                      >
                        RESET
                      </button>
                    )}
                  </div>
                </form>

                {/* Counters List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                    <h3 className="font-display font-bold text-white text-xs tracking-wider uppercase mb-3">Active Counters Configuration</h3>
                    
                    {!settingsForm.counters || settingsForm.counters.length === 0 ? (
                      <p className="text-xs text-gray-500 font-sans italic py-4">No counters set up. The website will display fallback metrics if none are established.</p>
                    ) : (
                      <div className="space-y-3">
                        {settingsForm.counters.map((countItem) => (
                          <div key={countItem.id} className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-xl hover:border-cyber-magenta/20 transition-all font-sans text-xs">
                            <div className="flex items-center gap-3">
                              <div className="bg-cyber-cyan/10 p-2 rounded-lg border border-cyber-cyan/20 text-cyber-cyan">
                                <span className="text-xs font-mono font-bold">[{countItem.icon}]</span>
                              </div>
                              <div>
                                <span className="font-display font-bold text-white uppercase text-xs tracking-wider">{countItem.title}</span>
                                <div className="text-sm font-mono font-bold text-cyber-magenta mt-0.5">{countItem.value}</div>
                                <div className="text-[9px] text-gray-400 font-mono mt-1">Sorting Rank: <span className="text-white font-bold">{countItem.position}</span> | Anim: {countItem.animation ? 'YES' : 'NO'} | Status: <span className={countItem.visible !== false ? "text-green-400 font-bold" : "text-cyber-magenta font-bold"}>{countItem.visible !== false ? "ENABLED" : "DISABLED"}</span></div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditCounter(countItem)}
                                className="p-1 px-2.5 bg-white/5 hover:bg-cyber-cyan font-display text-[10px] font-bold text-gray-300 hover:text-black rounded border border-white/10 cursor-pointer"
                              >
                                EDIT
                              </button>
                              <button
                                onClick={() => handleDeleteCounter(countItem.id)}
                                className="p-1 px-2.5 bg-cyber-magenta/10 hover:bg-cyber-magenta text-cyber-magenta hover:text-white rounded border border-cyber-magenta/20 cursor-pointer text-[10px] font-bold"
                              >
                                PURGE
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'socials' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Social Media Coordination</h2>
                <p className="text-xs text-gray-400 mt-1">Configure active social platform uplink links on the fly.</p>
              </div>

              <form onSubmit={handleSocialsSubmit} className="space-y-6 font-sans text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-purple mb-1 font-bold">YouTube Chanel URL</label>
                    <input
                      type="url"
                      value={socialsForm.youtubeLong}
                      onChange={(e) => setSocialsForm({ ...socialsForm, youtubeLong: e.target.value })}
                      placeholder="https://youtube.com/c/yourchanel"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-purple mb-1 font-bold">YouTube Shorts URL</label>
                    <input
                      type="url"
                      value={socialsForm.youtubeShorts}
                      onChange={(e) => setSocialsForm({ ...socialsForm, youtubeShorts: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-cyan mb-1 font-bold">Instagram Handle URL</label>
                    <input
                      type="url"
                      value={socialsForm.instagram}
                      onChange={(e) => setSocialsForm({ ...socialsForm, instagram: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-cyan mb-1 font-bold">Telegram channel URL</label>
                    <input
                      type="url"
                      value={socialsForm.telegram}
                      onChange={(e) => setSocialsForm({ ...socialsForm, telegram: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-magenta mb-1 font-bold">Facebook Profile page</label>
                    <input
                      type="url"
                      value={socialsForm.facebook}
                      onChange={(e) => setSocialsForm({ ...socialsForm, facebook: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-cyber-magenta mb-1 font-bold">Discord Server Invite link</label>
                    <input
                      type="url"
                      value={socialsForm.discord}
                      onChange={(e) => setSocialsForm({ ...socialsForm, discord: e.target.value })}
                      placeholder="https://discord.gg/invite_code"
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono text-white mb-1 font-bold">X (Twitter) handle stream</label>
                    <input
                      type="url"
                      value={socialsForm.x}
                      onChange={(e) => setSocialsForm({ ...socialsForm, x: e.target.value })}
                      className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase rounded-xl"
                >
                  SAVE SOCIAL MEDIA SPECIFICATIONS
                </button>
              </form>

              {/* UNLIMITED EXTRA CUSTOM SOCIAL LINKS BUILDER */}
              <div className="pt-8 border-t border-white/5 space-y-6">
                <div>
                  <h3 className="text-sm md:text-lg font-display font-black text-white tracking-widest uppercase">Unlimited Independent Extra Social Links</h3>
                  <p className="text-xs text-gray-400 mt-1">Add custom external channels like WhatsApp, threads, custom forums, Twitch, etc., mapped to responsive web icons.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Custom Social Form */}
                  <form onSubmit={handleCustomSocialSubmit} className="lg:col-span-1 space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                    <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider border-b border-light-gray/10 pb-2">
                      {selectedCustomSocialId ? 'Update Custom Social' : 'Add Custom Social'}
                    </h4>

                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Platform Name</label>
                      <input
                        type="text"
                        required
                        value={customSocialForm.platform}
                        onChange={(e) => setCustomSocialForm({ ...customSocialForm, platform: e.target.value })}
                        placeholder="e.g. WhatsApp Hotline"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Redirect URL Channel</label>
                      <input
                        type="url"
                        required
                        value={customSocialForm.url}
                        onChange={(e) => setCustomSocialForm({ ...customSocialForm, url: e.target.value })}
                        placeholder="e.g. https://wa.me/..."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1 font-mono font-bold">Vector Symbol Icon Representer</label>
                      <select
                        value={customSocialForm.icon}
                        onChange={(e) => setCustomSocialForm({ ...customSocialForm, icon: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      >
                        <option value="Share2">Generic Network (Share2)</option>
                        <option value="Youtube">Youtube Channel</option>
                        <option value="Instagram">Instagram Page</option>
                        <option value="Facebook">Facebook Profile</option>
                        <option value="Send">Telegram / Dispatch (Send)</option>
                        <option value="Twitter">X / Twitter Handle</option>
                        <option value="Mail">Mail Dispatch (Paperplane)</option>
                        <option value="Globe">Global Domain (Globe)</option>
                        <option value="HelpCircle">Support Ticket (HelpCircle)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-white block">Status Visibility</span>
                        <span className="text-[9px] text-gray-400">Enable/Disable dynamically</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={customSocialForm.status}
                        onChange={(e) => setCustomSocialForm({ ...customSocialForm, status: e.target.checked })}
                        className="h-4 w-4 rounded bg-black/60 border-white/10 text-cyber-cyan cursor-pointer"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-2 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black uppercase text-[10px] tracking-wider rounded-lg"
                      >
                        {selectedCustomSocialId ? 'UPDATE SOCIAL' : 'ADD NEW CHANNEL'}
                      </button>
                      {selectedCustomSocialId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomSocialId(null);
                            setCustomSocialForm({ platform: '', url: '', icon: 'Share2', status: true });
                          }}
                          className="px-3 bg-white/5 border border-white/10 text-white rounded-lg text-[10px]"
                        >
                          RESET
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List extra social links */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                      <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider mb-3">Live Custom Channels index</h4>

                      {!settingsForm.customSocialLinks || settingsForm.customSocialLinks.length === 0 ? (
                        <p className="text-xs text-gray-500 font-sans italic py-4">No additional custom links specified. Only default profiles render in the client footer.</p>
                      ) : (
                        <div className="space-y-3">
                          {settingsForm.customSocialLinks.map((csItem) => (
                            <div key={csItem.id} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-cyber-cyan/15 text-xs font-sans">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white">{csItem.platform}</span>
                                  <span className={`text-[8px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${csItem.status ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                    {csItem.status ? 'Active' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 truncate max-w-sm mt-0.5 font-mono">{csItem.url}</p>
                                <span className="text-[9px] text-cyber-cyan font-mono mt-1 block">Selected icon symbol: [{csItem.icon}]</span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditCustomSocial(csItem)}
                                  className="p-1 px-2.5 bg-white/5 hover:bg-cyber-cyan font-display text-[9px] font-bold text-gray-300 hover:text-black rounded border border-white/10 cursor-pointer"
                                >
                                  EDIT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomSocial(csItem.id)}
                                  className="p-1 px-2.5 bg-cyber-magenta/10 hover:bg-cyber-magenta text-cyber-magenta hover:text-white rounded border border-cyber-magenta/20 cursor-pointer text-[9px] font-bold"
                                >
                                  TRASH
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: GENERAL site settings SPECIFICATIONS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">General Site dynamic specifications</h2>
                <p className="text-xs text-gray-400 mt-1">Configure site name, favicon URL, analytics trackers, custom headers, categories, and query tags.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 font-sans text-xs">
                
                {/* GLOBAL TITLE INFO */}
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                  <p className="text-xs font-display font-black text-white uppercase tracking-wider block">Identity & Logo Assets (External URLs only)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Interactive Site Name</label>
                      <input
                        type="text"
                        value={settingsForm.siteName || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                        placeholder="Games Tonic"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Logo Link URL (PNG/SVG only)</label>
                      <input
                        type="url"
                        value={settingsForm.logoUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        placeholder="e.g. https://domain.com/logo.png"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Favicon Link URL (.ico/.png only)</label>
                      <input
                        type="url"
                        value={settingsForm.faviconUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, faviconUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* CONTACT PAGE SPECIFICATIONS */}
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 font-sans text-xs text-left">
                  <p className="text-xs font-display font-black text-cyber-cyan uppercase tracking-wider block">Contact Page Dynamic Information</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Contact Page Title</label>
                      <input
                        type="text"
                        value={settingsForm.contactPage?.title || ''}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          contactPage: {
                            ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                            title: e.target.value
                          }
                        })}
                        placeholder="CONTACT SECURE OFFICE"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Contact Page Description</label>
                      <input
                        type="text"
                        value={settingsForm.contactPage?.description || ''}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          contactPage: {
                            ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                            description: e.target.value
                          }
                        })}
                        placeholder="Have a proposal or want to sponsor Games Tonic? Send a query securely."
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Support Phone</label>
                      <input
                        type="text"
                        value={settingsForm.contactPage?.phone || ''}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          contactPage: {
                            ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                            phone: e.target.value
                          }
                        })}
                        placeholder="+1 (415) 301-4475"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Secure Inbox Email</label>
                      <input
                        type="email"
                        value={settingsForm.contactPage?.email || ''}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          contactPage: {
                            ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                            email: e.target.value
                          }
                        })}
                        placeholder="operations@gamestonic.com"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Office HQ Address</label>
                      <input
                        type="text"
                        value={settingsForm.contactPage?.address || ''}
                        onChange={(e) => setSettingsForm({
                          ...settingsForm,
                          contactPage: {
                            ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                            address: e.target.value
                          }
                        })}
                        placeholder="Cyber Tower Suite 733, Digital Hub, US"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Map Iframe Embed Code (Google Maps HTML iframe element)</label>
                    <textarea
                      rows={2}
                      value={settingsForm.contactPage?.mapEmbed || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        contactPage: {
                          ...(settingsForm.contactPage || { title: '', description: '', phone: '', email: '', address: '', mapEmbed: '' }),
                          mapEmbed: e.target.value
                        }
                      })}
                      placeholder='e.g. <iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyber-cyan"
                    />
                  </div>
                </div>

                {/* SEARCH LAYOUT META OVERVIEWS */}
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                  <p className="text-xs font-display font-black text-white uppercase tracking-wider block">Global search Optimization (Meta Page Specs)</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Global Meta Title</label>
                      <input
                        type="text"
                        value={settingsForm.metaTitle || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Global Meta Description</label>
                      <input
                        type="text"
                        value={settingsForm.metaDescription || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, metaDescription: e.target.value })}
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-gray-400 mb-1">Browser Title bar Override</label>
                      <input
                        type="text"
                        value={settingsForm.browserTitle || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, browserTitle: e.target.value })}
                        placeholder="e.g. Games Tonic | HQ Mods"
                        className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* TAXONOMY CLASSIFIER CONTROLS */}
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-6">
                  <p className="text-xs font-display font-black text-white uppercase tracking-wider block border-b border-white/5 pb-2">Modify Search Categories and tags list</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Categories Column */}
                    <div className="space-y-3">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold">Categories index pool</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="ADD CATEGORY..."
                          className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white tracking-widest uppercase font-mono text-[10px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="px-4 py-2 bg-cyber-cyan text-black font-display font-black rounded-lg"
                        >
                          ADD
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 p-3 bg-black/30 border border-white/5 rounded-xl max-h-[160px] overflow-y-auto">
                        {safeGetArray<string>(settingsForm.categories).map((cat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono hover:border-cyber-magenta/30">
                            <span className="text-white uppercase">{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              className="text-cyber-magenta hover:text-white font-bold ml-1.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags Column */}
                    <div className="space-y-3">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold">Query Tags Index pools</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="ADD QUERY TAG..."
                          className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[10px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-cyber-cyan text-black font-display font-black rounded-lg"
                        >
                          ADD
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 p-3 bg-black/30 border border-white/5 rounded-xl max-h-[160px] overflow-y-auto">
                        {safeGetArray<string>(settingsForm.tags).map((t, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono hover:border-cyber-cyan/30">
                            <span className="text-gray-400 bg-white/0 border-0 lowercase">#{t}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              className="text-cyber-magenta hover:text-white font-bold ml-1.5 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-10 py-3.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer transition-all disabled:opacity-50"
                >
                  SAVE SITE SPECIFICATIONS
                </button>
              </form>
            </div>
          )}

          {/* TAB: SPONSOR ADS SYSTEM */}
          {activeTab === 'sponsor-ads' && (
            <div className="space-y-8 animate-fade-in max-w-5xl text-xs font-sans">
              
              {/* HEADER INFO */}
              <div>
                <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Custom Sponsor Ads Campaign Hub</h2>
                <p className="text-xs text-gray-400 mt-1">Design, prioritize, schedule, and preview custom commercial sponsorships. Program interactive scroll-triggers, automatic timers, and countdown caps.</p>
              </div>

              {/* SECTION 1: CAMPAIGN INSIGHTS DASHBOARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">Sponsor Campaigns Programmed</span>
                  <p className="text-2xl md:text-3xl font-display font-black text-cyber-cyan mt-2">{(ads?.length || 0).toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Total active and inactive sponsorship campaigns</p>
                </div>
                <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase text-gray-400 tracking-wider">Total Sponsor Leads / Clicks</span>
                  <p className="text-2xl md:text-3xl font-display font-black text-cyber-magenta mt-2">{adStats.totClicks.toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 mt-1">Direct click redirection leads triggered</p>
                </div>
              </div>

              {/* SPONSOR ADS CREATOR */}
              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4">
                  <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">
                    {editingAdId ? "Edit Sponsor Advertisement" : "Program New Sponsor Campaign"}
                  </h3>
                  <span className="text-[10px] uppercase text-cyber-magenta font-bold font-mono">Premium Sponsor Engine</span>
                </div>

                <form onSubmit={handleSaveAd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* SPONSOR NAME */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Sponsor Name</label>
                    <input
                      type="text"
                      required
                      value={adForm.sponsorName || ''}
                      onChange={(e) => setAdForm({ ...adForm, sponsorName: e.target.value })}
                      placeholder="e.g. HyperX"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-[11px]"
                    />
                  </div>

                  {/* AD TITLE */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Ad Title / Campaign Name</label>
                    <input
                      type="text"
                      required
                      value={adForm.title || ''}
                      onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                      placeholder="e.g. Cloud III Wireless Headset Sale"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-[11px]"
                    />
                  </div>

                  {/* AD TYPE */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Ad Type / Placement Zone</label>
                    <select
                      value={adForm.adType}
                      onChange={(e) => setAdForm({ ...adForm, adType: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-[11px]"
                    >
                      <option value="banner">Banner (Standard Slots)</option>
                      <option value="popup">Popup Modal (Screen overlay)</option>
                      <option value="sticky_bottom">Sticky Bottom Bar</option>
                      <option value="sticky_top">Sticky Top Bar</option>
                      <option value="sidebar">Sidebar Placement</option>
                      <option value="inline">Inline Content Ad</option>
                      <option value="fullscreen">Fullscreen Interstitial</option>
                      <option value="floating">Floating Banner</option>
                    </select>
                  </div>

                  {/* DESTINATION URL */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold font-mono">Destination / Redirection URL</label>
                    <input
                      type="url"
                      required
                      value={adForm.targetUrl || ''}
                      onChange={(e) => setAdForm({ ...adForm, targetUrl: e.target.value })}
                      placeholder="https://mysponsor.com/campaign-landing"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* BUTTON TEXT */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Action Button Text</label>
                    <input
                      type="text"
                      required
                      value={adForm.buttonText || ''}
                      onChange={(e) => setAdForm({ ...adForm, buttonText: e.target.value })}
                      placeholder="e.g. Buy Now / Claim Code"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white text-[11px]"
                    />
                  </div>

                  {/* IMAGE URL */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Banner Image URL</label>
                    <input
                      type="url"
                      required
                      value={adForm.imageUrl || ''}
                      onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-XXX or vector banner href..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* PRIORITY */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold font-mono">Campaign Priority Weight (Higher = First)</label>
                    <input
                      type="number"
                      min="0"
                      value={adForm.priority || 0}
                      onChange={(e) => setAdForm({ ...adForm, priority: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* SCHEDULING START */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Schedule Start Date (Optional)</label>
                    <input
                      type="date"
                      value={adForm.startDate || ''}
                      onChange={(e) => setAdForm({ ...adForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* SCHEDULING END */}
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold">Schedule End Date (Optional)</label>
                    <input
                      type="date"
                      value={adForm.endDate || ''}
                      onChange={(e) => setAdForm({ ...adForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />
                  </div>

                  {/* HTML CUSTOM CODE (IF NEEDED AS ALTERNATIVE OVERRIDE) */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1 font-mono">Custom iframe / Script tag code override (Optional)</label>
                    <textarea
                      rows={3}
                      value={adForm.adCode || ''}
                      onChange={(e) => setAdForm({ ...adForm, adCode: e.target.value })}
                      placeholder="<!-- Paste sponsor custom widget HTML, script or tag override code if available -->"
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-white font-mono text-[11px] h-20"
                    />
                  </div>

                  {/* BEHAVIORAL AND TRIGGER RULES (FOR POPUP / FULLSCREEN CAMPAIGNS) */}
                  {(adForm.adType === 'popup' || adForm.adType === 'fullscreen') && (
                    <div className="md:col-span-3 p-4 bg-purple-950/20 border border-purple-500/10 rounded-xl space-y-4 animate-fade-in">
                      <p className="text-[10px] font-bold text-cyber-magenta uppercase tracking-wider font-mono">Advanced Popup & Behavioral Rules</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px]">
                        <div>
                          <label className="block text-gray-400 mb-1">Trigger Delay (Seconds)</label>
                          <input
                            type="number"
                            min="0"
                            value={adForm.popupDelay || 0}
                            onChange={(e) => setAdForm({ ...adForm, popupDelay: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-black/60 border border-white/15 rounded-md text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 mb-1">Trigger on Scroll % (0 = Immediate)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={adForm.scrollPercentage || 0}
                            onChange={(e) => setAdForm({ ...adForm, scrollPercentage: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-black/60 border border-white/15 rounded-md text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-400 mb-1">Frequency Control (Show every X Hours)</label>
                          <input
                            type="number"
                            min="0"
                            value={adForm.frequencyHours || 0}
                            onChange={(e) => setAdForm({ ...adForm, frequencyHours: Number(e.target.value) })}
                            placeholder="0 = Unlimited"
                            className="w-full px-3 py-1.5 bg-black/60 border border-white/15 rounded-md text-white font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="firstVisitOnly"
                            checked={adForm.firstVisitOnly || false}
                            onChange={(e) => setAdForm({ ...adForm, firstVisitOnly: e.target.checked })}
                            className="w-4 h-4 accent-cyber-magenta"
                          />
                          <label htmlFor="firstVisitOnly" className="text-gray-300 select-none cursor-pointer">Show on first visit only</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="oncePerSession"
                            checked={adForm.oncePerSession || false}
                            onChange={(e) => setAdForm({ ...adForm, oncePerSession: e.target.checked })}
                            className="w-4 h-4 accent-cyber-magenta"
                          />
                          <label htmlFor="oncePerSession" className="text-gray-300 select-none cursor-pointer">Show once per session</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="triggerOnButtonClick"
                            checked={adForm.triggerOnButtonClick || false}
                            onChange={(e) => setAdForm({ ...adForm, triggerOnButtonClick: e.target.checked })}
                            className="w-4 h-4 accent-cyber-magenta"
                          />
                          <label htmlFor="triggerOnButtonClick" className="text-gray-300 select-none cursor-pointer">Trigger on button click</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="showCloseButton"
                            checked={adForm.showCloseButton !== false}
                            onChange={(e) => setAdForm({ ...adForm, showCloseButton: e.target.checked })}
                            className="w-4 h-4 accent-cyber-magenta"
                          />
                          <label htmlFor="showCloseButton" className="text-gray-300 select-none cursor-pointer">Display Close [X] Button</label>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="autoClose"
                            checked={adForm.autoClose || false}
                            onChange={(e) => setAdForm({ ...adForm, autoClose: e.target.checked })}
                            className="w-4 h-4 accent-cyber-magenta"
                          />
                          <label htmlFor="autoClose" className="text-gray-300 select-none cursor-pointer">Auto Close Popups</label>
                        </div>

                        {adForm.autoClose && (
                          <div>
                            <label className="block text-gray-400 mb-1">Auto Close after (Seconds)</label>
                            <input
                              type="number"
                              min="1"
                              value={adForm.autoCloseTime || 10}
                              onChange={(e) => setAdForm({ ...adForm, autoCloseTime: Number(e.target.value) })}
                              className="w-full px-3 py-1 bg-black/60 border border-white/15 rounded-md text-white font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ENABLE/DISABLE TOGGLE */}
                  <div className="md:col-span-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase text-white font-bold">Deploy Live Status</p>
                      <span className="text-[9px] text-gray-500">Mute campaign temporarily without losing data.</span>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adForm.enabled}
                        onChange={(e) => setAdForm({ ...adForm, enabled: e.target.checked })}
                        className="w-5 h-5 rounded accent-cyber-magenta cursor-pointer"
                      />
                      <span className="text-[11px] uppercase text-gray-300 font-bold">{adForm.enabled ? 'Live & Active' : 'Muted / Paused'}</span>
                    </label>
                  </div>

                  {/* FORM TRIGGER ACTIONS */}
                  <div className="md:col-span-3 flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-3 bg-gradient-to-r from-cyber-magenta to-purple-800 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer"
                    >
                      {editingAdId ? "UPDATE SPONSOR CAMPAIGN" : "DEPLOY SPONSOR CAMPAIGN"}
                    </button>
                    {editingAdId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdId(null);
                          setAdForm({
                            id: '',
                            title: '',
                            position: 'homepage_hero_bottom',
                            adType: 'banner',
                            platform: 'Sponsor',
                            adCode: '',
                            imageUrl: '',
                            targetUrl: '',
                            enabled: true,
                            startDate: '',
                            endDate: '',
                            sponsorName: '',
                            buttonText: '',
                            popupDelay: 0,
                            autoCloseTime: 10,
                            priority: 0,
                            scrollPercentage: 0,
                            firstVisitOnly: false,
                            frequencyHours: 0,
                            oncePerSession: false,
                            triggerOnButtonClick: false,
                            showCloseButton: true,
                            autoClose: false
                          });
                        }}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                </form>
              </div>

              {/* INVENTORY DATABASE */}
              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
                <h3 className="text-xs font-display font-black text-white uppercase tracking-wider border-b border-white/5 pb-2 mb-4">Sponsorship Inventory & Campaign Database</h3>
                
                {(!ads || ads.length === 0) ? (
                  <div className="py-12 text-center text-gray-500 font-mono text-[10px] uppercase border border-dashed border-white/5 rounded-2xl bg-black/20">
                    No active sponsorship campaigns configured. Use the creator tool above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider">
                          <th className="pb-2.5 font-bold">Sponsor / Campaign</th>
                          <th className="pb-2.5 font-bold">Placement / Type</th>
                          <th className="pb-2.5 font-bold">Priority Weight</th>
                          <th className="pb-2.5 font-bold">Leads / Clicks</th>
                          <th className="pb-2.5 font-bold">Schedules</th>
                          <th className="pb-2.5 font-bold text-center">Status</th>
                          <th className="pb-2.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {ads.map((ad) => {
                          return (
                            <tr key={ad.id} className="hover:bg-white/[0.01] transition-colors border-white/5">
                              <td className="py-3 pr-2">
                                <p className="font-bold text-white text-[11px] truncate max-w-[170px]">{ad.title}</p>
                                <span className="text-[8px] font-mono text-gray-400 block truncate max-w-[170px]">Sponsor: {ad.sponsorName || 'Direct Sponsor'}</span>
                                <span className="text-[7px] font-mono text-gray-500 block truncate max-w-[170px]">ID: {ad.id}</span>
                              </td>
                              <td className="py-3">
                                <span className="px-1.5 py-0.5 bg-white/5 text-gray-300 font-mono text-[8px] rounded uppercase">{ad.adType}</span>
                              </td>
                              <td className="py-3 font-mono text-gray-300">
                                W: {ad.priority || 0}
                              </td>
                              <td className="py-3 font-mono">
                                <div className="text-[10px] text-gray-300">
                                  <span>🖱️ {ad.clicks || 0} clicks</span>
                                  <button
                                    type="button"
                                    onClick={() => handleResetAdStats(ad.id)}
                                    title="Reset Click Log"
                                    className="text-[10px] text-gray-500 hover:text-cyber-magenta font-bold transition-colors ml-3"
                                  >
                                    [Clear]
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 font-mono text-[9px] text-gray-400">
                                {ad.startDate || ad.endDate ? (
                                  <>
                                    <p>S: {ad.startDate || 'Immediate'}</p>
                                    <p>E: {ad.endDate || 'Unlimited'}</p>
                                  </>
                                ) : (
                                  <p>Continuous</p>
                                )}
                              </td>
                              <td className="py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdEnabled(ad.id, ad.enabled)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider uppercase transition-all ${
                                    ad.enabled 
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-red-500/15 text-red-400 border border-red-500/20'
                                  }`}
                                >
                                  {ad.enabled ? 'ACTIVE' : 'MUTED'}
                                </button>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAd(ad)}
                                    className="p-1 px-2 bg-purple-500/20 hover:bg-purple-500/80 text-white rounded text-[9px] font-mono uppercase transition-all"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateAd(ad)}
                                    className="p-1 px-2 bg-blue-500/20 hover:bg-blue-500/80 text-white rounded text-[9px] font-mono uppercase transition-all"
                                  >
                                    Dup
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAdId(ad.id);
                                      setAdForm({
                                        id: ad.id,
                                        title: ad.title || '',
                                        position: ad.position || 'homepage_hero_bottom',
                                        adType: ad.adType || 'banner',
                                        platform: 'Sponsor',
                                        adCode: ad.adCode || '',
                                        imageUrl: ad.imageUrl || '',
                                        targetUrl: ad.targetUrl || '',
                                        enabled: ad.enabled !== false,
                                        startDate: ad.startDate || '',
                                        endDate: ad.endDate || '',
                                        sponsorName: ad.sponsorName || '',
                                        buttonText: ad.buttonText || '',
                                        popupDelay: ad.popupDelay || 0,
                                        autoCloseTime: ad.autoCloseTime || 10,
                                        priority: ad.priority || 0,
                                        scrollPercentage: ad.scrollPercentage || 0,
                                        firstVisitOnly: ad.firstVisitOnly || false,
                                        frequencyHours: ad.frequencyHours || 0,
                                        oncePerSession: ad.oncePerSession || false,
                                        triggerOnButtonClick: ad.triggerOnButtonClick || false,
                                        showCloseButton: ad.showCloseButton !== false,
                                        autoClose: ad.autoClose || false
                                      });
                                    }}
                                    className="p-1 px-2 bg-white/5 hover:bg-cyber-magenta hover:text-white rounded text-[9px] font-mono uppercase transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAd(ad.id)}
                                    className="p-1 px-2 text-white/40 hover:text-white bg-red-950/20 hover:bg-red-600/80 rounded text-[9px] font-mono uppercase transition-all cursor-pointer"
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: GOOGLE ADSENSE */}
          {activeTab === 'adsense' && (
            <div className="space-y-8 animate-fade-in max-w-5xl text-xs font-sans">
              
              {/* HEADER INFO */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Google AdSense Manager</h2>
                  <p className="text-xs text-gray-400 mt-1">Create, edit, duplicate, and assign Google AdSense ad units to predefined layout slots with automatic realtime synchronization.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ADSENSE ENGINE ACTIVE
                  </span>
                </div>
              </div>

              {/* SECTION 1: CREATE OR EDIT ADSENSE UNIT FORM */}
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    {editingAdsenseUnitId ? "Edit Google AdSense Unit" : "Create New Google AdSense Unit"}
                  </h3>
                  {editingAdsenseUnitId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAdsenseUnitId(null);
                        setAdsenseForm({ name: '', slot: 'homepage_top', adCode: '', enabled: true });
                      }}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-[10px] rounded transition-all cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveAdsenseUnit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AD NAME */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold font-mono">Ad Name *</label>
                      <input
                        type="text"
                        required
                        value={adsenseForm.name}
                        onChange={(e) => setAdsenseForm({ ...adsenseForm, name: e.target.value })}
                        placeholder="e.g. Homepage Top Responsive Leaderboard"
                        className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-sans text-xs focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>

                    {/* PREDEFINED SLOT SELECTOR */}
                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold font-mono">Predefined Ad Slot *</label>
                      <select
                        value={adsenseForm.slot}
                        onChange={(e) => setAdsenseForm({ ...adsenseForm, slot: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-white font-sans text-xs focus:border-amber-500/50 focus:outline-none"
                      >
                        {ADSENSE_PREDEFINED_SLOTS.map(s => (
                          <option key={s.key} value={s.key}>
                            {s.name} ({s.description})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AD UNIT CODE */}
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase text-gray-400 font-bold font-mono">Ad Unit Code (HTML / JS / INS Tag) *</label>
                    <textarea
                      rows={5}
                      required
                      value={adsenseForm.adCode}
                      onChange={(e) => setAdsenseForm({ ...adsenseForm, adCode: e.target.value })}
                      placeholder={`<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-1234567890123456"\n  data-ad-slot="9876543210"\n  data-ad-format="auto"\n  data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono text-[11px] h-32 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  {/* STATUS TOGGLE */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div>
                      <span className="text-[11px] font-bold text-white uppercase block">Enable Ad Unit</span>
                      <span className="text-[9px] text-gray-400 font-mono">When active, this ad renders automatically in its predefined slot</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adsenseForm.enabled}
                        onChange={(e) => setAdsenseForm({ ...adsenseForm, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="flex justify-end gap-3 pt-2">
                    {editingAdsenseUnitId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdsenseUnitId(null);
                          setAdsenseForm({ name: '', slot: 'homepage_top', adCode: '', enabled: true });
                        }}
                        className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Reset Form
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-amber-700 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                    >
                      {isLoading ? "SAVING AD UNIT..." : editingAdsenseUnitId ? "UPDATE AD UNIT LIVE" : "+ CREATE AD UNIT"}
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION 2: AD UNITS DIRECTORY TABLE */}
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">Configured AdSense Units</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Manage, duplicate, enable/disable, or preview active Google AdSense units across slots.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold rounded-lg">
                    TOTAL UNITS: {adsenseUnits.length}
                  </span>
                </div>

                {adsenseUnits.length === 0 ? (
                  <div className="p-8 text-center bg-black/40 border border-dashed border-white/10 rounded-xl space-y-2">
                    <p className="text-xs text-gray-400">No Google AdSense units configured yet.</p>
                    <p className="text-[10px] text-gray-500 font-mono">Use the form above to create your first AdSense Unit in a predefined slot.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase font-mono text-gray-400">
                          <th className="py-2.5 px-3">Ad Name</th>
                          <th className="py-2.5 px-3">Predefined Slot</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Created Date</th>
                          <th className="py-2.5 px-3">Updated Date</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {adsenseUnits.map(unit => {
                          const slotObj = ADSENSE_PREDEFINED_SLOTS.find(s => s.key === unit.slot);
                          return (
                            <tr key={unit.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-3 font-bold text-white">
                                {unit.name}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px]">
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
                                  {slotObj ? slotObj.name : unit.slot}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {unit.enabled !== false ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded">
                                    ENABLED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 font-mono text-[10px] rounded">
                                    DISABLED
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px] text-gray-400">
                                {unit.createdAt || 'N/A'}
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px] text-gray-400">
                                {unit.updatedAt || 'N/A'}
                              </td>
                              <td className="py-3 px-3 text-right space-x-1">
                                {/* TOGGLE STATUS */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdsenseUnit(unit)}
                                  title={unit.enabled ? "Disable Unit" : "Enable Unit"}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    unit.enabled 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>

                                {/* PREVIEW */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewAdsenseUnit(unit)}
                                  title="Live Preview Unit"
                                  className="p-1.5 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 rounded-lg transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* DUPLICATE */}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateAdsenseUnit(unit)}
                                  title="Duplicate Unit"
                                  className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-all cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {/* EDIT */}
                                <button
                                  type="button"
                                  onClick={() => handleEditAdsenseUnit(unit)}
                                  title="Edit Unit"
                                  className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* DELETE */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdsenseUnit(unit.id)}
                                  title="Delete Unit"
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* LIVE PREVIEW MODAL */}
              {previewAdsenseUnit && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#0b0c10] border border-amber-500/30 rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-2xl relative">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-sm font-display font-black text-white uppercase tracking-wider">AdSense Unit Live Preview</h4>
                        <p className="text-[10px] text-amber-400 font-mono mt-0.5">{previewAdsenseUnit.name} ({previewAdsenseUnit.slot})</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewAdsenseUnit(null)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] rounded-lg cursor-pointer"
                      >
                        CLOSE PREVIEW
                      </button>
                    </div>

                    <div className="p-4 bg-black/80 border border-white/10 rounded-xl min-h-[120px] flex items-center justify-center">
                      <AdSensePlacement slot={previewAdsenseUnit.slot} units={[previewAdsenseUnit]} />
                    </div>

                    <div className="text-[10px] text-gray-400 font-mono bg-white/[0.02] p-3 rounded-lg border border-white/5 space-y-1">
                      <span className="text-gray-300 font-bold block">Raw Ad Code:</span>
                      <pre className="whitespace-pre-wrap break-all text-[9px] text-amber-300/80 max-h-24 overflow-y-auto">{previewAdsenseUnit.adCode}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: GLOBAL PUBLISHER SCRIPT (OPTIONAL GLOBAL AUTO-ADS) */}
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-xs font-display font-black text-white uppercase tracking-wider">Global Publisher Auto-Ads Header Script (Optional)</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Paste your global Google AdSense head script (e.g., <code className="text-amber-400">adsbygoogle.js?client=ca-pub-XXX</code>) if you also use Auto-Ads.</p>
                </div>

                <form onSubmit={handleSaveAdsenseCode} className="space-y-4">
                  <textarea
                    rows={4}
                    value={settingsForm.adsenseCode || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, adsenseCode: e.target.value })}
                    placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456' crossorigin='anonymous'></script>"
                    className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white font-mono text-[11px] h-24 focus:border-amber-500/50 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-gray-200 hover:text-amber-400 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      {isLoading ? "SAVING..." : "SAVE GLOBAL PUBLISHER SCRIPT"}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB: MAINTENANCE MODE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-8 animate-fade-in max-w-5xl text-xs font-sans">
              
              {/* HEADER INFO */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl">
                <div>
                  <h2 className="text-lg md:text-2xl font-display font-black text-white tracking-widest uppercase">Maintenance Mode Control</h2>
                  <p className="text-xs text-gray-400 mt-1">Manage global system maintenance status. When enabled, non-admin visitors are safely redirected to the custom maintenance page in real-time.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1.5 border font-mono text-[10px] font-bold uppercase rounded-lg flex items-center gap-1.5 shadow-2xl ${
                    maintenanceForm.enabled 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse' 
                      : 'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${maintenanceForm.enabled ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                    STATUS: {maintenanceForm.enabled ? 'MAINTENANCE ACTIVE' : 'SYSTEM ONLINE'}
                  </span>
                </div>
              </div>

              {/* MAINTENANCE CONFIGURATION FORM */}
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl">
                <form onSubmit={handleSaveMaintenanceSettings} className="space-y-6">
                  
                  {/* ENABLE TOGGLE */}
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-display font-black text-white uppercase tracking-wider">Enable Global Maintenance Mode</p>
                      <p className="text-[10px] text-gray-400">Instantly locks out non-admin visitors and displays the Maintenance Page.</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setMaintenanceForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`px-4 py-2 text-xs font-bold font-display uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
                          maintenanceForm.enabled 
                            ? 'bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {maintenanceForm.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* MAINTENANCE TITLE */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold">Maintenance Heading Title</label>
                      <input
                        type="text"
                        value={maintenanceForm.title}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Games Tonic is Currently Under Maintenance"
                        className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyber-cyan transition-all"
                        required
                      />
                    </div>

                    {/* STATUS LINE */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase text-gray-400 font-bold">System Status Line (Optional)</label>
                      <input
                        type="text"
                        value={maintenanceForm.status}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, status: e.target.value }))}
                        placeholder="Optimizing platform..."
                        className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyber-cyan transition-all"
                      />
                    </div>
                  </div>

                  {/* MAINTENANCE DESCRIPTION */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase text-gray-400 font-bold">Maintenance Description</label>
                    <textarea
                      rows={4}
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the current maintenance window purpose..."
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyber-cyan transition-all"
                      required
                    />
                  </div>

                  {/* SHOW SOCIAL ICONS TOGGLE */}
                  <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-display font-black text-white uppercase tracking-wider">Display Official Social Icons</p>
                      <p className="text-[10px] text-gray-400">Render links to your YouTube, Instagram, Discord, Telegram, Facebook, and X (Twitter) at the bottom.</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setMaintenanceForm(prev => ({ ...prev, showSocialIcons: !prev.showSocialIcons }))}
                        className={`px-4 py-2 text-xs font-bold font-display uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
                          maintenanceForm.showSocialIcons 
                            ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/30' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        {maintenanceForm.showSocialIcons ? 'VISIBLE' : 'HIDDEN'}
                      </button>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-cyber-cyan text-black font-black uppercase text-xs tracking-widest rounded-xl hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'SYNCHRONIZING...' : 'SAVE MAINTENANCE PROTOCOL'}
                    </button>
                  </div>

                </form>
              </div>

            </div>
          )}

        </section>

      </div>

    </div>
  );
}
