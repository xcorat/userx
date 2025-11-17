// Username route layout load function with validation
import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import DIContainer from '$lib/config/di-container';

export const load = async ({ params, url }: { params: { username: string }; url: URL }) => {
	const { username } = params;
	
	// Only validate in browser after auth is loaded
	if (browser) {
		try {
			// Check if username exists
			const userService = DIContainer.getUserService();
			const user = await userService.getUserByUsername(username);
			
			if (!user) {
				throw redirect(404, '/');
			}
			
			return {
				username,
				profileUser: user
			};
		} catch (error) {
			console.error('Username validation error:', error);
			throw redirect(307, '/');
		}
	}
	
	return {
		username,
		profileUser: null
	};
};