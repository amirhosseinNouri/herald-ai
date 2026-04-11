import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CACHE_FILE = path.resolve(process.cwd(), ".herald-cache.json");

interface CacheStore {
	[key: string]: string;
}

function hashCommits(commits: string[]): string {
	return crypto.createHash("sha256").update(commits.join("\n")).digest("hex");
}

function readCache(): CacheStore {
	try {
		if (fs.existsSync(CACHE_FILE)) {
			return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
		}
	} catch {
		// Corrupt cache — ignore
	}
	return {};
}

function writeCache(store: CacheStore): void {
	fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
}

function getCached(commitMessages: string[]): string | undefined {
	const hash = hashCommits(commitMessages);
	return readCache()[hash];
}

function setCached(commitMessages: string[], changelog: string): void {
	const store = readCache();
	store[hashCommits(commitMessages)] = changelog;
	writeCache(store);
}

export { getCached, setCached };
