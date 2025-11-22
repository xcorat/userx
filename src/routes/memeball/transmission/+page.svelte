<script lang="ts">
	import { goto } from '$app/navigation';
	import SwipeCardStack from '$lib/components/ui/SwipeCardStack.svelte';
	import * as Card from '$lib/components/ui/card';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { ChevronRight } from 'lucide-svelte';

	type Transmission = {
		id: string;
		title: string;
		body: string;
		// answers[0] = reject (left), answers[1] = accept (right)
		answers?: [string, string];
		messages?: string[];
		footer?: string;
	};

	let transmissions = $state<Transmission[]>([
		{
			id: '001',
			title: '',
			body: 'PLEASE TURN OFF YOUR PHONE!',
			answers: ['Ok!', 'Wat?'] as [string, string]
		},
		{
			id: '002',
			title: '',
			body: 'EVERY SECOND THIS SCREEN EMITS,\n\nTHOUSANDS OF SOULS PERISH...',
			answers: ['Sorry!', 'Too Bad!'] as [string, string]
		},
		{
			id: '003',
			title: '',
			body: 'RIVERS OF ELECTRONS CHARGING THROUGH COMMUNITIES,\n\nRIPPING APART GALAXIES!\n\nDO YOU FEEL RESPONSIBLE?',
			answers: ['Yes', 'No'] as [string, string]
		},
		{
			id: '004',
			title: 'Galactic Federation for Peace and Prosperity',
			body: '',
			messages: [
				'You will bear the witness to the end of a civilization that has lost its ways.',
				'You will help humanity select last of its memories to save.',
				'Add your choices of memes to the mix, and each day one will be selected for Pandora\'s collection.',
				'You can create one yourself, limited to one per day.'
			],
			answers: ['Exit', 'Join'] as [string, string]
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
		// Card is automatically removed by SwipeCardStack
		attemptShutdown();
	}

	function handleSwipeRight(transmission: Transmission) {
		// Card is automatically removed by SwipeCardStack
		// Check if this was the last card and navigate if needed
		// Note: Check happens after the card is removed by the component
		if (transmissions.length === 1) {
			authStore.setBootstrapSkipped(true);
			goto(joinDestination);
		}
	}

	function handleCardsEmpty() {
		// All transmissions completed
		authStore.setBootstrapSkipped(true);
		goto(joinDestination);
	}

	function handleSkip() {
		authStore.setBootstrapSkipped(true);
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
							{#if transmission.title}
								<Card.Header>
									<Card.Title class="transmission-title">{transmission.title}</Card.Title>
								</Card.Header>
							{/if}
							{#if transmission.body}
								<Card.Description class="transmission-body">{transmission.body}</Card.Description>
							{/if}
							{#if transmission.messages}
								<div class="transmission-messages">
									{#each transmission.messages as message, i}
										<p class="message-item" style="animation-delay: {i * 1.5}s">{message}</p>
									{/each}
								</div>
							{/if}
                            <Card.Footer class="transmission-footer">
                                {#if transmission.answers}
                                    <div class="transmission-answers">
                                        {#each transmission.answers as answer, i}
                                            <button
                                                class="answer-button"
                                                data-no-drag
                                                aria-label={i === 0 ? `Reject — ${answer}` : `Accept — ${answer}`}
                                                onclick={() => (i === 0 ? handleSwipeLeft(transmission) : handleSwipeRight(transmission))}
                                            >
                                                {answer}
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                                {#if transmission.footer}
									<p class="footer-text">{transmission.footer}</p>
                                {/if}
                            </Card.Footer>
                            
                            <div class="skip-button-container">
								<button class="skip-button" data-no-drag onclick={handleSkip}>
                                    Skip Intro
                                    <ChevronRight class="skip-icon" />
                                </button>
                            </div>

                                <!-- {#if showExitNotice}
                                    <div class="exit-notice">
                                        Manual exit required. Hold your device's power button until the screen dims.
                                    </div>
                                {/if} -->
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

	</div>
</div>

<style>
	.memeball-shell {
		min-height: 567px;
		height: 100vh;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		color: #f8f5ff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow-y: auto;
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
		min-height: 427px;
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
		max-width: 900px;
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
		justify-content: space-between;
		color: #f8f5ff;
	}

	:global(.transmission-stack .card) {
		background: rgba(3, 1, 20, 0.82) !important;
		border: 1px solid rgba(255, 255, 255, 0.08) !important;
		box-shadow: 0 30px 120px rgba(12, 12, 60, 0.45) !important;
		backdrop-filter: blur(14px);
	}

	:global(.transmission-title) {
		font-size: 1.5rem !important;
		line-height: 1.3 !important;
		text-transform: uppercase !important;
		letter-spacing: 0.05em !important;
		color: rgba(248, 245, 255, 0.95) !important;
		text-align:center !important;
		margin-top: 10vh !important;
	}

	:global(.transmission-body) {
		color: rgba(248, 245, 255, 0.85) !important;
		line-height: 1.6;
		font-size: 1.1rem;
		margin: 1.5rem 0;
		text-align: center;
		white-space: pre-line;
	}

	.transmission-messages {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin: 2rem 0;
		padding-left: 2rem;
	}

	.message-item {
		color: rgba(248, 245, 255, 0.85);
		line-height: 1.6;
		font-size: 1rem;
		margin: 0;
		opacity: 0;
		animation: fadeIn 1s ease-in forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.transmission-answers {
		display: flex;
		justify-content: center;
		gap: 1rem;
        /* margin-top: auto; */
		/* padding-bottom: 1rem; */
		flex-wrap: wrap;
	}

	.answer-button {
		padding: 0.75rem 2rem;
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		border-radius: 12px;
		color: rgba(248, 245, 255, 0.9);
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		letter-spacing: 0.05em;
	}

	.answer-button:hover {
		background: rgba(99, 102, 241, 0.3);
		border-color: rgba(99, 102, 241, 0.6);
		transform: translateY(-2px);
	}

	.answer-button:active {
		transform: translateY(0);
	}

	:global(.transmission-footer) {
		padding-top: 0 !important;
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
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

	.skip-button-container {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
		padding: 0 2rem;
	}

	.skip-button {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.5rem 1.5rem;
		border-radius: 20px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.skip-button:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.skip-icon {
		width: 1rem;
		height: 1rem;
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

	@media (min-width: 1024px) {
		:global(.transmission-title) {
			font-size: 1.75rem !important;
		}

		:global(.transmission-body) {
			font-size: 1.25rem !important;
		}

		.message-item {
			font-size: 1.15rem;
		}

		.transmission-card-content {
			padding: 2.5rem;
		}
	}

	@media (min-width: 1280px) {
		:global(.transmission-title) {
			font-size: 2rem !important;
		}

		:global(.transmission-body) {
			font-size: 1.35rem !important;
		}

		.message-item {
			font-size: 1.25rem;
		}

		.transmission-card-content {
			padding: 3rem;
		}
	}
</style>
