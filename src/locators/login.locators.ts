/** Home page / Customer Login panel. Verified against the live DOM. */
export const loginLocators = {
  usernameInput: 'input[name="username"]',
  passwordInput: 'input[name="password"]',
  loginButton: 'input[type="submit"][value="Log In"]',
  registerLink: '#loginPanel a[href*="register.htm"]',
  forgotLoginLink: '#loginPanel a[href*="lookup.htm"]',
  errorTitle: '#rightPanel h1.title',
  errorMessage: '#rightPanel p.error',
} as const;
