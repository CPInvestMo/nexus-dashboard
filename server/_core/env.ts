import { config } from 'dotenv';
config();

export const ENV = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // OAuth
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL || 'https://oauth.manus.space',
  appId: process.env.VITE_APP_ID || '',
  cookieSecret: process.env.COOKIE_SECRET || 'default-secret-change-in-production',
  
  // Owner Configuration
  ownerOpenId: process.env.OWNER_OPEN_ID || '',
  ownerEmail: process.env.OWNER_EMAIL || 'mmaisara@crystalpowerinvestment.com',
  
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  // Production check
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',
};
