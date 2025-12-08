import fs from 'fs';
import path from 'path';
import { log } from '@clack/prompts';

const extractPackageVersion = (): string => {
  if (!fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
    log.error('Package.json file not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
  );

  return `v${packageJson.version}`;
};

export { extractPackageVersion };
