import fs from 'fs';
import path from 'path';
import type { Config } from '@/types/config';

let config: Config;

const loadConfig = async () => {
  if (config) {
    return Promise.resolve(config);
  }

  const configFile = path.resolve(process.cwd(), '.herald.config.ts');
  if (!fs.existsSync(configFile)) {
    throw new Error('Herald config file not found');
  }
  const module = (await import(configFile)) as {
    default: Config;
  };
  config = module.default;
  return config;
};

export { loadConfig };
