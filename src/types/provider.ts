export interface AnnouncementPayload {
	projectName: string;
	tag: string;
	changelog: string;
	releaseManager: string;
}

export interface AnnouncementProvider {
	name: string;
	announce(payload: AnnouncementPayload): Promise<void>;
}
