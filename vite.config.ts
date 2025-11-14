import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		// Flag for conditional compilation
		__CLOUDFLARE__: process.env.CF_PAGES === 'true' || process.env.NODE_ENV === 'production'
	},
	ssr: {
		// Exclude SQLite-related modules from SSR bundling for Cloudflare Workers
		external: process.env.CF_PAGES === 'true' || process.env.NODE_ENV === 'production'
			? ['better-sqlite3', 'sqlite3', 'fs', 'path']
			: []
	}
});
