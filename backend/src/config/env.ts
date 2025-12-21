import dotenv from 'dotenv';

// Load .env file but allow environment variables to override
dotenv.config({ override: false });

export type AppConfig = {
  nodeEnv: string;
  app: {
    port: number;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  auth: {
    jwtSecret: string;
    tokenExpiresIn: string;
  };
  integrations: {
    rapidApiKey?: string;
    rapidApiTravelAdvisorHost?: string;
    openAiApiKey?: string;
  };
};

let cachedConfig: AppConfig | null = null;

export const loadEnv = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const {
    NODE_ENV = 'development',
    APP_PORT = '3000',
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_USERNAME = 'dev_user',
    DB_PASSWORD = 'dev_pass',
    DB_NAME = 'tour_saas',
    JWT_SECRET = 'supersecretjwt',
    JWT_EXPIRES_IN = '12h',
    RAPIDAPI_KEY,
    RAPIDAPI_TRAVEL_ADVISOR_HOST,
    OPENAI_API_KEY,
  } = process.env;

  cachedConfig = {
    nodeEnv: NODE_ENV,
    app: {
      port: Number(APP_PORT),
    },
    database: {
      host: DB_HOST,
      port: Number(DB_PORT),
      username: DB_USERNAME,
      password: DB_PASSWORD,
      name: DB_NAME,
    },
    auth: {
      jwtSecret: JWT_SECRET,
      tokenExpiresIn: JWT_EXPIRES_IN,
    },
    integrations: {
      rapidApiKey: RAPIDAPI_KEY,
      rapidApiTravelAdvisorHost: RAPIDAPI_TRAVEL_ADVISOR_HOST,
      openAiApiKey: OPENAI_API_KEY,
    },
  };

  return cachedConfig;
};
