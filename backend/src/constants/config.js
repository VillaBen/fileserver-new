// src/constants/config.js
module.exports = {
  // Server Config
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  HTTPS: process.env.HTTPS === 'true',

  // Security Config
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || '0123456789abcdef0123456789abcdef',
  CSRF_SECRET: process.env.CSRF_SECRET || 'dev-secret-change-in-production',

  // Database Config
  DB_PATH: process.env.DB_PATH || './database/fileserver.db',

  // Storage Config
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads/encrypted',
  AVATAR_DIR: process.env.AVATAR_DIR || './avatars',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB

  // SMTP Config
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@example.com',

  // Session Config
  SESSION_NAME: process.env.SESSION_NAME || 'fileserver-sid',
  SESSION_AGE: parseInt(process.env.SESSION_AGE) || 86400000, // 24h

  // Validation Config
  USERNAME_MIN_LENGTH: 2,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,

  // Storage Quota
  DEFAULT_STORAGE_QUOTA: 10 * 1024 * 1024 * 1024, // 10GB
};
