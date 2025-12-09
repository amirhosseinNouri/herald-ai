import { extractPackageVersion } from '@/lib/package';
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import fs from 'fs';

const mockExistsSync = mock(() => true);
const mockReadFileSync = mock(() => '{}');

describe('lib => extractPackageVersion', () => {
  beforeEach(() => {
    (fs.existsSync as any) = mockExistsSync;
    (fs.readFileSync as any) = mockReadFileSync;

    mockExistsSync.mockClear();
    mockReadFileSync.mockClear();
  });

  afterEach(() => {
    mockExistsSync.mockRestore();
    mockReadFileSync.mockRestore();
  });

  it('should extract the package version from package.json correctly', () => {
    const mockPackageJson = {
      name: 'test-package',
      version: '1.2.3',
      description: 'Test package',
    };

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify(mockPackageJson));

    expect(extractPackageVersion()).toBe(`v${mockPackageJson.version}`);
  });

  it('should throw an error when package.json does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    expect(() => extractPackageVersion()).toThrowError();
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });
});
