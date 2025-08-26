import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG === "true"
    ? (msg: string) => console.log(`[Sequelize] ${new Date().toISOString()}: ${msg}`)
    : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 60000,
    idle: 10000,
    evict: 1000 * 60 * 2,
  },
  retry: {
    max: 5,
    timeout: 60000,
    match: [
      /Deadlock/i,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeConnectionTimedOutError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionAcquireTimeoutError/,
      /Connection terminated unexpectedly/,
      /Operation timeout/,
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ENOTFOUND/
    ]
  },
  dialectOptions: {
    connectTimeout: 60000,
    socketTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  },
};
