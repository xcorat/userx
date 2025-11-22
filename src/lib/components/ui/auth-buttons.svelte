<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { onJoin, onLogin }: { onJoin: () => void; onLogin: () => void } = $props();

	let keyframeStyle = $state('');

	function randomBetween(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	function generateRandomKeyframes(
		animationName: string,
		numPaths: number,
		pointsPerPath: number,
		maxX: number,
		maxY: number,
		duration: number
	): string {
		let keyframes = `@keyframes ${animationName} {\n`;
		const pathDuration = 100 / numPaths;

		for (let path = 0; path < numPaths; path++) {
			const pathStart = path * pathDuration;
			const pathEnd = (path + 1) * pathDuration;
			const stepDuration = pathDuration / (pointsPerPath + 1);

			// Start at origin
			if (path === 0) {
				keyframes += `\t0% {\n\t\ttransform: translate(-50%, -50%) translate(0px, 0px);\n\t}\n`;
			} else {
				keyframes += `\t${pathStart.toFixed(2)}% {\n\t\ttransform: translate(-50%, -50%) translate(0px, 0px);\n\t}\n`;
			}

			// Generate random points for this path
			for (let i = 1; i <= pointsPerPath; i++) {
				const percentage = pathStart + stepDuration * i;
				const x = Math.round(randomBetween(-maxX, maxX));
				const y = Math.round(randomBetween(-maxY, maxY));
				keyframes += `\t${percentage.toFixed(2)}% {\n\t\ttransform: translate(-50%, -50%) translate(${x}px, ${y}px);\n\t}\n`;
			}

			// End path at origin
			if (path === numPaths - 1) {
				keyframes += `\t100% {\n\t\ttransform: translate(-50%, -50%) translate(0px, 0px);\n\t}\n`;
			} else {
				keyframes += `\t${pathEnd.toFixed(2)}% {\n\t\ttransform: translate(-50%, -50%) translate(0px, 0px);\n\t}\n`;
			}
		}

		keyframes += `}\n`;
		return keyframes;
	}

	onMount(() => {
		if (browser) {
			// Generate keyframes for desktop (larger movement area)
			const desktopKeyframes = generateRandomKeyframes(
				'floatAroundRandom',
				3,
				8,
				180,
				160,
				75
			);

			// Generate keyframes for tablet
			const tabletKeyframes = generateRandomKeyframes(
				'floatAroundTabletRandom',
				3,
				7,
				130,
				110,
				62
			);

			// Generate keyframes for mobile
			const mobileKeyframes = generateRandomKeyframes(
				'floatAroundMobileRandom',
				3,
				6,
				110,
				90,
				51
			);

			keyframeStyle = `
				${desktopKeyframes}
				@media (max-width: 1024px) {
					${tabletKeyframes}
				}
				@media (max-width: 768px) {
					${mobileKeyframes}
				}
			`;
		}
	});
</script>

<div class="center-controls">
	<div class="auth-container">
		<button class="auth-link join-link" onclick={onJoin}>
			Join
		</button>
		<div class="divider"></div>
		<button class="auth-link login-link" onclick={onLogin}>
			Login
		</button>
	</div>
</div>

{#if keyframeStyle}
	{@html `<style>${keyframeStyle}</style>`}
{/if}

<style>
	.center-controls {
		position: absolute;
		top: 70%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 100;
		pointer-events: none;
		animation: floatAroundRandom 75s ease-in-out infinite;
	}

	.auth-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		background: 
			radial-gradient(circle at 30% 30%, rgba(100, 100, 120, 0.3) 0%, transparent 50%),
			radial-gradient(circle at 70% 70%, rgba(60, 60, 80, 0.3) 0%, transparent 50%),
			linear-gradient(135deg, rgba(40, 40, 50, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(150, 150, 170, 0.3);
		border-radius: 50%;
		padding: 1.25rem 1rem;
		width: 140px;
		height: 140px;
		box-shadow: 
			0 20px 60px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			inset 0 -1px 0 rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(200, 200, 220, 0.1);
		pointer-events: auto;
		animation: slideUp 0.8s ease-out;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	/* Metallic shine effect */
	.auth-container::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			45deg,
			transparent 30%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 70%
		);
		animation: shine 3s infinite;
		pointer-events: none;
	}

	@keyframes shine {
		0% {
			transform: translateX(-100%) translateY(-100%) rotate(45deg);
		}
		100% {
			transform: translateX(100%) translateY(100%) rotate(45deg);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.auth-link {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.5rem 0.75rem;
		transition: all 0.3s ease;
		width: 100%;
		text-align: center;
		position: relative;
		z-index: 1;
	}

	.auth-link:hover {
		color: rgba(255, 255, 255, 1);
		transform: scale(1.05);
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.join-link {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.login-link {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.divider {
		width: 80%;
		height: 1px;
		background: linear-gradient(
			90deg, 
			transparent 0%, 
			rgba(200, 200, 220, 0.5) 50%, 
			transparent 100%
		);
		margin: 0.375rem 0;
		position: relative;
		z-index: 1;
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.center-controls {
			top: 65%;
			animation: floatAroundTabletRandom 62s ease-in-out infinite;
		}
	}

	@media (max-width: 768px) {
		.center-controls {
			top: 60%;
			animation: floatAroundMobileRandom 51s ease-in-out infinite;
		}

		.auth-container {
			width: 120px;
			height: 120px;
			padding: 1rem 0.75rem;
		}

		.auth-link {
			font-size: 0.8rem;
			padding: 0.4rem 0.6rem;
		}

		.join-link,
		.login-link {
			font-size: 0.85rem;
		}
	}
</style>
