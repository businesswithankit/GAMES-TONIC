import React, { useState } from 'react';
import { 
  Shield, FileText, AlertTriangle, Cookie, Cpu, Sparkles, 
  HelpCircle, Mail, MapPin, Phone, CheckCircle, ArrowLeft, Globe
} from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, push, set } from 'firebase/database';
import { SiteSettings, CustomPage } from '../types';
import { compileActiveSocialLinks, getSocialSvgIcon } from '../lib/socialUtils';
import { generateAILegalContent } from '../lib/aiLegalGenerator';

// Helper component to render multi-line text blocks nicely as formatted content or basic markdown
const RenderBodyText = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div className="space-y-4 font-sans text-sm md:text-base leading-relaxed text-gray-300">
      {content.split(/\n\n+/).map((para, i) => {
        if (!para.trim()) return null;
        // Check if paragraph starts with a heading pattern e.g., "1. " or "HOW TO"
        const isHeading = /^[0-9]+\.|\b(HOW TO|INTRODUCTION|THE DATA|HOW WE|DATA SECURITY|SUBMIT TO|WE USE|FAQ|STILL NEED|AGREEMENT|INTELLECTUAL|SYSTEM|LIABILITY|LOGO|REQUIRED|DEACTIVATING|NEXT-GEN|PHILOSOPHY)\b/.test(para.trim().substring(0, 20));
        return (
          <p 
            key={i} 
            className={isHeading ? "text-white font-display font-bold text-sm md:text-lg mt-6 mb-2 tracking-wider uppercase text-glow" : ""}
          >
            {para}
          </p>
        );
      })}
    </div>
  );
};

interface UnifiedPageProps {
  slug: string;
  onBack: () => void;
  siteSettings: SiteSettings;
  onNavigate?: (slug: string) => void;
}

export function DynamicPageRenderer({ slug, onBack, siteSettings, onNavigate }: UnifiedPageProps) {
  const isBuiltInLegalSlug = ['privacy', 'terms', 'disclaimer', 'cookie', 'dmca', 'about', 'support'].includes(slug);
  const aiDoc = isBuiltInLegalSlug ? generateAILegalContent(slug, siteSettings) : null;

  // Find the page either in legalPages (takes priority) or customPages inside siteSettings
  let page = siteSettings.legalPages?.[slug] ? {
    id: `l_${slug}`,
    title: siteSettings.legalPages[slug].title || aiDoc?.title || `${slug.toUpperCase()} INFORMATION`,
    slug: slug,
    content: siteSettings.legalPages[slug].content || aiDoc?.content || '',
    seoTitle: siteSettings.legalPages[slug].seoTitle || aiDoc?.seoTitle,
    seoDescription: siteSettings.legalPages[slug].seoDescription || aiDoc?.seoDescription,
    status: siteSettings.legalPages[slug].status || 'published'
  } as any : (aiDoc ? {
    id: `l_${slug}`,
    title: aiDoc.title,
    slug: slug,
    content: aiDoc.content,
    seoTitle: aiDoc.seoTitle,
    seoDescription: aiDoc.seoDescription,
    status: 'published'
  } as any : undefined);

  if (!page) {
    page = siteSettings.customPages?.find(p => p.slug === slug);
  }

  const isPublished = page ? page.status === 'published' : true; // default system fallback

  if (page && !isPublished) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center glass-panel rounded-2xl border border-white/5 space-y-4">
        <AlertTriangle className="w-12 h-12 text-cyber-magenta mx-auto animate-pulse" />
        <h2 className="text-xl font-display font-black text-white">PAGE UNPUBLISHED</h2>
        <p className="text-xs text-gray-400 font-sans">This intelligence register is currently offline. Status: Draft Mode.</p>
        <button onClick={onBack} className="mt-4 px-5 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white uppercase tracking-wider hover:bg-white/10">Back to Hub</button>
      </div>
    );
  }

  // Intercept special built-in page layouts
  if (slug === 'contact') {
    return <ContactUs onBack={onBack} siteSettings={siteSettings} />;
  }

  if (slug === 'support') {
    return <SupportPage onBack={onBack} siteSettings={siteSettings} />;
  }

  if (slug === 'credits') {
    return <CreditsPage onBack={onBack} siteSettings={siteSettings} onNavigate={onNavigate} />;
  }

  // Map slugs to standard icons
  const getPageIcon = (s: string) => {
    switch (s) {
      case 'privacy': return <Shield className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />;
      case 'terms': return <FileText className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />;
      case 'disclaimer': return <AlertTriangle className="w-8.5 h-8.5 text-cyber-magenta animate-pulse" />;
      case 'cookie': return <Cookie className="w-8.5 h-8.5 text-cyber-cyan animate-bounce" />;
      case 'dmca': return <Cpu className="w-8.5 h-8.5 text-cyber-cyan" />;
      case 'about': return <Sparkles className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />;
      case 'support': return <HelpCircle className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />;
      case 'contact': return <Mail className="w-8.5 h-8.5 text-cyber-cyan" />;
      default: return <Globe className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />;
    }
  };

  // Directories array for the Dynamic internal page directory
  const directories = [
    { label: 'ABOUT US', slug: 'about' },
    { label: 'PRIVACY POLICY', slug: 'privacy' },
    { label: 'TERMS & CONDITIONS', slug: 'terms' },
    { label: 'LIABILITY DISCLAIMER', slug: 'disclaimer' },
    { label: 'COPYRIGHT & DMCA', slug: 'dmca' },
    { label: 'COOKIE POLICY', slug: 'cookie' },
    { label: 'WEBSITE MANAGER & CREDITS', slug: 'credits' },
    { label: 'SUPPORT', slug: 'support' },
    { label: 'CONTACT HQ', slug: 'contact' },
  ];

  const pageTitle = page?.title || `${slug.toUpperCase()} INFORMATION`;
  const pageContent = page?.content || `No content has been published for slug: /${slug} yet. Customize this page inside your CMS Admin Panel.`;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 glass-panel-neon rounded-2xl animate-fade-in text-gray-300 border border-cyber-cyan/25 space-y-6">
      
      {/* INTERNAL PAGE INDEX DIRECTORY */}
      {onNavigate && (
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left space-y-2">
          <p className="text-[9px] font-mono tracking-widest text-gray-500 font-bold uppercase">INTERNAL INTELLIGENCE REGISTERS DIRECTORY</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {directories.map((dir, idx) => {
              const active = slug === dir.slug;
              return (
                <button
                  key={idx}
                  onClick={() => onNavigate(dir.slug)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase rounded transition-all cursor-pointer border ${
                    active 
                      ? 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/35 shadow-[0_0_8px_rgba(0,240,255,0.15)]' 
                      : 'bg-[#10101a] text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {dir.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-cyber-cyan/15 pb-4">
        {getPageIcon(slug)}
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-widest uppercase text-glow">
            {pageTitle}
          </h1>
          {page?.seoTitle && (
            <p className="text-[10px] text-cyber-cyan/80 font-mono mt-1 uppercase">SEO METRIC: {page.seoTitle}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <RenderBodyText content={pageContent} />
        
        {/* Support embedded tags */}
        {pageContent.includes('[CONTACT_FORM]') && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <ContactForm siteSettings={siteSettings} />
          </div>
        )}
        {pageContent.includes('[FAQ_ACCORDION]') && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <FaqAccordion siteSettings={siteSettings} />
          </div>
        )}
      </div>

      <button 
        onClick={onBack} 
        className="mt-8 px-6 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-bold text-xs tracking-widest rounded-lg hover:brightness-125 hover:shadow-[0_0_10px_#00f0ff] transition-all cursor-pointer flex items-center gap-2 max-w-max"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO HUB</span>
      </button>
    </div>
  );
}

// ----------------------------------------------------
// CONTACT US COMPONENT
// ----------------------------------------------------
export function ContactUs({ onBack, siteSettings }: { onBack: () => void; siteSettings: SiteSettings }) {
  const contactData = siteSettings.contactPage || {
    title: 'CONTACT SECURE OFFICE',
    description: 'Have a proposal, issues, or want to sponsor Games Tonic? Send a query securely.',
    phone: '',
    email: '',
    address: '',
    mapEmbed: ''
  };

  const activeSocials = compileActiveSocialLinks(siteSettings);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 glass-panel-neon rounded-2xl animate-fade-in border border-cyber-cyan/25">
      <div className="flex items-center gap-3 mb-6 border-b border-cyber-cyan/20 pb-4">
        <Mail className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />
        <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-widest uppercase text-glow">
          {contactData.title || 'CONTACT HUB'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
        {/* Left Info Column */}
        <div className="space-y-6 text-gray-300 flex flex-col justify-between">
          <div className="space-y-5">
            <p className="text-white text-base md:text-lg leading-relaxed font-semibold text-left">
              {contactData.description || 'Transmit secure correspondents directly to our catalog managers.'}
            </p>

            <div className="space-y-4 pt-4 text-xs md:text-sm">
              {contactData.address && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyber-cyan/10 border border-cyber-cyan/20 rounded-xl text-cyber-cyan shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-cyber-cyan font-mono font-bold uppercase tracking-wider">OFFICE HQ</p>
                    <p className="font-semibold text-white">{contactData.address}</p>
                  </div>
                </div>
              )}

              {contactData.phone && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-xl text-cyber-purple shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-cyber-purple font-mono font-bold uppercase tracking-wider">SUPPORT PHONE</p>
                    <p className="font-semibold text-white">{contactData.phone}</p>
                  </div>
                </div>
              )}

              {contactData.email && (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyber-magenta/10 border border-cyber-magenta/20 rounded-xl text-cyber-magenta shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-cyber-magenta font-mono font-bold uppercase tracking-wider">SECURE INBOX</p>
                    <p className="font-semibold text-white underline hover:text-cyber-cyan">{contactData.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map iframe embed script */}
          {contactData.mapEmbed && (
            <div 
              className="w-full h-44 rounded-xl overflow-hidden border border-white/5 bg-black/60 [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:min-h-full" 
              dangerouslySetInnerHTML={{ __html: contactData.mapEmbed }} 
            />
          )}

          {/* Social Platforms inside Contact Area */}
          {activeSocials.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-4 text-left">
              <h4 className="text-[9px] uppercase tracking-widest font-mono text-gray-500 font-bold">NODE COMMUNICATIONS NETWORK</h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {activeSocials.map((sl, idx) => (
                  <a
                    key={idx}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={sl.rawPlatform}
                    className="p-2 border border-white/10 hover:border-cyber-cyan bg-white/[0.01] hover:bg-cyber-cyan/10 rounded-xl text-xs font-mono font-bold tracking-wider uppercase text-gray-400 hover:text-cyber-cyan flex items-center gap-2 transition"
                  >
                    {getSocialSvgIcon(sl.platform, "w-4 h-4")}
                    <span>{sl.rawPlatform}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Feedback Column */}
        <div className="glass-panel p-6 rounded-xl border border-white/5 bg-black/40">
          <ContactForm siteSettings={siteSettings} />
        </div>
      </div>

      <button 
        onClick={onBack} 
        className="mt-8 px-6 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-medium rounded-lg hover:brightness-125 transition-all text-xs tracking-widest font-bold cursor-pointer flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO HUB</span>
      </button>
    </div>
  );
}

// ContactForm internal sub-component
export function ContactForm({ siteSettings }: { siteSettings: SiteSettings }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Read button settings dynamically from database
  const contactBtnText = siteSettings.buttons?.contact?.text || 'SEND DISPATCH';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    try {
      const contactsRef = ref(db, 'contacts');
      const newContact = push(contactsRef);
      await set(newContact, {
        name,
        email,
        message,
        timestamp: Date.now()
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error("Failed to submit contact response", err);
      alert("Dispatch queued offline. Write authentication required.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="space-y-4 text-center py-8">
        <div className="inline-flex p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-display text-white font-bold">TRANSMISSION SECURED</h3>
        <p className="text-xs text-gray-400 font-sans">Our support dispatch has saved your query securely and will synchronize in Realtime.</p>
        <button 
          type="button"
          onClick={() => setSuccess(false)} 
          className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs cursor-pointer font-bold uppercase transition"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-cyber-cyan mb-1.5">Your Identity / Handle</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gamer77"
          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_8px_rgba(0,240,255,0.2)]"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-cyber-cyan mb-1.5">Direct Correspondence Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@email.com"
          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_8px_rgba(0,240,255,0.2)]"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-cyber-cyan mb-1.5">Message / Transmission Content</label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Specify query tags, mod revisions, or sponsor proposal..."
          className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-[0_0_8px_rgba(0,240,255,0.2)] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gradient-to-r from-cyber-cyan via-cyber-purple to-cyber-magenta text-black font-display font-extrabold text-xs tracking-widest uppercase rounded-lg hover:brightness-125 transition-all cursor-pointer shadow-lg disabled:opacity-50"
      >
        {loading ? 'TRANSMITTING...' : contactBtnText.toUpperCase()}
      </button>
    </form>
  );
}

// ----------------------------------------------------
// SUPPORT HELPDESK COMPONENT
// ----------------------------------------------------
export function SupportPage({ onBack, siteSettings }: { onBack: () => void; siteSettings: SiteSettings }) {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 glass-panel-neon rounded-2xl animate-fade-in text-gray-300 border border-cyber-cyan/20">
      <div className="flex items-center gap-3 mb-6 border-b border-cyber-cyan/25 pb-4">
        <HelpCircle className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-widest uppercase text-glow">
            HELP AND SUPPORT CENTER
          </h1>
          <p className="text-xs text-cyber-cyan uppercase font-mono tracking-wider mt-1">Platform Operations Guide</p>
        </div>
      </div>

      <div className="space-y-6 font-sans">
        <FaqAccordion siteSettings={siteSettings} />

        <section className="mt-8 p-6 glass-panel rounded-xl border border-white/5 bg-black/35 text-left">
          <h2 className="text-lg font-display text-white font-bold mb-2">STILL NEED ASSISTANCE?</h2>
          <p className="text-sm text-gray-400 mb-4 font-sans leading-relaxed">
            If you cannot find an answer or need help with a custom mod indexing, dispatch a correspondence directly to our compliance teams.
          </p>
          <div className="inline-flex items-center gap-2 text-cyber-cyan font-bold font-display text-xs tracking-wider">
            SECURE EMAIL: {siteSettings.contactPage?.email || 'operations@gamestonicofficial.com'}
          </div>
        </section>
      </div>

      <button 
        onClick={onBack} 
        className="mt-8 px-6 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-bold text-xs tracking-widest rounded-lg hover:brightness-125 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO HUB</span>
      </button>
    </div>
  );
}

// FaqAccordion internal sub-component
export function FaqAccordion({ siteSettings }: { siteSettings: SiteSettings }) {
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);

  // We can extract FAQs dynamically if we define them under system variables, or have a default list
  const faqs = [
    {
      question: "How do I download and safely install the gaming mods listed?",
      answer: "Every mod card contains an executable download source link. Since mods alter game scripts, we highly recommend copying your game save files first. Extract the zip contents and apply them into the game's directory as outlined in each mod's detailed specification sheet."
    },
    {
      question: "Can I publish copyrighted modules or scripts?",
      answer: "Intellectual laws are highly valued on our platform. You are allowed to catalog content where you possess permission or authors give attribution. Stolen uploads are instantly expunged."
    },
    {
      question: "How often are these gaming modules updated?",
      answer: "Our platform indices are dynamically kept in sync constantly as developers push fresh updates. Check our Latest Updates logs for patch notes and dynamic community releases."
    }
  ];

  return (
    <section className="text-left">
      <h2 className="text-lg font-display text-white font-bold mb-4 tracking-wider uppercase">FREQUENTLY ASKED DISPATCHES</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-white/5 rounded-xl bg-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedFaq(selectedFaq === index ? null : index)}
              className="w-full px-6 py-4 text-left font-display text-sm md:text-base font-semibold text-white flex justify-between items-center bg-black/20 hover:bg-black/40 transition-colors"
            >
              <span>{faq.question}</span>
              <span className="text-cyber-cyan text-lg">{selectedFaq === index ? '−' : '+'}</span>
            </button>
            {selectedFaq === index && (
              <div className="px-6 py-4 text-sm text-gray-300 border-t border-white/5 leading-relaxed bg-black/10">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// Keep older component function exports but make them call DynamicPageRenderer internally to preserve original code compatibility
export function PrivacyPolicy({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="privacy" onBack={onBack} siteSettings={siteSettings} />;
}

export function TermsAndConditions({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="terms" onBack={onBack} siteSettings={siteSettings} />;
}

export function Disclaimer({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="disclaimer" onBack={onBack} siteSettings={siteSettings} />;
}

export function DMCA({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="dmca" onBack={onBack} siteSettings={siteSettings} />;
}

export function CookiePolicy({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="cookie" onBack={onBack} siteSettings={siteSettings} />;
}

export function AboutUs({ onBack, siteSettings }: UnifiedPageProps) {
  return <DynamicPageRenderer slug="about" onBack={onBack} siteSettings={siteSettings} />;
}

// ----------------------------------------------------
// WEBSITE MANAGER & CREDITS COMPONENT
// ----------------------------------------------------
interface CreditsPageProps {
  onBack: () => void;
  siteSettings: SiteSettings;
  onNavigate?: (slug: string) => void;
}

export function CreditsPage({ onBack, siteSettings, onNavigate }: CreditsPageProps) {
  const activeSocials = compileActiveSocialLinks(siteSettings);

  const directories = [
    { label: 'ABOUT US', slug: 'about' },
    { label: 'PRIVACY POLICY', slug: 'privacy' },
    { label: 'TERMS & CONDITIONS', slug: 'terms' },
    { label: 'LIABILITY DISCLAIMER', slug: 'disclaimer' },
    { label: 'COPYRIGHT & DMCA', slug: 'dmca' },
    { label: 'COOKIE POLICY', slug: 'cookie' },
    { label: 'WEBSITE MANAGER & CREDITS', slug: 'credits' },
    { label: 'SUPPORT', slug: 'support' },
    { label: 'CONTACT HQ', slug: 'contact' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 glass-panel-neon rounded-2xl animate-fade-in text-gray-300 border border-cyber-cyan/25 space-y-8">
      
      {/* INTERNAL PAGE INDEX DIRECTORY */}
      {onNavigate && (
        <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left space-y-2">
          <p className="text-[9px] font-mono tracking-widest text-gray-500 font-bold uppercase">INTERNAL INTELLIGENCE REGISTERS DIRECTORY</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {directories.map((dir, idx) => {
              const active = dir.slug === 'credits';
              return (
                <button
                  key={idx}
                  onClick={() => onNavigate(dir.slug)}
                  className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase rounded transition-all cursor-pointer border ${
                    active 
                      ? 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/35 shadow-[0_0_8px_rgba(0,240,255,0.15)]' 
                      : 'bg-[#10101a] text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {dir.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-center gap-3 border-b border-cyber-cyan/15 pb-4">
        <Cpu className="w-8.5 h-8.5 text-cyber-cyan animate-pulse" />
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-widest uppercase text-glow">
            PLATFORM CREDITS & DEV ROSTERS
          </h1>
          <p className="text-[10px] text-cyber-cyan/80 font-mono mt-1 uppercase">MANAGER REGISTER NODE // SYSTEM SPECIFICATION SHEET</p>
        </div>
      </div>

      {/* CORE WEB ADM ARCHITECT DECK */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono text-cyber-cyan font-bold uppercase tracking-widest border-b border-white/5 pb-1 max-w-max">1. CHIEF PLATFORM ADMINISTRATOR</h2>
        
        <div className="p-6 glass-panel rounded-xl border border-white/5 bg-black/45 flex flex-col md:flex-row gap-6 items-stretch">
          
          {/* Pulsing profile glow avatar */}
          <div className="flex flex-col items-center justify-center space-y-3 shrink-0">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-cyber-cyan shadow-[0_0_15px_#00f0ff] bg-[#10101f] transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyber-purple/20 via-black/40 to-cyber-cyan/20 z-0" />
              <img
                src="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=300"
                alt="Lead Architect Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover relative z-10 opacity-90 filter brightness-110 contrast-115 grayscale-[15%]"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              <span>LOGGED ONLINE</span>
            </div>
          </div>

          {/* Profile details */}
          <div className="flex-1 flex flex-col justify-between space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="font-display font-black text-white text-lg tracking-wider">ANMOL KUMAR</h3>
              <p className="text-[10px] font-mono text-cyber-cyan uppercase font-bold tracking-widest flex items-center gap-1">
                <span>CHIEF WEB ARCHITECT & DATABASE CUSTODIAN</span>
              </p>
              
              <p className="text-xs text-gray-400 font-sans leading-relaxed pt-2">
                Responsible for full-stack system layout definitions, structural design updates, real-time Firebase DB catalog synchronization, adaptive CSS viewport mechanics, and structural UI enhancements such as the high-density Universal Ad Manager widget modules.
              </p>
            </div>

            {/* Micro operations row */}
            <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("anmolkumar10290@gmail.com");
                  alert("Platform Manager Direct Email copied to system cache: anmolkumar10290@gmail.com");
                }}
                className="px-3 py-1.5 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/25 rounded-md text-[9px] font-mono font-bold text-cyber-cyan transition-all uppercase"
              >
                COPY E-MAIL
              </button>
              
              <button 
                onClick={() => {
                  if (onNavigate) onNavigate('contact');
                }}
                className="px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.07] border border-white/10 rounded-md text-[9px] font-mono font-bold text-gray-300 transition-all uppercase"
              >
                DISPATCH SECURE COMM
              </button>
            </div>

            {/* Compiled dynamic developer social icons */}
            {activeSocials.length > 0 && (
              <div className="border-t border-white/5 pt-3 space-y-2">
                <p className="text-[8px] font-mono text-gray-500 font-bold uppercase tracking-widest">AUTHENTICATED DIGITAL NODES</p>
                <div className="flex flex-wrap gap-2">
                  {activeSocials.map((sl, idx) => (
                    <a
                      key={idx}
                      href={sl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={sl.rawPlatform}
                      className="p-1.5 border border-white/10 hover:border-cyber-cyan bg-white/[0.01] hover:bg-cyber-cyan/10 rounded-md text-xs text-gray-400 hover:text-cyber-cyan flex items-center justify-center transition-all min-w-8 min-h-8"
                    >
                      {getSocialSvgIcon(sl.platform, "w-4 h-4")}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* CORE FRAMEWORK TECHNOLOGY MATRIX */}
      <section className="space-y-4">
        <h2 className="text-xs font-mono text-cyber-purple font-bold uppercase tracking-widest border-b border-white/5 pb-1 max-w-max">2. SOFTWARE TECHNOLOGY MATRIX</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-black/30 border border-white/5 rounded-xl hover:border-cyber-cyan/20 transition text-left space-y-1">
            <p className="text-[9px] font-mono font-bold text-cyber-cyan uppercase">UPLINK STACK</p>
            <p className="text-white text-sm font-display font-black">REACT 18 + TS</p>
            <p className="text-[10px] text-gray-500 font-sans leading-snug">Vite compilation with full module definition files.</p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-xl hover:border-cyber-purple/20 transition text-left space-y-1">
            <p className="text-[9px] font-mono font-bold text-cyber-purple uppercase">RENDERING SHADERS</p>
            <p className="text-white text-sm font-display font-black font-semibold">TAILWIND CSS</p>
            <p className="text-[10px] text-gray-500 font-sans leading-snug">Responsive utility classes and glassmorphic filters.</p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-xl hover:border-cyber-magenta/20 transition text-left space-y-1">
            <p className="text-[9px] font-mono font-bold text-cyber-magenta uppercase">PERSISTENT CACHE</p>
            <p className="text-white text-sm font-display font-black">FIREBASE RTDB</p>
            <p className="text-[10px] text-gray-500 font-sans leading-snug">Realtime data sync, security blueprints & active sync.</p>
          </div>

          <div className="p-4 bg-black/30 border border-white/5 rounded-xl hover:border-green-400/25 transition text-left space-y-1">
            <p className="text-[9px] font-mono font-bold text-green-400 uppercase">SYSTEM ASSETS</p>
            <p className="text-white text-sm font-display font-black">LUCIDE VECTOR CORE</p>
            <p className="text-[10px] text-gray-500 font-sans leading-snug">Mathematical SVG visual outlines for premium indicators.</p>
          </div>
        </div>
      </section>

      {/* CLOSING BUTTON ACCELERATOR */}
      <button 
        onClick={onBack} 
        className="px-6 py-2.5 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-display font-bold text-xs tracking-widest rounded-lg hover:brightness-125 hover:shadow-[0_0_10px_#00f0ff] transition-all cursor-pointer flex items-center gap-2 max-w-max"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO OPERATIONS HUB</span>
      </button>

    </div>
  );
}
