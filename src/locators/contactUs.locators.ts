/** Customer Care / Contact Us form, reached from the footer. Verified against the live DOM. */
export const contactUsLocators = {
  form: '#contactForm',
  pageTitle: '#rightPanel h1.title',
  name: 'input[name="name"]',
  email: 'input[name="email"]',
  phone: 'input[name="phone"]',
  message: 'textarea[name="message"]',
  sendButton: 'input[type="submit"][value="Send to Customer Care"]',
  /** After submit the h1 still reads "Customer Care"; the thank-you is a paragraph. */
  confirmationHeading: '#rightPanel h1.title',
  thankYouMessage: '#rightPanel p:nth-of-type(1)',
  followUpMessage: '#rightPanel p:nth-of-type(2)',
} as const;
