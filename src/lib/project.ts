import fs from "node:fs";
import path from "node:path";
import type { HeraldConfig } from "@/define-config";

export function getProjectName(config: HeraldConfig): string {
	if (config.projectName) {
		return config.projectName;
	}

	const packageJsonPath = path.resolve(process.cwd(), "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return "Unknown Project";
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	return packageJson.name ?? "Unknown Project";
}
