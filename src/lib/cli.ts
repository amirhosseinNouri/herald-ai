import { parseArgs } from "node:util";

export function parseCliArgs() {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			config: { type: "string", short: "c" },
			from: { type: "string", short: "f" },
			prompt: { type: "string", short: "p" },
			debug: { type: "boolean", default: false },
			interactive: { type: "boolean" },
		},
	});

	return values;
}

export type Args = ReturnType<typeof parseCliArgs>;
