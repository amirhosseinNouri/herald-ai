export type Spinner = {
	start: (msg?: string) => void;
	stop: (msg?: string, code?: number) => void;
	message: (msg?: string) => void;
};
