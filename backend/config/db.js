const { Pool } = require('pg');

// Configure connection based on environment
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  database: process.env.DB_NAME || 'security_onboarding',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'postgres',
};

// Check if running in Cloud Run with Cloud SQL (Unix socket)
if (process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/')) {
  // Cloud SQL Unix socket connection
  dbConfig.host = process.env.DB_HOST;
} else {
  // Regular TCP connection (local development)
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 5432;
}

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

module.exports = pool;
