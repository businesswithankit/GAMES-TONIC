import { SiteSettings } from '../types';

export interface AILegalDocument {
  title: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}

export function generateAILegalContent(slug: string, siteSettings: SiteSettings): AILegalDocument {
  const name = siteSettings.siteName || 'Games Tonic';
  const url = siteSettings.canonicalUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://gamestonic.com');
  const email = (siteSettings as any).contactPage?.email || siteSettings.footerLinks?.support || `support@${url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`;

  switch (slug) {
    case 'privacy':
      return {
        title: `${name.toUpperCase()} PRIVACY POLICY & DATA PROTECTION GOVERNANCE`,
        seoTitle: `Privacy Policy | ${name}`,
        seoDescription: `Official Privacy Policy and data protection standards for ${name} (${url}). Learn how your user privacy and telemetry data are safeguarded.`,
        content: `INTRODUCTION & SCOPE
Welcome to ${name} ("we," "our," or "us"), accessible at ${url}. Protecting your privacy and ensuring the security of your personal information is our highest operational priority. This Privacy Policy outlines our principles and practices regarding the collection, use, storage, and protection of personal telemetry and data when you browse our platform, utilize our gaming mod indices, watch stream broadcasts, or communicate with our support infrastructure.

THE DATA WE COLLECT
We collect several types of information to provide, maintain, and optimize your experience on ${name}:
1. Automatic Technical Telemetry: When you access ${url}, our servers automatically record standard web server log entry files. This includes your Internet Protocol (IP) address, browser type and version, language preferences, referring/exit web pages, operating system architecture, date/time stamps, and clickstream interactions.
2. User-Provided Information: When you contact us via our communication dispatches, submit suggestions, or interact with our community channels, we collect information you voluntarily provide, such as your display handle, direct correspondence email address (${email}), and message content.
3. Cookies and Advertising Identifiers: We utilize cookies, web beacons, and persistent local storage technologies to store your preferences, analyze usage trends, and deliver relevant advertisements.

HOW WE USE YOUR INFORMATION
${name} processes data strictly for legitimate operational purposes:
- To deliver, maintain, and enhance the visual and functional performance of our digital gaming catalog.
- To personalize your user journey and preserve user preferences across sessions.
- To analyze platform metrics, audience engagements, and stream performance to improve site navigation.
- To prevent security threats, detect unauthorized access, and protect against malicious cyber activity.
- To respond directly to your correspondence and support requests received at ${email}.

THIRD-PARTY ADVERTISING & GOOGLE ADSENSE DISCLOSURE
This platform utilizes third-party advertising partners, including Google AdSense and programmatic advertising platforms, to serve relevant advertisements.
- Google, as a third-party vendor, uses cookies (including the DART cookie) to serve ads based on your visits to ${url} and other websites across the internet.
- Users may opt out of personalized advertising by visiting the Google Ad and Content Network Privacy Policy or by configuring their browser cookie management preferences.
- Third-party ad networks may automatically receive your IP address when ad placements render on your screen. They may also employ cookies, JavaScript, or Web Beacons to measure campaign effectiveness or personalize ad content. ${name} has no control over these third-party cookies.

DATA SECURITY & STORAGE
We implement multi-layered administrative, technical, and physical security measures to safeguard your personal data against unauthorized access, alteration, disclosure, or destruction. All network communications are encrypted via Secure Sockets Layer (SSL/TLS) protocols.

YOUR DATA PROTECTION RIGHTS
Under applicable international data privacy frameworks (including GDPR and CCPA/CPRA), you possess the following rights regarding your data:
- The Right to Access: You may request copies of the personal information stored in our databases.
- The Right to Rectification: You may request that we correct or update any inaccurate or incomplete personal records.
- The Right to Erasure: You may request the deletion of your personal correspondence records, subject to legal compliance requirements.
- To exercise any of these rights, please contact our Data Governance Team at ${email}.

UPDATES TO THIS PRIVACY POLICY
We reserve the right to revise or update this Privacy Policy at any time to reflect operational, legal, or regulatory changes. Updated policies will be posted directly to ${url}/privacy with an updated revision date.

CONTACT INFORMATION
If you have questions or concerns regarding this Privacy Policy, please reach out to us at:
${name} Digital Governance HQ
Email: ${email}
Website: ${url}`
      };

    case 'terms':
      return {
        title: `${name.toUpperCase()} TERMS OF SERVICE & USER AGREEMENT`,
        seoTitle: `Terms & Conditions | ${name}`,
        seoDescription: `Official Terms of Service and User Agreement for ${name} (${url}). Read our community rules, mod distribution licenses, and legal terms.`,
        content: `AGREEMENT TO TERMS
By accessing or using ${name} (${url}), you agree to be legally bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.

INTELLECTUAL PROPERTY & CONTENT LICENSING
1. Platform Content: All proprietary text, graphics, logos, custom user interface elements, button styles, and source code on ${name} are the property of ${name} and protected by copyright and intellectual property laws.
2. Gaming Mods & Community Assets: All third-party gaming modifications, community patches, and fan art indexed on ${name} belong to their respective original creators and rights holders. ${name} acts as a distribution directory and information index and claims no ownership over third-party intellectual property.
3. Limited License: Permission is granted to temporarily access and view materials on ${name} for personal, non-commercial entertainment purposes only.

USER CONDUCT & RESPONSIBILITIES
When interacting with ${name}, you agree NOT to:
- Attempt to decompile, reverse engineer, or exploit any software engine powering the platform.
- Use automated scripts, bots, scrapers, or crawlers to extract site content without explicit authorization.
- Transmit or upload any malicious code, viruses, trojans, or destructive scripts.
- Bypass, disable, or tamper with security protocols, ad delivery engines, or user access controls.
- Submit fraudulent, abusive, defamatory, or unlawful dispatches through our support and contact forms.

THIRD-PARTY LINKS & MONETIZATION
${name} contains links to third-party websites, video streaming services, and sponsored ad placements. We do not control, endorse, or assume responsibility for the content, privacy policies, or practices of any third-party websites or services. Accessing third-party links is at your own risk.

LIMITATION OF LIABILITY
In no event shall ${name}, its operators, administrators, or affiliates be liable for any damages (including, without limitation, direct, indirect, incidental, consequential, or punitive damages, loss of data or profit, or business interruption) arising out of the use or inability to use the materials or services on ${url}.

DISCLAIMER OF WARRANTIES
All services, mod listings, video feeds, and informational dispatches provided on ${name} are made available on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied.

GOVERNING LAW & JURISDICTION
These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.

CONTACT FOR LEGAL NOTICES
For formal legal notices or inquiries regarding this User Agreement, please contact us at:
Email: ${email}
Website: ${url}`
      };

    case 'disclaimer':
      return {
        title: `${name.toUpperCase()} COMPLIANCE & LIABILITY DISCLAIMER`,
        seoTitle: `Compliance Disclaimer | ${name}`,
        seoDescription: `Official Disclaimer for ${name} (${url}). Important notices regarding third-party game mods, brand non-affiliation, and site liability.`,
        content: `GENERAL DISCLAIMER
The information, articles, video broadcasts, and downloadable modification directories provided on ${name} (${url}) are published in good faith and for general informational, educational, and entertainment purposes only. ${name} makes no warranties regarding the completeness, reliability, or accuracy of this information.

GAME PUBLISHER NON-AFFILIATION DISCLAIMER
${name} is an independent gaming community portal and modification directory. ${name} is NOT affiliated with, authorized, endorsed, sponsored, or certified by any game developer, console manufacturer, or game publisher (including but not limited to Rockstar Games, Valve, Epic Games, Nintendo, Sony, Microsoft, or EA Games). All game titles, character names, trademarks, logos, and registered assets referenced across this site remain the exclusive property of their respective trademark owners.

GAMING MODIFICATIONS & SOFTWARE DISCLAIMER
All community mods, patches, and custom scripts indexed on ${name} are developed by independent creators. Downloading, installing, or applying custom modifications to your video game files is performed entirely at your own risk. ${name} shall not be held responsible for any technical issues, file corruption, account bans, or software glitches resulting from third-party modifications. We strongly recommend creating backup copies of your original game files prior to applying any modifications.

ADVERTISING & SPONSOR DISCLOSURE
${name} utilizes Google AdSense, programmatic display advertising networks, and direct sponsor banner placements to fund site hosting and operational development. Advertisements displayed on this site do not constitute an endorsement or recommendation by ${name}. We are not responsible for the products, services, or claims offered by third-party advertisers.

EXTERNAL LINKS DISCLAIMER
From ${url}, you may visit external websites by following hyperlinks to outside networks. While we strive to provide only quality links to ethical websites, we have no control over the content and nature of these external sites.

REVISION & UPDATES
We reserve the right to amend, update, or modify this Disclaimer at any time without prior notice.

CONTACT US
If you require any further information or have questions about our site disclaimer, please contact us at ${email}.`
      };

    case 'cookie':
      return {
        title: `${name.toUpperCase()} COOKIE & TRACKING TECHNOLOGY POLICY`,
        seoTitle: `Cookie Policy | ${name}`,
        seoDescription: `Official Cookie Policy for ${name} (${url}). Details on how we use essential, analytics, and Google AdSense advertising cookies.`,
        content: `WHAT ARE COOKIES?
Cookies are small text files stored on your computer or mobile device when you visit websites. They are widely used to make websites work efficiently, remember user preferences, and provide analytical telemetry to site operators.

HOW ${name.toUpperCase()} USES COOKIES
At ${name} (${url}), we use cookies and similar tracking technologies to enhance your browsing experience and deliver tailored content:

1. Essential & Functional Cookies: These cookies are strictly necessary to enable core platform features, such as preserving navigation state, theme settings, and securing user interactions across sessions.
2. Analytics & Performance Cookies: We utilize analytical tools (such as Google Analytics) to measure site traffic, understand audience navigation patterns, and identify popular gaming content. These cookies collect aggregated, anonymous data.
3. Advertising & Targeting Cookies: Third-party vendors, including Google AdSense and programmatic advertising platforms, use cookies to serve ads based on your prior visits to ${url} or other websites on the internet.

GOOGLE ADSENSE & DOUBLECLICK COOKIES
- Google uses cookies to display personalized ads on ${name}.
- The DoubleClick cookie enables Google and its partners to serve ads based on your visit to our site and/or other sites on the Internet.
- You can opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com).

MANAGING & DISABLING COOKIES
You have the right to accept or decline cookies. Most web browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer:
- Google Chrome: Settings > Privacy and security > Cookies and other site data
- Mozilla Firefox: Options > Privacy & Security > Cookies and Site Data
- Apple Safari: Preferences > Privacy > Block all cookies
- Microsoft Edge: Settings > Site permissions > Cookies and site data

Please note that disabling certain cookies may impact the functionality or visual performance of ${name}.

CONTACT US
If you have questions regarding our Cookie Policy, please reach out to our team at ${email}.`
      };

    case 'dmca':
      return {
        title: `${name.toUpperCase()} DMCA COPYRIGHT COMPLIANCE & TAKEDOWN POLICY`,
        seoTitle: `DMCA Copyright Policy | ${name}`,
        seoDescription: `Official Digital Millennium Copyright Act (DMCA) policy for ${name} (${url}). Guidelines for submitting copyright notice takedown requests.`,
        content: `DMCA POLICY & SAFE HARBOR COMPLIANCE
${name} (${url}) respects the intellectual property rights of creators, game developers, modders, and copyright owners. We comply strictly with the Digital Millennium Copyright Act (DMCA) and international copyright protection standards.

${name} operates as an interactive information catalog, content hub, and community index. We do not claim ownership of third-party game modifications, logos, or trademarks indexed on our platform.

SUBMITTING A DMCA TAKEDOWN NOTICE
If you are a copyright owner or an authorized agent thereof and believe that any content, mod listing, image, or media indexed on ${url} infringes upon your copyright, you may submit a formal DMCA Takedown Notice containing the following information in writing:

1. Identification of Copyrighted Work: A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed, alongside a description of the copyrighted work claimed to have been infringed.
2. Identification of Infringing Material: Clear identification of the material or link that is claimed to be infringing, including the exact URL on ${url} where the material is located.
3. Contact Information: Information reasonably sufficient to permit ${name} to contact you, such as your full legal name, company title, physical address, telephone number, and direct email address.
4. Statement of Good Faith: A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
5. Statement Under Penalty of Perjury: A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

DESIGNATED DMCA COMPLIANCE OFFICER
Please send all official DMCA Takedown Notices to our designated Copyright Compliance Agent at:
${name} Legal Operations
Email: ${email}
Subject Line: "DMCA TAKEDOWN REQUEST - [Your Brand/Content Title]"

COUNTER-NOTIFICATION PROCEDURE
If you believe your content or mod listing was removed or disabled by mistake or misidentification, you may submit a written counter-notification to our DMCA Agent at ${email} containing your full contact details, identification of the removed material, and a statement under penalty of perjury requesting reinstatement.

REPEAT INFRINGER POLICY
${name} maintains a strict policy to terminate access or remove listings from any user or contributor who is determined to be a repeat infringer of intellectual property rights.`
      };

    case 'about':
      return {
        title: `ABOUT ${name.toUpperCase()} - DIGITAL GAMING HUB`,
        seoTitle: `About Us | ${name}`,
        seoDescription: `Discover the mission, vision, and gaming ecosystem powering ${name} (${url}). Premier destination for game mods, video streams, and gaming intel.`,
        content: `OUR MISSION & VISION
Welcome to ${name} (${url}), the ultimate digital destination for gamers, modding enthusiasts, video creators, and interactive media fans. Founded with a vision to deliver a high-speed, futuristic platform for gaming content, ${name} bridges the gap between game modifications, developer intelligence, live stream broadcasts, and community engagement.

WHAT WE PROVIDE
- Gaming Mods & Expansions: Comprehensive, curated directories featuring community patches, graphical enhancements, script revisions, and gameplay overhauls.
- Video Broadcast Center: High-definition video streams, trailer reveals, and gameplay breakdowns from premier gaming channels.
- Gaming Intel & Articles: In-depth white papers, patch notes, strategy guides, and industry news written by passionate gaming experts.
- Community Events & Timelines: Live release schedules, community tournaments, and interactive updates.

OUR COMMITMENT TO QUALITY
At ${name}, we prioritize clean navigation, ultra-fast performance, user safety, and strict compliance with digital privacy and copyright standards. Our platform is built using modern cloud infrastructure to ensure effortless browsing across desktop and mobile devices.

CONNECT WITH HQ
For brand partnerships, developer inquiries, mod submissions, or support, please reach out to our team at ${email}.`
      };

    case 'support':
      return {
        title: `${name.toUpperCase()} HELP & TECHNICAL SUPPORT HUB`,
        seoTitle: `Help & Support | ${name}`,
        seoDescription: `Get technical help, troubleshooting guides, and support for ${name} (${url}). Need assistance? Contact our team.`,
        content: `WELCOME TO SUPPORT HQ
At ${name} (${url}), we are dedicated to providing a seamless experience across our gaming catalog, mod indices, and video broadcasts. If you encounter any technical issues, broken links, or need assistance, our support team is ready to help.

COMMON TROUBLESHOOTING GUIDES
1. Game Mods Installation:
   - Always ensure you read the specific installation notes included with each modification.
   - Verify that your base game version matches the required mod specifications.
   - Backup your original game files prior to applying custom patches.

2. Video Broadcast Playback:
   - Ensure your web browser has JavaScript enabled and is updated to the latest version.
   - If a video fails to render, check your internet connectivity or disable aggressive browser extensions that may block media embeds.

3. Site Performance & Display:
   - If pages appear cached or outdated, try performing a hard refresh (Ctrl + F5 or Cmd + Shift + R).
   - Clear your browser cache and cookies if you experience display glitches.

REACHING OUR SUPPORT TEAM
If your query is not resolved by the guides above, please transmit a support dispatch directly to us:
Email: ${email}
Platform HQ: ${name} Operations Center

Please include detailed information about your issue (operating system, browser type, page URL, and relevant error messages) so we can assist you promptly.`
      };

    default:
      return {
        title: `${name.toUpperCase()} - ${slug.toUpperCase()} INFORMATION`,
        seoTitle: `${slug.toUpperCase()} | ${name}`,
        seoDescription: `Official ${slug} page for ${name} (${url}).`,
        content: `WELCOME TO ${name.toUpperCase()} (${url})
This legal and informational document applies to ${name}. 

For inquiries regarding this section, please contact our administrative team at ${email}.`
      };
  }
}
