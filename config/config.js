require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION || '24h',
  },
  api: {
    externalKey: process.env.EXTERNAL_API_KEY,
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
};

