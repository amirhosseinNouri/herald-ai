const isError = (error: unknown): error is Error => {
	return typeof error === "object" && error !== null && "message" in error;
};

export { isError };
