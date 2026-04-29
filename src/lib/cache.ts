import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { LocalCommit } from "@/types/git";

interface CacheStore {
	[key: string]: string;
}

function getCacheFile(): string {
	return path.resolve(process.cwd(), ".herald-cache.json");
}

function hashCommits(commits: LocalCommit[]): string {
	const payload = commits.map(({ author, message }) => ({ author, message }));
	return crypto
		.createHash("sha256")
		.update(JSON.stringify(payload))
		.digest("hex");
}

function readCache(): CacheStore {
	try {
		const cacheFile = getCacheFile();
		if (fs.existsSync(cacheFile)) {
			return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
		}
	} catch {
		// Corrupt cache — ignore
	}
	return {};
}

function writeCache(store: CacheStore): void {
	fs.writeFileSync(getCacheFile(), JSON.stringify(store, null, 2));
}

function getCached(commits: LocalCommit[]): string | undefined {
	const hash = hashCommits(commits);
	return readCache()[hash];
}

function setCached(commits: LocalCommit[], changelog: string): void {
	const store = readCache();
	store[hashCommits(commits)] = changelog;
	writeCache(store);
}

export { getCached, setCached };
