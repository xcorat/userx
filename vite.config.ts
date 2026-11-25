import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const vendorDir = fileURLToPath(new URL('./vendor', import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['$wasm']
	},
	server: {
		fs: {
			allow: [vendorDir]
		},
		proxy: {
			'/relay': {
				target: 'http://127.0.0.1:8080',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/relay/, '')
			}
		}
	}
});
