import * as Joi from 'joi';

export default Joi.object({
  // ============================================
  // Worker Configuration
  // ============================================
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3002),

  // ============================================
  // Database — PostgreSQL
  // ============================================
  DATABASE_POSTGRES_HOST: Joi.string().default('localhost'),
  DATABASE_POSTGRES_PORT: Joi.number().default(5432),
  DATABASE_POSTGRES_NAME: Joi.string().default('backend_database_postgres'),
  DATABASE_POSTGRES_USER: Joi.string().default('postgres'),
  DATABASE_POSTGRES_PASSWORD: Joi.string().required(),
  DATABASE_POSTGRES_SYNCHRONIZE: Joi.boolean().default(false),
  DATABASE_POSTGRES_LOGGING: Joi.boolean().optional(),
  DATABASE_POSTGRES_TIMEZONE: Joi.string().default('UTC'),

  // ============================================
  // Database — MongoDB (notificações in-app)
  // ============================================
  MONGO_URI: Joi.string().optional(),
  DATABASE_MONGO_HOST: Joi.string().default('database_mongo'),
  DATABASE_MONGO_PORT: Joi.number().default(27017),
  DATABASE_MONGO_USERNAME: Joi.string().default('mongo'),
  DATABASE_MONGO_PASSWORD: Joi.string().optional(),
  DATABASE_MONGO_NAME: Joi.string().default('backend_database_mongo'),
  DATABASE_MONGO_TIMEZONE: Joi.string().default('Z'),
  DATABASE_MONGO_LOGGING: Joi.boolean().default(true),
  DATABASE_MONGO_SYNCHRONIZE: Joi.boolean().default(false),

  // ============================================
  // Database — PostgreSQL E2E (usado quando NODE_ENV=test)
  // ============================================
  DATABASE_POSTGRES_TEST_E2E_HOST: Joi.string().optional(),
  DATABASE_POSTGRES_TEST_E2E_PORT: Joi.number().optional(),
  DATABASE_POSTGRES_TEST_E2E_NAME: Joi.string().optional(),
  DATABASE_POSTGRES_TEST_E2E_USER: Joi.string().optional(),
  DATABASE_POSTGRES_TEST_E2E_PASSWORD: Joi.string().optional(),
  DATABASE_POSTGRES_TEST_E2E_SYNCHRONIZE: Joi.boolean().optional(),
  DATABASE_POSTGRES_TEST_E2E_LOGGING: Joi.boolean().optional(),
  DATABASE_POSTGRES_TEST_E2E_TIMEZONE: Joi.string().optional(),

  // ============================================
  // Database — MongoDB E2E (usado quando NODE_ENV=test)
  // ============================================
  DATABASE_MONGO_TEST_E2E_HOST: Joi.string().optional(),
  DATABASE_MONGO_TEST_E2E_PORT: Joi.number().optional(),
  DATABASE_MONGO_TEST_E2E_USERNAME: Joi.string().optional(),
  DATABASE_MONGO_TEST_E2E_PASSWORD: Joi.string().optional(),
  DATABASE_MONGO_TEST_E2E_NAME: Joi.string().optional(),
  DATABASE_MONGO_TEST_E2E_TIMEZONE: Joi.string().optional(),
  DATABASE_MONGO_TEST_E2E_LOGGING: Joi.boolean().optional(),
  DATABASE_MONGO_TEST_E2E_SYNCHRONIZE: Joi.boolean().optional(),

  // ============================================
  // RabbitMQ
  // ============================================
  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_EXCHANGE: Joi.string().default('zolve.events'),
  RABBITMQ_PREFETCH: Joi.number().default(10),

  // ============================================
  // Retry Strategy
  // ============================================
  WORKER_MAX_RETRIES: Joi.number().default(3),
  WORKER_RETRY_DELAY_MS: Joi.number().default(60000),
  WORKER_DLQ_ENABLED: Joi.boolean().default(true),

  // ============================================
  // E-mail (SMTP — SendGrid ou similar)
  // ============================================
  SMTP_HOST: Joi.string().default('smtp.sendgrid.net'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default('apikey'),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  SMTP_FROM_NAME: Joi.string().default('ZOLVE'),
  SMTP_FROM_EMAIL: Joi.string().default('noreply@zolve.com.br'),

  // ============================================
  // Firebase (Push Notifications)
  // ============================================
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').optional(),
});
