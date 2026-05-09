import fs from "node:fs";
import path from "node:path";
import { log } from "@clack/prompts";
import type { HeraldConfig } from "@/define-config";
import type { Args } from "./cli";

export const extractCustomPrompt = (args: Args, config: HeraldConfig) => {
	const promptPath = args.prompt ?? config.promptFile;
	if (promptPath) {
		const resolved = path.resolve(process.cwd(), promptPath);
		if (!fs.existsSync(resolved)) {
			log.error(`Prompt file not found: ${resolved}`);
			process.exit(1);
		}
		const prompt = fs.readFileSync(resolved, "utf-8");
		return prompt;
	}

	return "";
};
