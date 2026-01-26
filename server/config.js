/**
 * Server configuration and constants
 */

export const config = {
  // Server settings
  port: process.env.PORT || 3001,

  // CORS settings
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173'
    ],
    credentials: true
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // requests per window
    message: { error: 'Too many requests, please try again later' }
  },

  // Request limits
  bodyLimit: '10mb',

  // Database
  database: {
    defaultFps: 30
  },

  // Media types
  mediaTypes: ['video', 'photo'],

  // API versioning
  apiVersion: '1.0.0'
};

export default config;
