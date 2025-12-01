<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ContactMethodSelector from '$lib/components/ui/ContactMethodSelector.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Form state
	let contactMethod = $state<string>('email');
	let contactValue = $state('');
	let pledgeAmount = $state(25);
	let submitted = $state(false);

	const contactMethods = [
		{ value: 'email', label: 'Email' },
		{ value: 'phone', label: 'Phone' },
		{ value: 'whatsapp', label: 'WhatsApp' },
		{ value: 'facebook', label: 'Facebook' },
		{ value: 'other', label: 'Other' }
	];

	// Computed label for selected contact method
	let contactMethodLabel = $derived(
		contactMethods.find((m) => m.value === contactMethod)?.label || 'Select method'
	);

	const handleContactMethodSelect = (value: string) => {
		contactMethod = value;
	};

	const handleSubmit = (e: Event) => {
		e.preventDefault();

		// Validation
		if (!contactValue.trim()) {
			alert('Please provide contact information');
			return;
		}

		// Log submission (dummy - no backend yet)
		console.log('Pledge submitted:', {
			contactMethod,
			contactValue,
			pledgeAmount,
			timestamp: new Date().toISOString()
		});

		// Show success state
		submitted = true;

		// TODO: POST to /api/pledge when backend is ready
		// await fetch('/api/pledge', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({ contactMethod, contactValue, pledgeAmount })
		// });
	};

	const resetForm = () => {
		submitted = false;
		contactValue = '';
		pledgeAmount = 25;
	};

	// Get placeholder text based on contact method
	const getPlaceholder = (method: string) => {
		switch (method) {
			case 'email':
				return 'your.email@example.com';
			case 'phone':
				return '+1 (555) 123-4567';
			case 'whatsapp':
				return '+1 (555) 123-4567';
			case 'facebook':
				return 'facebook.com/username';
			default:
				return 'Your contact info';
		}
	};
</script>

<svelte:head>
	<title>Pledge Support | UserX</title>
	<meta
		name="description"
		content="Support UserX development with a pledge. Help us build the future of user-owned social infrastructure."
	/>
</svelte:head>

<div class="pledge-page">
	<div class="pledge-container">
		<!-- Breadcrumb -->
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/about" class="breadcrumb-link">About</a>
			<span class="breadcrumb-separator">/</span>
			<span class="breadcrumb-current">Pledge</span>
		</nav>

		<!-- Header -->
		<header class="pledge-header">
			<h1 class="pledge-title">Support UserX</h1>
			<p class="pledge-subtitle">
				Help us build the future of user-owned social infrastructure
			</p>
		</header>

		<!-- Verified Pledges Stat -->
		<div class="verified-stat">
			<div class="stat-icon">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
			<span class="stat-text">
				<strong>{data.verifiedPledges}</strong> verified pledges
			</span>
		</div>

		<!-- Pledge Form Card -->
		<Card.Root class="pledge-card">
			{#if !submitted}
				<Card.Content>
					<form onsubmit={handleSubmit} class="pledge-form">
					<!-- Contact Method -->
					<div class="form-group">
						<Label>How should we reach you?</Label>
						<ContactMethodSelector bind:value={contactMethod} onSelect={handleContactMethodSelect} />
					</div>					<!-- Contact Value -->
					<div class="form-group">
						<Label for="contact-value">Your {contactMethod}</Label>
						<Input
							id="contact-value"
							type="text"
							bind:value={contactValue}
							placeholder={getPlaceholder(contactMethod)}
							required
							class="w-full"
						/>
					</div>

					<!-- Pledge Amount Slider -->
					<div class="form-group">
						<div class="amount-header">
							<Label for="pledge-amount">Pledge amount</Label>
							<span class="amount-display">${pledgeAmount}</span>
						</div>
						<input
							id="pledge-amount"
							type="range"
							min="5"
							max="50"
							step="5"
							bind:value={pledgeAmount}
							class="slider"
							aria-label="Pledge amount in dollars"
						/>
						<div class="slider-labels">
							<span class="slider-label">$5</span>
							<span class="slider-label">$50</span>
						</div>
					</div>

					<!-- Submit Button -->
					<Button type="submit" class="submit-button w-full" size="lg">
						Submit Pledge
					</Button>

					<!-- Disclaimer -->
					<p class="disclaimer">
						<strong>Note:</strong> This is a pledge of interest, not a payment. We'll reach out to coordinate
						next steps. No personal information is stored yet (dummy data for prototype).
					</p>
				</form>
				</Card.Content>
			{:else}
				<Card.Content>
					<!-- Success State -->
					<div class="success-message">
						<div class="success-icon">
						<svg
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
							<path
								d="M8 12L11 15L16 9"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<h2 class="success-title">Thank you!</h2>
					<p class="success-text">
						We've received your pledge of <strong>${pledgeAmount}</strong>. We'll reach out soon
						via {contactMethod} to coordinate next steps.
					</p>
					<Button onclick={resetForm} variant="outline" class="w-full">
						Submit Another Pledge
					</Button>
				</div>
				</Card.Content>
			{/if}
		</Card.Root>

		<!-- Info Section -->
		<section class="info-section">
			<h2 class="info-title">What happens next?</h2>
			<div class="info-grid">
				<div class="info-item">
					<div class="info-number">1</div>
					<div class="info-content">
						<h3 class="info-heading">We'll reach out</h3>
						<p class="info-text">
							A developer will contact you privately to discuss the pledge and answer questions.
						</p>
					</div>
				</div>
				<div class="info-item">
					<div class="info-number">2</div>
					<div class="info-content">
						<h3 class="info-heading">Verification</h3>
						<p class="info-text">
							Pledges are manually verified to ensure authenticity and community alignment.
						</p>
					</div>
				</div>
				<div class="info-item">
					<div class="info-number">3</div>
					<div class="info-content">
						<h3 class="info-heading">Stay updated</h3>
						<p class="info-text">
							You'll receive progress updates as we build toward the $10k goal.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Footer Links -->
		<footer class="pledge-footer">
			<div class="footer-links">
				<a href="/about/value">Value Proposition</a>
				<a href="https://xcorat.github.io/RustDHT/" target="_blank" rel="noopener noreferrer"
					>Technical Docs</a
				>
				<a href="https://github.com/xcorat/userx" target="_blank" rel="noopener noreferrer"
					>GitHub</a
				>
			</div>
		</footer>
	</div>
</div>

<style>
	@import '$lib/styles/skins/startup-earthy.css';

	.pledge-page {
		min-height: 100vh;
		background: var(--se-background, #f5f2ed);
		padding: var(--se-space-2xl, 2rem) var(--se-space-lg, 1rem);
	}

	.pledge-container {
		max-width: 600px;
		margin: 0 auto;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--se-space-sm, 0.5rem);
		margin-bottom: var(--se-space-xl, 1.5rem);
		font-size: var(--se-text-sm, 0.875rem);
	}

	.breadcrumb-link {
		color: var(--se-info, #4a5568);
		text-decoration: none;
		transition: color var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.breadcrumb-link:hover {
		color: var(--se-info-hover, #2d3748);
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: var(--se-muted-foreground, #6b6055);
	}

	.breadcrumb-current {
		color: var(--se-foreground, #2a251f);
		font-weight: var(--se-font-medium, 500);
	}

	/* Header */
	.pledge-header {
		text-align: center;
		margin-bottom: var(--se-space-2xl, 2rem);
	}

	.pledge-title {
		font-size: clamp(2rem, 5vw, 2.5rem);
		font-weight: var(--se-font-bold, 700);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-md, 0.75rem) 0;
		line-height: var(--se-leading-tight, 1.25);
	}

	.pledge-subtitle {
		font-size: clamp(0.9rem, 2vw, 1rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		margin: 0;
	}

	/* Verified Stat */
	.verified-stat {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--se-space-sm, 0.5rem);
		padding: var(--se-space-md, 0.75rem) var(--se-space-lg, 1rem);
		background: var(--se-surface, #ebe6dd);
		border-radius: var(--se-radius-md, 8px);
		margin-bottom: var(--se-space-2xl, 2rem);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		color: var(--se-accent, #4b7a56);
	}

	.stat-text {
		font-size: var(--se-text-sm, 0.875rem);
		color: var(--se-foreground, #2a251f);
	}

	.stat-text strong {
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-accent, #4b7a56);
	}

	/* Pledge Card */
	:global(.pledge-card) {
		margin-bottom: var(--se-space-3xl, 3rem);
	}

	.pledge-form {
		display: flex;
		flex-direction: column;
		gap: var(--se-space-xl, 1.5rem);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--se-space-sm, 0.5rem);
	}

	/* Amount Header */
	.amount-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.amount-display {
		font-size: var(--se-text-xl, 1.25rem);
		font-weight: var(--se-font-bold, 700);
		color: var(--se-cta, #d98b3d);
	}

	/* Slider */
	.slider {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: var(--se-surface, #ebe6dd);
		outline: none;
		-webkit-appearance: none;
		appearance: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--se-cta, #d98b3d);
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.15s ease;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--se-cta, #d98b3d);
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: transform 0.15s ease;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.1);
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		font-size: var(--se-text-xs, 0.75rem);
		color: var(--se-muted-foreground, #6b6055);
	}

	/* Submit Button */
	:global(.submit-button) {
		margin-top: var(--se-space-md, 0.75rem);
	}

	/* Disclaimer */
	.disclaimer {
		font-size: var(--se-text-xs, 0.75rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		text-align: center;
		margin: 0;
		padding: var(--se-space-md, 0.75rem);
		background: var(--se-surface, #ebe6dd);
		border-radius: var(--se-radius-sm, 4px);
	}

	/* Success Message */
	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--se-space-lg, 1rem);
		text-align: center;
		padding: var(--se-space-xl, 1.5rem) 0;
	}

	.success-icon {
		color: var(--se-accent, #4b7a56);
	}

	.success-title {
		font-size: var(--se-text-2xl, 1.875rem);
		font-weight: var(--se-font-bold, 700);
		color: var(--se-foreground, #2a251f);
		margin: 0;
	}

	.success-text {
		font-size: var(--se-text-base, 1rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		margin: 0 0 var(--se-space-lg, 1rem) 0;
	}

	.success-text strong {
		color: var(--se-cta, #d98b3d);
		font-weight: var(--se-font-semibold, 600);
	}

	/* Info Section */
	.info-section {
		margin-bottom: var(--se-space-3xl, 3rem);
	}

	.info-title {
		font-size: var(--se-text-xl, 1.25rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		text-align: center;
		margin: 0 0 var(--se-space-xl, 1.5rem) 0;
	}

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: var(--se-space-lg, 1rem);
	}

	.info-item {
		display: flex;
		gap: var(--se-space-md, 0.75rem);
		align-items: flex-start;
	}

	.info-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		background: var(--se-accent, #4b7a56);
		color: var(--se-accent-foreground, #ffffff);
		border-radius: 50%;
		font-weight: var(--se-font-semibold, 600);
		font-size: var(--se-text-sm, 0.875rem);
	}

	.info-content {
		flex: 1;
	}

	.info-heading {
		font-size: var(--se-text-base, 1rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-xs, 0.25rem) 0;
	}

	.info-text {
		font-size: var(--se-text-sm, 0.875rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		margin: 0;
	}

	/* Footer */
	.pledge-footer {
		padding-top: var(--se-space-2xl, 2rem);
		border-top: 1px solid var(--se-border-subtle, rgba(122, 90, 52, 0.08));
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--se-space-md, 0.75rem) var(--se-space-xl, 1.5rem);
	}

	.footer-links a {
		color: var(--se-info, #4a5568);
		text-decoration: none;
		font-size: var(--se-text-sm, 0.875rem);
		font-weight: var(--se-font-medium, 500);
		transition: color var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.footer-links a:hover {
		color: var(--se-info-hover, #2d3748);
		text-decoration: underline;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.pledge-page {
			padding: var(--se-space-xl, 1.5rem) var(--se-space-md, 0.75rem);
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.breadcrumb-link,
		.footer-links a,
		.slider::-webkit-slider-thumb,
		.slider::-moz-range-thumb {
			transition: none;
		}
	}
</style>
