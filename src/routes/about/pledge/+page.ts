import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Dummy data - will be replaced with DB query later
	return {
		verifiedPledges: 15
	};
};
