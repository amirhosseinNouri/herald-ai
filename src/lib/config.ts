import fs from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
import { interpolateEnvVars } from "@/lib/env";
import { configSchema, type HeraldConfig } from "@/schema/config";

const CONFIG_FILE_NAMES = [
	"herald.config.ts",
	"herald.config.js",
	"herald.config.mjs",
	"herald.config.json",
];

function discoverConfigPath(customPath?: string): string {
	if (customPath) {
		const resolved = path.resolve(process.cwd(), customPath);
		if (!fs.existsSync(resolved)) {
			log.error(`Config file not found: ${resolved}`);
			process.exit(1);
		}
		return resolved;
	}

	for (const name of CONFIG_FILE_NAMES) {
		const candidate = path.resolve(process.cwd(), name);
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	log.error(
		`No config file found. Create one of: ${CONFIG_FILE_NAMES.join(", ")} or use --config <path>`,
	);
	process.exit(1);
}

async function importConfigModule(configPath: string): Promise<unknown> {
	if (configPath.endsWith(".json")) {
		const content = fs.readFileSync(configPath, "utf-8");
		return JSON.parse(content);
	}

	const isBun =
		typeof (globalThis as Record<string, unknown>).Bun !== "undefined";
	const isTsFile = configPath.endsWith(".ts");

	if (isBun || !isTsFile) {
		const module = await import(configPath);
		return module.default ?? module;
	}

	// Node.js with .ts file: compile with esbuild to a temp .mjs file
	const esbuild = await import("esbuild");
	const result = await esbuild.build({
		entryPoints: [configPath],
		bundle: true,
		format: "esm",
		platform: "node",
		write: false,
		packages: "external",
	});

	const code = result.outputFiles[0]?.text;

	if (!code) {
		throw new Error("Failed to compile .ts config file.");
	}

	const configDir = path.dirname(configPath);
	const tempFile = path.join(configDir, `.herald-config-${Date.now()}.mjs`);

	try {
		fs.writeFileSync(tempFile, code);
		const module = await import(tempFile);
		return module.default ?? module;
	} finally {
		fs.unlinkSync(tempFile);
	}
}

async function loadConfig(customPath?: string): Promise<HeraldConfig> {
	const configPath = discoverConfigPath(customPath);

	try {
		const raw = await importConfigModule(configPath);
		const resolved = configPath.endsWith(".json")
			? interpolateEnvVars(raw)
			: raw;
		return configSchema.parse(resolved);
	} catch (error) {
		if (error instanceof Error && error.message.includes("validation")) {
			log.error(`Invalid config: ${error.message}`);
		} else {
			log.error(`Failed to load config from ${configPath}: ${error}`);
		}
		process.exit(1);
	}
}

export { loadConfig };
