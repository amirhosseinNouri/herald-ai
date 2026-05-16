import { isCancel, multiselect } from "@clack/prompts";

const BULLET_RE = /^\s*[-*•]\s+/;

function parseBullets(changelog: string): string[] {
	const lines = changelog.split("\n");
	const items: string[] = [];
	let buf: string[] = [];

	const flush = () => {
		if (buf.length) {
			items.push(buf.join("\n").trimEnd());
			buf = [];
		}
	};

	for (const line of lines) {
		if (BULLET_RE.test(line)) {
			flush();
			buf.push(line);
		} else if (buf.length && line.trim()) {
			buf.push(line);
		}
	}
	flush();

	return items;
}

function stripBullet(line: string): string {
	return line.replace(BULLET_RE, "").trim();
}

async function selectChangelogItems(
	changelog: string,
): Promise<string | symbol> {
	const items = parseBullets(changelog);

	if (items.length === 0) {
		return changelog;
	}

	const options = items.map((item, index) => ({
		value: index,
		label: stripBullet(item.split("\n")[0] ?? item),
	}));

	const selected = await multiselect<number>({
		message:
			"Select changelog items to publish (space to toggle, a to toggle all, enter to confirm)",
		options,
		initialValues: options.map((option) => option.value),
		required: false,
	});

	if (isCancel(selected)) {
		return selected;
	}

	const picked = new Set(selected);
	return items.filter((_, index) => picked.has(index)).join("\n");
}

export { selectChangelogItems, parseBullets };
