import { parseArgs } from "node:util";

export function parseCliArgs() {
	const { values } = parseArgs({
		args: process.argv.slice(2),
		options: {
			config: { type: "string", short: "c" },
			from: { type: "string", short: "f" },
			debug: { type: "boolean", default: false },
		},
	});

	return values;
}
