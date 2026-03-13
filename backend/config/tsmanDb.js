const { Pool } = require('pg');

// Second connection pool — points to tsmandb on the same GCP Cloud SQL host
const tsmanDbConfig = {
  user: process.env.TSMAN_DB_USER || 'postgres',
  database: process.env.TSMAN_DB_NAME || 'tsmandb',
  password: process.env.TSMAN_DB_PASSWORD,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  max: 3,
};

const tsmanHost = process.env.TSMAN_DB_HOST || process.env.DB_HOST || 'localhost';
if (tsmanHost.startsWith('/cloudsql/')) {
  tsmanDbConfig.host = tsmanHost;
} else {
  tsmanDbConfig.host = tsmanHost;
  tsmanDbConfig.port = parseInt(process.env.TSMAN_DB_PORT || '5432');
}

const tsmanPool = new Pool(tsmanDbConfig);

tsmanPool.on('connect', () => {
  console.log('Connected to tsmandb (ts_man database)');
});

tsmanPool.on('error', (err) => {
  console.error('tsmandb pool error (non-fatal):', err.message);
});

module.exports = tsmanPool;
