/**
 * Recursively interpolates environment variable references in a parsed JSON value.
 * Supports $VAR and ${VAR} syntax in string values.
 */
function interpolateEnvVars(value: unknown): unknown {
	if (typeof value === "string") {
		return value.replace(/\$\{(\w+)\}|\$(\w+)/g, (match, braced, bare) => {
			const varName = braced ?? bare;
			return process.env[varName] ?? match;
		});
	}

	if (Array.isArray(value)) {
		return value.map(interpolateEnvVars);
	}

	if (value !== null && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			result[k] = interpolateEnvVars(v);
		}
		return result;
	}

	return value;
}

export { interpolateEnvVars };
