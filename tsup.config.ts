import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		format: ["cjs"],
		outDir: "dist",
		clean: true,
		minify: false,
		sourcemap: false,
		target: "node18",
		external: ["zod", "esbuild"],
		banner: {
			js: "#!/usr/bin/env node",
		},
	},
	{
		entry: ["src/define-config.ts"],
		format: ["cjs", "esm"],
		outDir: "dist",
		clean: false,
		dts: true,
		minify: false,
		sourcemap: false,
		target: "node18",
		external: ["zod"],
	},
]);
