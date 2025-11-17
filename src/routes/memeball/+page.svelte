<script lang="ts">
	import { goto } from '$app/navigation';
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import * as Card from '$lib/components/ui/card';

	type Transmission = {
		id: string;
		title: string;
		body: string;
		footer?: string;
	};

	let transmissions = $state<Transmission[]>([
		{
			id: '001',
			title: 'Electric Static Breach',
			body:
				'Use of electricity is destabilizing adjacent dimensions. The Federation has quarantined Oodball to shield calmer planes.'
		},
		{
			id: '002',
			title: 'Culture Preservation Order',
			body:
				'To preserve cyber culture, one meme per cycle will be sealed inside the Memeball before the karmic army dismantles chaos forces.'
		},
		{
			id: '003',
			title: 'Curator Assignment',
			body:
				'You were selected to curate the archive. Your instincts decide which artifacts survive when grids fall dark.'
		},
		{
			id: '004',
			title: 'Single Token Protocol',
			body:
				'Each day, one meme is globally accepted. Every user receives a single submission token—spend it with intention.',
			footer: 'Duplicate offerings are vaporized. Originals only.'
		},
		{
			id: '005',
			title: 'Power Cycle Directive',
			body:
				'The beings demand silence. Kill your screen at least once today. Let the circuits dream before you return.',
			footer: 'Power down. Breathe. Come back when the static settles.'
		},
		{
			id: '006',
			title: 'Join the Ball',
			body:
				'Swipe right to enter the join console and help seal memes for tomorrow. Swipe left to abort and power down your device.'
		}
	]);

	const joinDestination = '/memeball/main';
	let showExitNotice = $state(false);
	let showHints = $state(false);

	function attemptShutdown() {
		if (typeof window === 'undefined') {
			goto('/');
			return;
		}

		showExitNotice = false;

		const tempWindow = window.open('', '_self');
		tempWindow?.close();

		// If the browser blocks window.close, fall back to showing instructions
		setTimeout(() => {
			if (!tempWindow || !tempWindow.closed) {
				showExitNotice = true;
				goto('/');
			}
		}, 150);
	}

	function handleSwipeLeft(transmission: Transmission) {
		// Remove the card
		transmissions = transmissions.slice(1);
		attemptShutdown();
	}

	function handleSwipeRight(transmission: Transmission) {
		// Remove current transmission and continue
		transmissions = transmissions.slice(1);
		
		// If all transmissions are done, go to main memeball
		if (transmissions.length === 0) {
			goto(joinDestination);
		}
	}

	function handleCardsEmpty() {
		// All transmissions completed
		goto(joinDestination);
	}
</script>

<svelte:head>
	<title>Memeball Boot Sequence</title>
</svelte:head>

<div class="memeball-shell">
	<div class="nebula" aria-hidden="true"></div>
	<div class="gridlines" aria-hidden="true"></div>

	<div class="content">
		<section class="card-stack" aria-live="polite">
			{#if transmissions.length > 0}
				<SwipeCardStack
					bind:cards={transmissions}
					onSwipeLeft={handleSwipeLeft}
					onSwipeRight={handleSwipeRight}
					onCardsEmpty={handleCardsEmpty}
					swipeThreshold={100}
					maxVisibleCards={3}
					className="transmission-stack"
				>
					{#snippet children(transmission: Transmission, index: number)}
						<div class="transmission-card-content">
							<Card.Header>
								<div class="transmission-code">#{transmission.id}</div>
								<Card.Title>{transmission.title}</Card.Title>
							</Card.Header>
							<Card.Description class="transmission-body">{transmission.body}</Card.Description>
							{#if transmission.footer}
								<Card.Footer class="transmission-footer">
									<p class="footer-text">{transmission.footer}</p>
								</Card.Footer>
							{/if}
							{#if showHints}
								<div class="swipe-hint">
									<span class="hint-left">← Abort + Shutdown</span>
									<span class="hint-right">Accept Briefing →</span>
								</div>
							{/if}
						</div>
					{/snippet}
				</SwipeCardStack>
			{/if}
		</section>

		{#if showExitNotice}
			<div class="exit-notice">
				Manual exit required. Hold your device's power button until the screen dims.
			</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background-color: #030014;
	}

	.memeball-shell {
		height: 100vh;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		color: #f8f5ff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow: hidden;
	}

	.nebula {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08), transparent 30%),
			radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.15), transparent 35%),
			radial-gradient(circle at 50% 80%, rgba(236, 72, 153, 0.12), transparent 30%);
		filter: blur(40px);
		pointer-events: none;
	}

	.gridlines {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
		background-size: 160px 160px;
		opacity: 0.25;
		mask-image: radial-gradient(circle at center, #000 45%, transparent 70%);
		pointer-events: none;
	}

	.content {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		padding: 0;
	}

	.card-stack {
		position: relative;
		height: 100%;
		width: 100%;
		max-width: none;
		margin: 0;
	}

	.transmission-card-content {
		width: 100%;
		height: 100%;
		padding: 2rem;
		border-radius: 24px;
		background: rgba(3, 1, 20, 0.82);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 30px 120px rgba(12, 12, 60, 0.45);
		backdrop-filter: blur(14px);
		display: flex;
		flex-direction: column;
		justify-content: center;
		color: #f8f5ff;
	}

	:global(.transmission-stack .card) {
		background: rgba(3, 1, 20, 0.82) !important;
		border: 1px solid rgba(255, 255, 255, 0.08) !important;
		box-shadow: 0 30px 120px rgba(12, 12, 60, 0.45) !important;
		backdrop-filter: blur(14px);
	}

	.transmission-code {
		font-size: 0.9rem;
		letter-spacing: 0.3em;
		color: rgba(255, 255, 255, 0.5);
		margin-bottom: 1rem;
		text-transform: uppercase;
	}

	:global(.transmission-body) {
		color: rgba(248, 245, 255, 0.85) !important;
		line-height: 1.5;
		font-size: 1rem;
		margin: 1rem 0;
	}

	:global(.transmission-footer) {
		padding-top: 0 !important;
		margin-top: auto;
	}

	.footer-text {
		font-size: 0.9rem;
		color: rgba(236, 72, 153, 0.8);
		margin: 0;
	}

	.swipe-hint {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.hint-left {
		color: rgba(248, 113, 113, 0.8);
	}

	.hint-right {
		color: rgba(74, 222, 128, 0.8);
	}

	.exit-notice {
		margin-top: 0.5rem;
		padding: 0.85rem 1rem;
		border-radius: 12px;
		background: rgba(250, 204, 21, 0.12);
		border: 1px solid rgba(250, 204, 21, 0.3);
		color: #fde68a;
		font-size: 0.9rem;
	}

	@media (max-width: 640px) {
		.content {
			gap: 1rem;
			padding: 0;
		}

		.card-stack {
			height: 100%;
		}
	}
</style>
