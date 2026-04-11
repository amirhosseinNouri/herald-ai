import type { HeraldConfig } from "@/define-config";
import packageJson from "../../package.json";

export function getProjectName(config: HeraldConfig): string {
	return config.projectName ?? packageJson.name ?? "Unknown Project";
}
