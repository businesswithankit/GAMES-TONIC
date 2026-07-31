export interface ContentPost {
  id: string;
  type: 'games' | 'blogs' | 'mods' | 'updates' | 'announcements' | 'events' | string;
  title: string;
  slug: string;
  thumbnail: string; // URL only
  banner: string; // URL only
  cover?: string; // Cover URL only
  buttonText?: string; // Button Text
  buttonLink?: string; // Button Link
  linkEnabled?: boolean; // Enable / Disable Link
  description: string;
  shortDescription: string;
  category: string;
  tags: string[];
  author: string;
  publishDate: string;
  status: 'draft' | 'published';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  extraLink?: string; // e.g. mod download link, game steam link, registration link
  viewsCount?: number;
  developerName?: string;
  developerEmail?: string;
  developerWebsite?: string;
  websiteLink?: string;
  version?: string;
  updatedDate?: string;
  promptLink?: string;
}

export interface NavMenu {
  id: string;
  name: string;
  link: string; // page identifier or dynamic slug e.g. 'home', 'content', 'mods', custom slug
  icon: string; // lucide icon identifier
  position: number;
  visibility?: boolean;
}

export interface ActionButton {
  id?: string;
  name?: string; // internal identifier/name
  text: string;
  link: string; // target page or external URL
  icon: string; // lucide class name
  openInNewTab: boolean;
  status?: 'active' | 'inactive';
  position?: number;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail?: string; // thumbnail URL
  embedCode: string; // iframe html pasted directly
  description: string;
  channelUrl?: string; // Channel link
  category?: string; // video category selection
  featured?: boolean; // featured video toggle
  position: number;
  buttonText?: string;
  buttonLink?: string;
  linkEnabled?: boolean;
}

export interface CounterItem {
  id: string;
  title: string;
  value: string;
  icon: string; // lucide icon name
  animation?: boolean;
  position: number;
  visible?: boolean;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown/HTML supported
  seoTitle?: string;
  seoDescription?: string;
  status?: 'published' | 'draft';
  position?: number;
  isLegal?: boolean; // dynamic flag to differentiate legal pages from general pages
}

export interface CustomSocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string; // Font Awesome or Lucide icon name, e.g. "fab fa-youtube"
  status?: boolean;
  position?: number;
}

export interface FeaturedGameItem {
  id: string;
  gameName: string;
  developerName: string;
  developerEmail: string;
  developerWebsite: string;
  gameLink: string;
  promptLink?: string;
  imageLink: string;
  thumbnail?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  version?: string;
  publishDate?: string;
  updatedDate?: string;
  tags?: string[] | string;
  status?: 'published' | 'draft';
  position?: number;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  visible: boolean;
  link?: string;
  bgColor?: string;
  color?: string;
  position: number;
  displayPosition?: 'top_bar' | 'hero' | 'right_panel' | 'popup';
}

export interface HomeSection {
  id: string;
  key: string; // e.g. 'hero' | 'games' | 'mods' | 'videos' | 'blogs' | 'upcoming' | 'trending' | 'stats' | 'newsletter'
  title: string;
  subtitle: string;
  badge?: string;
  btnText?: string;
  btnLink?: string;
  visible: boolean;
  position: number;
  enableActionButtons?: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  position: number;
  links: { label: string; url: string; openInNewTab?: boolean }[];
}

export interface SiteSettings {
  siteName?: string;
  browserTitle?: string;
  logoUrl?: string;
  faviconUrl?: string;
  bannerUrl?: string;
  backgroundUrl?: string;
  coverUrl?: string;
  iconUrl?: string;
  footerLinks?: any;
  
  // SEO Meta tags
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  robotsSettings?: string;
  ogImage?: string;
  twitterCard?: string;

  adsenseCode?: string; // Google AdSense code globally injected

  // Dynamic announcement system
  announcementsList?: AnnouncementItem[];
  announcementBar?: {
    text: string;
    visible: boolean;
    link?: string;
    bgColor?: string;
  };

  popupMessage?: {
    title: string;
    text: string;
    visible: boolean;
    buttonText?: string;
    buttonLink?: string;
  };

  hero?: {
    title: string;
    subtitle: string;
    backgroundEffect: 'particles' | 'matrix' | 'waves' | 'stars';
    btnText1?: string;
    btnLink1?: string;
    btnText2?: string;
    btnLink2?: string;
  };

  socialLinks?: {
    youtubeLong?: string;
    youtubeShorts?: string;
    instagram?: string;
    telegram?: string;
    discord?: string;
    facebook?: string;
    x?: string;
    threads?: string;
    whatsapp?: string;
  };

  customSocialLinks?: CustomSocialLink[];

  footer?: {
    text?: string;
    copyright?: string;
    statusText?: string;
    statusColor?: string;
  };

  footerColumns?: FooterColumn[];

  buttons?: Record<string, ActionButton>;
  buttonsList?: ActionButton[]; // Custom buttons list for dynamic additions

  menus?: NavMenu[];
  
  // All pages stored dynamic
  customPages?: CustomPage[];
  
  counters?: CounterItem[];
  
  contactPage?: {
    title: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    mapEmbed?: string;
  };

  homeSections?: HomeSection[];

  newsletter?: {
    title: string;
    description: string;
    badge?: string;
    buttonText?: string;
    buttonUrl?: string;
    placeholder?: string;
    successMessage?: string;
    visible?: boolean;
  };

  categories?: string[];
  tags?: string[];
  adSettings?: {
    buttonActionAdEnabled: boolean;
    buttonActionAdId?: string; // which ad to trigger (requires targetUrl/adCode)
    buttonActionAdType?: 'redirect' | 'modal'; // how to open: 'redirect' (redirects user after new tab ad) or 'modal' (interstitial modal)
    popupAdEnabled: boolean;
    popupAdDelay: number; // in seconds
    popupAdFrequency: number; // in minutes (frequency capping)
    popupAdId?: string; // which ad to show in popup
  };
}

export interface AdSenseUnit {
  id: string;
  name: string; // Ad Name
  slot: string; // Predefined slot identifier (e.g. 'homepage_top', 'article_middle', etc.)
  adCode: string; // Ad Unit Code
  enabled: boolean; // Status
  createdAt: string; // Created Date
  updatedAt: string; // Updated Date
}

export interface Advertisement {
  id: string;
  title: string;
  position: string; // Predefined positions or custom position strings
  adType: 'banner' | 'popup' | 'sticky_bottom' | 'sticky_top' | 'sidebar' | 'inline' | 'fullscreen' | 'floating' | string;
  platform?: string; // Google AdSense or Sponsor
  adCode?: string; // script or Custom HTML text
  imageUrl?: string; // Sponsor image
  targetUrl?: string; // Target action click url
  enabled: boolean;
  createdAt: number;
  views?: number;
  clicks?: number;
  startDate?: string; // e.g. YYYY-MM-DD
  endDate?: string;   // e.g. YYYY-MM-DD
  
  // Custom Sponsor Ad fields
  sponsorName?: string;
  buttonText?: string;
  popupDelay?: number; // delay in seconds
  autoCloseTime?: number; // auto close in seconds
  priority?: number; // priority level (number)
  scrollPercentage?: number; // show after X% scroll
  firstVisitOnly?: boolean; // show on first visit only
  frequencyHours?: number; // show every X hours
  oncePerSession?: boolean; // show once per session
  triggerOnButtonClick?: boolean; // show on button click
  showCloseButton?: boolean; // has close button
  autoClose?: boolean; // auto close toggle
}

export interface SiteAnalytics {
  views: number;
  visitors: Record<string, boolean>; // map IP/session to prevent double counting
  clicks: Record<string, number>;
}

export type ActivePage = string;
