/**
 * Selectors shared by every ParaBank page: header, left menu, footer and the
 * generic error banner. Verified against the live DOM.
 */
export const commonLocators = {
  // Header
  headerPanel: '#headerPanel',
  logo: '.logo',
  logoLink: '#headerPanel .logo a, #topPanel a',
  topMenu: '#headerPanel ul.leftmenu',
  topMenuLink: (label: string) => `#headerPanel ul.leftmenu a:text-is("${label}")`,

  // Left panel - login form (anonymous) and Account Services menu (authenticated)
  leftPanel: '#leftPanel',
  loginPanel: '#loginPanel',
  accountServicesHeading: '#leftPanel h2',
  accountServicesMenu: '#leftPanel ul',
  accountServicesLinks: '#leftPanel ul li a',
  menuLink: (label: string) => `#leftPanel ul li a:text-is("${label}")`,
  welcomeText: '#leftPanel p.smallText',
  logoutLink: '#leftPanel a[href*="logout.htm"]',

  // Right panel - page body
  rightPanel: '#rightPanel',
  pageTitle: '#rightPanel h1.title',
  errorMessage: '#rightPanel p.error',

  // Footer
  footerPanel: '#footerPanel',
  footerLinks: '#footerPanel ul li a',
  contactUsLink: '#footerPanel a[href*="contact.htm"]',
} as const;
