import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: false,
  target: 'node18',
  external: ['zod', 'ai', 'ollama-ai-provider-v2'],
  banner: {
    js: '#!/usr/bin/env node',
  },
});
