export interface GitTag {
	name: string;
	date: string;
}

export interface LocalCommit {
	hash: string;
	author: string;
	title: string;
	message: string;
}
