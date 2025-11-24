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
			body: 'EVERY SECOND THIS SCREEN STAYS ON,\n\nA THOUSAND SOULS PERISH...',
			answers: ['Sorry!', 'Too Bad!'] as [string, string]
		},
		{
			id: '003',
			title: '',
			body: '... RIVERS OF ELECTRONS CHARGES THROUGH GALAXIES,\n\nRIPPING APART COMMUNITIES!\n\nTURN OFF YOUR DEVICE!',
			answers: ['Yes', 'No'] as [string, string]
		},
		{
			id: '004',
			title: 'Galactic Federation for Peace and Prosperity',
			body: '',
			messages: [
				'You will bear the witness to the end of a civilization that has lost its ways.',
				'But you can help humanity select the last of its memories to save.',
				'Swipe! Left to reject, right to vote for memes that you want to save to the mix, and each day one will be selected for Pandora\'s collection.',
				'You can create one yourself, limited to one per day.'
			],
			answers: ['Exit', 'Join'] as [string, string]
		}
	]);

	let swipeCardStack = $state<any>(null);
	let showExitNotice = $state(false);
	let showHints = $state(false);
	let showExitDialog = $state(false);

	function attemptShutdown() {
		if (typeof window === 'undefined') {
			goto('/');
			return;
		}

		// Show dialog instead of immediately closing
		showExitDialog = true;
	}

	function handleClose() {
		showExitDialog = false;
		if (typeof window === 'undefined') {
			return;
		}

		// Attempt to close the window/tab
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

	function handleContinue() {
		showExitDialog = false;
		goto('/memeball/main');
	}

	function handleSwipeLeft(transmission: Transmission) {
		// Card is automatically removed by SwipeCardStack
		attemptShutdown();
	}

	function navigateToNext() {
		authStore.setBootstrapSkipped(true);
		if (authStore.isAuthenticated) {
			goto('/memeball/main');
		} else {
			goto('/signup?redirect=%2Fmemeball%2Fmain');
		}
	}

	function handleSwipeRight(transmission: Transmission) {
		// Card is automatically removed by SwipeCardStack
		// Check if this was the last card and navigate if needed
		// Note: Check happens after the card is removed by the component
		if (transmissions.length === 1) {
			navigateToNext();
		}
	}

	function handleCardsEmpty() {
		// All transmissions completed
		navigateToNext();
	}

	function handleSkip() {
		navigateToNext();
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
					bind:this={swipeCardStack}
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
                                        <button
                                            class="answer-button"
                                            data-no-drag
                                            aria-label={`Reject — ${transmission.answers[0]}`}
                                            onclick={() => swipeCardStack?.swipeLeft()}
                                        >
                                            ← {transmission.answers[0]}
                                        </button>
                                        <button
                                            class="answer-button"
                                            data-no-drag
                                            aria-label={`Accept — ${transmission.answers[1]}`}
                                            onclick={() => swipeCardStack?.swipeRight()}
                                        >
                                            {transmission.answers[1]} →
                                        </button>
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

	<!-- Exit Dialog -->
	{#if showExitDialog}
		<div 
			class="exit-dialog-overlay" 
			role="dialog"
			aria-modal="true"
			aria-labelledby="exit-dialog-title"
			tabindex="-1"
			onclick={(e) => e.target === e.currentTarget && (showExitDialog = false)}
			onkeydown={(e) => e.key === 'Escape' && (showExitDialog = false)}
		>
			<div class="exit-dialog">
				<div class="exit-dialog-content">
					<h2 id="exit-dialog-title" class="exit-dialog-title">Thank You!</h2>
					<div class="exit-dialog-message">
						<p class="exit-dialog-line">
							If this was a phone app, it would close the app (<i class="exit-dialog-italic">or ask to turn the phone off</i>).
						</p>
						<p class="exit-dialog-line exit-dialog-thanks">
							Thanks for testing this prototype.
						</p>
						<p class="exit-dialog-line exit-dialog-question">
							Continue to the app or close?
						</p>
					</div>
					<div class="exit-dialog-buttons">
						<button class="exit-dialog-button exit-dialog-button-close" onclick={handleClose}>
							Close
						</button>
						<button class="exit-dialog-button exit-dialog-button-continue" onclick={handleContinue}>
							Continue
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.memeball-shell {
		min-height: var(--memeball-min-height);
		height: 100%;
		background: var(--memeball-gradient-background);
		color: var(--memeball-foreground);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		overflow-y: auto;
	}

	.nebula {
		position: absolute;
		inset: 0;
		background: var(--memeball-gradient-nebula);
		filter: blur(var(--memeball-blur-xl));
		pointer-events: none;
	}

	.gridlines {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
				var(--memeball-gridline-color-primary) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				var(--memeball-gridline-color-secondary) 1px,
				transparent 1px
			);
		background-size: var(--memeball-gridline-size) var(--memeball-gridline-size);
		opacity: var(--memeball-gridline-opacity);
		mask-image: var(--memeball-gridline-mask);
		pointer-events: none;
	}

	.content {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 427px;
		z-index: var(--memeball-z-base);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--memeball-space-2xl);
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
		padding: var(--memeball-space-2xl);
		border-radius: var(--memeball-radius-2xl);
		background: var(--memeball-card-background);
		border: 1px solid var(--memeball-card-border);
		box-shadow: var(--memeball-shadow-xl);
		backdrop-filter: var(--memeball-backdrop-blur-lg);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		color: var(--memeball-card-foreground);
	}

	:global(.transmission-stack .card) {
		background: var(--memeball-card-background);
		border: 1px solid var(--memeball-card-border);
		box-shadow: var(--memeball-shadow-xl);
		backdrop-filter: var(--memeball-backdrop-blur-lg);
	}

	:global(.transmission-title) {
		font-size: var(--memeball-text-2xl);
		line-height: var(--memeball-leading-tight);
		text-transform: uppercase;
		letter-spacing: var(--memeball-tracking-wide);
		color: var(--memeball-foreground);
		opacity: 0.95;
		text-align: center;
		margin-top: 10vh;
	}

	:global(.transmission-body) {
		color: var(--memeball-foreground);
		opacity: 0.85;
		line-height: var(--memeball-leading-loose);
		font-size: var(--memeball-text-lg);
		margin: var(--memeball-space-2xl) 0;
		text-align: center;
		white-space: pre-line;
	}

	.transmission-messages {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-2xl);
		margin: var(--memeball-space-2xl) 0;
		padding-left: var(--memeball-space-2xl);
	}

	.message-item {
		color: var(--memeball-foreground);
		opacity: 0.85;
		line-height: var(--memeball-leading-loose);
		font-size: var(--memeball-text-md);
		margin: 0;
		opacity: 0;
		animation: memeball-fade-in 1s ease-in forwards;
	}

	.transmission-answers {
		display: flex;
		justify-content: center;
		gap: var(--memeball-space-lg);
		flex-wrap: wrap;
	}

	.answer-button {
		padding: var(--memeball-space-md) var(--memeball-space-2xl);
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		border-radius: var(--memeball-radius-lg);
		color: var(--memeball-foreground);
		opacity: 0.9;
		font-size: var(--memeball-text-base);
		cursor: pointer;
		transition: all var(--memeball-duration-normal) var(--memeball-ease);
		letter-spacing: var(--memeball-tracking-wide);
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
		padding-top: 0;
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--memeball-space-lg);
	}

	.footer-text {
		font-size: var(--memeball-text-base);
		color: rgba(236, 72, 153, 0.8);
		margin: 0;
	}

	.swipe-hint {
		display: flex;
		justify-content: space-between;
		margin-top: var(--memeball-space-2xl);
		font-size: var(--memeball-text-sm);
		color: var(--memeball-muted-foreground);
		text-transform: uppercase;
		letter-spacing: var(--memeball-tracking-wider);
	}

	.hint-left {
		color: rgba(248, 113, 113, 0.8);
	}

	.hint-right {
		color: rgba(74, 222, 128, 0.8);
	}

	.skip-button-container {
		display: flex;
		justify-content: flex-end;
		margin-top: 40%;
		padding: 0;
	}

	.skip-button {
		background: var(--memeball-input-background);
		border: none;
		color: var(--memeball-muted-foreground);
		padding: var(--memeball-space-xs) var(--memeball-space-md);
		border-radius: var(--memeball-radius-sm);
		font-size: var(--memeball-text-xs);
		cursor: pointer;
		transition: all var(--memeball-duration-normal) var(--memeball-ease);
		backdrop-filter: var(--memeball-backdrop-blur-sm);
		display: flex;
		align-items: center;
		gap: var(--memeball-space-sm);
	}

	.skip-button:hover {
		background: var(--memeball-surface);
		color: var(--memeball-foreground);
	}

	.skip-icon {
		width: 1rem;
		height: 1rem;
	}

	.exit-dialog-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--memeball-z-fixed, 9999);
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: var(--memeball-backdrop-blur-lg, blur(20px));
	}

	.exit-dialog {
		position: relative;
		width: 90%;
		max-width: 520px;
		padding: var(--memeball-space-4xl) var(--memeball-space-2xl);
		border-radius: var(--memeball-radius-2xl);
		background: var(--memeball-card-background);
		border: 1px solid var(--memeball-card-border);
		box-shadow: var(--memeball-shadow-xl);
		backdrop-filter: var(--memeball-backdrop-blur-lg);
		animation: exit-dialog-fade-in 0.2s ease-out;
	}

	@keyframes exit-dialog-fade-in {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.exit-dialog-content {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-3xl);
		color: var(--memeball-card-foreground);
	}

	.exit-dialog-title {
		font-size: var(--memeball-text-xl);
		font-weight: var(--memeball-font-semibold, 600);
		color: var(--memeball-foreground);
		text-align: center;
		margin: 0;
		letter-spacing: var(--memeball-tracking-wide);
		text-transform: uppercase;
	}

	.exit-dialog-message {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-lg);
		text-align: center;
		margin: 0;
	}

	.exit-dialog-line {
		font-size: var(--memeball-text-base);
		line-height: var(--memeball-leading-relaxed);
		color: var(--memeball-foreground);
		opacity: 0.9;
		margin: 0;
	}

	.exit-dialog-italic {
		font-style: italic;
		opacity: 0.8;
	}

	.exit-dialog-thanks {
		font-size: var(--memeball-text-lg);
		color: var(--memeball-foreground);
		opacity: 0.95;
		font-weight: var(--memeball-font-medium, 500);
		margin-top: var(--memeball-space-sm);
	}

	.exit-dialog-question {
		font-size: var(--memeball-text-base);
		color: var(--memeball-foreground);
		opacity: 0.85;
		margin-top: var(--memeball-space-xs);
	}

	.exit-dialog-buttons {
		display: flex;
		justify-content: center;
		gap: var(--memeball-space-lg);
		flex-wrap: wrap;
	}

	.exit-dialog-button {
		padding: var(--memeball-space-md) var(--memeball-space-2xl);
		border-radius: var(--memeball-radius-lg);
		font-size: var(--memeball-text-base);
		cursor: pointer;
		transition: all var(--memeball-duration-normal) var(--memeball-ease);
		letter-spacing: var(--memeball-tracking-wide);
		border: 1px solid;
		font-weight: var(--memeball-font-medium, 500);
	}

	.exit-dialog-button-close {
		background: rgba(248, 113, 113, 0.2);
		border-color: rgba(248, 113, 113, 0.4);
		color: var(--memeball-foreground);
	}

	.exit-dialog-button-close:hover {
		background: rgba(248, 113, 113, 0.3);
		border-color: rgba(248, 113, 113, 0.6);
		transform: translateY(-2px);
	}

	.exit-dialog-button-continue {
		background: rgba(99, 102, 241, 0.2);
		border-color: rgba(99, 102, 241, 0.4);
		color: var(--memeball-foreground);
	}

	.exit-dialog-button-continue:hover {
		background: rgba(99, 102, 241, 0.3);
		border-color: rgba(99, 102, 241, 0.6);
		transform: translateY(-2px);
	}

	.exit-dialog-button:active {
		transform: translateY(0);
	}

	@media (max-width: 640px) {
		.content {
			gap: var(--memeball-space-lg);
			padding: 0;
		}

		.card-stack {
			height: 100%;
		}
	}

	@media (min-width: 1024px) {
		:global(.transmission-title) {
			font-size: 1.75rem;
		}

		:global(.transmission-body) {
			font-size: 1.25rem;
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
			font-size: 2rem;
		}

		:global(.transmission-body) {
			font-size: 1.35rem;
		}

		.message-item {
			font-size: 1.25rem;
		}

		.transmission-card-content {
			padding: var(--memeball-space-4xl);
		}
	}
</style>
