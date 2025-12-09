import fs from 'fs';
import path from 'path';

const extractPackageVersion = (): string => {
  if (!fs.existsSync(path.resolve(process.cwd(), 'package.json'))) {
    throw new Error('Package.json file not found');
  }

  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
  );

  return `v${packageJson.version}`;
};

export { extractPackageVersion };
