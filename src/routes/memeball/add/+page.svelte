<!-- Meme Submission Page - Adapted from questions/new pattern -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { memeStore } from '$lib/stores/meme.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { ArrowLeft, Upload, Eye, AlertTriangle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { MemeSubmissionStatus } from '$lib/models/meme.model';

	let imageUrl = $state('');
	let altText = $state('');
	let imagePreview = $state<string | null>(null);
	let imageError = $state('');
	let isLoadingImage = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let tokenStatus = $state({ canSubmit: true, tokensRemaining: 1 });

	onMount(async () => {
		// Ensure user is authenticated
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Check token status
		await updateTokenStatus();
	});

	async function updateTokenStatus() {
		try {
			await memeStore.updateTokenStatus();
			tokenStatus = {
				canSubmit: memeStore.canSubmitToday,
				tokensRemaining: memeStore.tokensRemaining
			};
		} catch (error) {
			console.error('Failed to update token status:', error);
		}
	}

	function validateForm(): boolean {
		fieldErrors = {};
		error = '';
		imageError = '';

		// Check token availability
		if (!tokenStatus.canSubmit) {
			error = 'Daily submission limit reached. You can submit one meme per day.';
			return false;
		}

		// Validate image URL
		if (!imageUrl.trim()) {
			fieldErrors.imageUrl = 'Meme image URL is required';
			return false;
		}

		try {
			const url = new URL(imageUrl.trim());
			if (!['http:', 'https:'].includes(url.protocol)) {
				fieldErrors.imageUrl = 'Image URL must use HTTP or HTTPS protocol';
				return false;
			}
		} catch (e) {
			fieldErrors.imageUrl = 'Please enter a valid URL';
			return false;
		}

		// Validate alt text length (optional but if provided, must be reasonable)
		if (altText.trim() && altText.trim().length > 500) {
			fieldErrors.altText = 'Alt text must be no more than 500 characters';
			return false;
		}

		return true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!validateForm()) return;
		if (!authStore.currentUser) {
			error = 'You must be logged in to submit a meme';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const result = await memeStore.submitMeme({
				imageUrl: imageUrl.trim(),
				altText: altText.trim() || undefined
			});
			if (!result) {
				error = 'Submission failed. Please try again.';
				return;
			}
			switch (result.status) {
				case "success"://MemeSubmissionStatus.SUCCESS:
					toast.success('Meme submitted successfully! It will be available for voting soon.');
					goto('/memeball/main');
					break;
				case "daily_limit_reached"://MemeSubmissionStatus.DAILY_LIMIT_REACHED:
					error = 'Daily submission limit reached. You can submit one meme per day.';
					await updateTokenStatus();
					break;
				case "duplicate_detected"://	MemeSubmissionStatus.DUPLICATE_DETECTED:
					error = 'This meme has already been submitted. Each meme can only be submitted once.';
					break;
				case "invalid_image"://MemeSubmissionStatus.INVALID_IMAGE:
					error = 'Invalid image. Please check the URL and try again.';
					break;
				default:
					error = 'Submission failed. Please try again.';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit meme';
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/memeball/main');
	}

	// Image preview handling
	$effect(() => {
		if (imageUrl.trim()) {
			loadImagePreview();
		} else {
			imagePreview = null;
			imageError = '';
		}
	});

	async function loadImagePreview() {
		if (!imageUrl.trim()) return;
		
		isLoadingImage = true;
		imageError = '';
		
		try {
			// Test if image loads
			const img = new Image();
			img.onload = () => {
				imagePreview = imageUrl.trim();
				isLoadingImage = false;
			};
			img.onerror = () => {
				imageError = 'Failed to load image from this URL';
				imagePreview = null;
				isLoadingImage = false;
			};
			img.src = imageUrl.trim();
		} catch (error) {
			imageError = 'Invalid image URL';
			imagePreview = null;
			isLoadingImage = false;
		}
	}
</script>

<svelte:head>
	<title>Submit Meme - Memeball</title>
	<meta name="description" content="Submit a meme to the galactic archive" />
</svelte:head>

<div class="submit-page">
	<!-- Header -->
	<div class="page-header">
		<Button
			variant="ghost"
			onclick={handleCancel}
			class="back-button"
			size="sm"
		>
			<ArrowLeft size={16} />
			Back to Archive
		</Button>

		<div class="header-info">
			<h1 class="page-title">Submit New Meme</h1>
			<p class="page-subtitle">
				Add a meme to the galactic preservation archive
			</p>
		</div>
	</div>

	<!-- Token Status Banner -->
	<div class="token-status" class:warning={!tokenStatus.canSubmit}>
		<div class="token-icon">
			{#if tokenStatus.canSubmit}
				🎯
			{:else}
				<AlertTriangle size={20} />
			{/if}
		</div>
		<div class="token-text">
			{#if tokenStatus.canSubmit}
				<strong>Daily Token Available</strong>
				<span>You can submit {tokenStatus.tokensRemaining} meme today</span>
			{:else}
				<strong>Daily Limit Reached</strong>
				<span>You have already used your daily submission token</span>
			{/if}
		</div>
	</div>

	<!-- Submission Form -->
	<Card.Root class="submission-form">
		<Card.Header>
			<Card.Title class="form-title">
				<Upload size={20} />
				Meme Submission
			</Card.Title>
			<Card.Description class="form-description">
				Provide the image URL and optional description for your meme
			</Card.Description>
		</Card.Header>
		
		<form onsubmit={handleSubmit}>
			<Card.Content class="form-content">
				{#if error}
					<div class="error-banner">
						{error}
					</div>
				{/if}

				<!-- Image URL Input -->
				<div class="field-group">
					<Label for="imageUrl" class="field-label">Meme Image URL *</Label>
					<Input
						id="imageUrl"
						type="url"
						placeholder="https://example.com/your-meme.jpg"
						bind:value={imageUrl}
						disabled={isSubmitting || !tokenStatus.canSubmit}
						class={fieldErrors.imageUrl ? 'field-error' : 'field-input'}
					/>
					{#if fieldErrors.imageUrl}
						<p class="error-text">{fieldErrors.imageUrl}</p>
					{:else if imageError}
						<p class="error-text">{imageError}</p>
					{:else}
						<p class="help-text">
							Supported formats: JPG, PNG, GIF. Max recommended size: 10MB
						</p>
					{/if}
				</div>

				<!-- Image Preview -->
				{#if isLoadingImage}
					<div class="image-preview loading">
						<div class="preview-spinner"></div>
						<span class="preview-text">Loading image preview...</span>
					</div>
				{:else if imagePreview}
					<div class="image-preview">
						<img 
							src={imagePreview} 
							alt=""
							class="preview-image"
						/>
						<div class="preview-info">
							<Eye size={16} />
							<span>Preview</span>
						</div>
					</div>
				{/if}

				<!-- Alt Text Input -->
				<div class="field-group">
					<Label for="altText" class="field-label">Alt Text (Optional)</Label>
					<Textarea
						id="altText"
						placeholder="Describe the meme for accessibility (e.g., 'Distracted boyfriend meme with funny caption')"
						bind:value={altText}
						disabled={isSubmitting || !tokenStatus.canSubmit}
						rows={3}
						class={fieldErrors.altText ? 'field-error' : 'field-input'}
					/>
					{#if fieldErrors.altText}
						<p class="error-text">{fieldErrors.altText}</p>
					{:else}
						<p class="help-text">
							{altText.length}/500 characters - Help make the archive accessible
						</p>
					{/if}
				</div>

				<!-- Submission Guidelines -->
				<div class="guidelines">
					<h3 class="guidelines-title">Submission Guidelines</h3>
					<ul class="guidelines-list">
						<li>Only submit memes you have rights to or are freely available</li>
						<li>Avoid duplicate submissions - each meme can only be added once</li>
						<li>Ensure content is appropriate for galactic preservation</li>
						<li>One submission per day per curator</li>
					</ul>
				</div>
			</Card.Content>
			
			<Card.Footer class="form-footer">
				<Button
					type="button"
					variant="outline"
					onclick={handleCancel}
					disabled={isSubmitting}
					class="cancel-button"
				>
					Cancel
				</Button>
				<Button 
					type="submit" 
					disabled={isSubmitting || !tokenStatus.canSubmit || !imageUrl.trim()}
					class="submit-button"
				>
					{#if isSubmitting}
						Submitting...
					{:else if !tokenStatus.canSubmit}
						Daily Limit Reached
					{:else}
						Submit Meme
					{/if}
				</Button>
			</Card.Footer>
		</form>
	</Card.Root>
</div>

<style>
	.submit-page {
		min-height: 467px;
		height: 100%;
		padding: var(--memeball-space-2xl) var(--memeball-space-lg) var(--memeball-space-4xl);
		max-width: 800px;
		margin: 0 auto;
		color: var(--memeball-foreground);
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: flex-start;
		gap: var(--memeball-space-lg);
		margin-bottom: var(--memeball-space-2xl);
	}

	:global(.back-button) {
		background: var(--memeball-surface);
		border: 1px solid var(--memeball-border-emphasis);
		color: var(--memeball-foreground);
		backdrop-filter: var(--memeball-backdrop-blur-md);
		flex-shrink: 0;
		margin-top: var(--memeball-space-xs);
	}

	.header-info {
		flex: 1;
	}

	.page-title {
		font-size: var(--memeball-text-3xl);
		font-weight: var(--memeball-font-semibold);
		margin-bottom: var(--memeball-space-sm);
		color: var(--memeball-foreground);
	}

	.page-subtitle {
		font-size: var(--memeball-text-md);
		color: var(--memeball-muted-foreground);
		line-height: var(--memeball-leading-normal);
	}

	/* Token Status */
	.token-status {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-lg);
		padding: var(--memeball-space-lg) var(--memeball-space-xl);
		background: var(--memeball-success-light);
		border: 1px solid var(--memeball-success-border);
		border-radius: var(--memeball-radius-lg);
		margin-bottom: var(--memeball-space-2xl);
	}

	.token-status.warning {
		background: var(--memeball-error-light);
		border-color: var(--memeball-error-border);
	}

	.token-icon {
		font-size: var(--memeball-text-2xl);
		flex-shrink: 0;
		color: var(--memeball-success);
	}

	.token-status.warning .token-icon {
		color: var(--memeball-error-text);
	}

	.token-text {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-xs);
	}

	.token-text strong {
		font-weight: var(--memeball-font-semibold);
		color: var(--memeball-foreground);
	}

	.token-text span {
		font-size: var(--memeball-text-base);
		color: var(--memeball-muted-foreground);
	}

	/* Form */
	:global(.submission-form) {
		background: var(--memeball-surface);
		border: 1px solid var(--memeball-border);
		backdrop-filter: var(--memeball-backdrop-blur-xl);
	}

	:global(.form-title) {
		display: flex;
		align-items: center;
		gap: var(--memeball-space-md);
		color: var(--memeball-foreground);
	}

	:global(.form-description) {
		color: var(--memeball-muted-foreground);
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-2xl);
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-sm);
	}

	:global(.field-label) {
		color: var(--memeball-foreground);
		font-weight: var(--memeball-font-medium);
	}

	:global(.field-input) {
		background: var(--memeball-input-background);
		border: 1px solid var(--memeball-input-border);
		color: var(--memeball-input-foreground);
	}

	:global(.field-input:focus) {
		border-color: var(--memeball-input-border-focus);
	}

	:global(.field-error) {
		border-color: var(--memeball-error-border);
		background: var(--memeball-error-light);
	}

	.error-banner {
		padding: var(--memeball-space-lg);
		background: var(--memeball-error-light);
		border: 1px solid var(--memeball-error-border);
		border-radius: var(--memeball-radius-md);
		color: var(--memeball-error-text);
		font-size: var(--memeball-text-base);
	}

	.error-text {
		font-size: var(--memeball-text-sm);
		color: var(--memeball-error-text);
		margin: 0;
	}

	.help-text {
		font-size: var(--memeball-text-sm);
		color: var(--memeball-muted-foreground);
		margin: 0;
	}

	/* Image Preview */
	.image-preview {
		border-radius: var(--memeball-radius-lg);
		overflow: hidden;
		background: var(--memeball-overlay-strong);
		border: 1px solid var(--memeball-border-subtle);
		position: relative;
	}

	.image-preview.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--memeball-space-4xl);
		gap: var(--memeball-space-lg);
	}

	.preview-spinner {
		width: 32px;
		height: 32px;
		border: 2px solid var(--memeball-border);
		border-top: 2px solid var(--memeball-foreground);
		border-radius: var(--memeball-radius-full);
		animation: memeball-spin 1s linear infinite;
	}

	.preview-text {
		color: var(--memeball-muted-foreground);
		font-size: var(--memeball-text-base);
	}

	.preview-image {
		width: 100%;
		height: auto;
		max-height: 400px;
		object-fit: contain;
		background: #000;
	}

	.preview-info {
		position: absolute;
		top: var(--memeball-space-lg);
		right: var(--memeball-space-lg);
		display: flex;
		align-items: center;
		gap: var(--memeball-space-sm);
		background: var(--memeball-surface);
		color: var(--memeball-foreground);
		padding: var(--memeball-space-sm) var(--memeball-space-md);
		border-radius: var(--memeball-radius-sm);
		font-size: var(--memeball-text-sm);
		backdrop-filter: var(--memeball-backdrop-blur-md);
	}

	/* Guidelines */
	.guidelines {
		padding: var(--memeball-space-2xl);
		background: rgba(255, 255, 255, 0.03);
		border-radius: var(--memeball-radius-lg);
		border: 1px solid var(--memeball-border-subtle);
	}

	.guidelines-title {
		font-size: var(--memeball-text-md);
		font-weight: var(--memeball-font-semibold);
		color: var(--memeball-foreground);
		margin-bottom: var(--memeball-space-lg);
	}

	.guidelines-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--memeball-space-md);
	}

	.guidelines-list li {
		display: flex;
		align-items: flex-start;
		gap: var(--memeball-space-md);
		font-size: var(--memeball-text-base);
		color: var(--memeball-muted-foreground);
		line-height: var(--memeball-leading-normal);
	}

	.guidelines-list li::before {
		content: '•';
		color: var(--memeball-success);
		font-weight: var(--memeball-font-bold);
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	/* Form Footer */
	.form-footer {
		display: flex;
		justify-content: space-between;
		gap: var(--memeball-space-lg);
	}

	:global(.cancel-button) {
		background: var(--memeball-input-background);
		border: 1px solid var(--memeball-border-emphasis);
		color: var(--memeball-foreground);
	}

	:global(.submit-button) {
		background: var(--memeball-gradient-primary);
		border: none;
		color: white;
	}

	:global(.submit-button:disabled) {
		background: var(--memeball-input-background);
		color: var(--memeball-muted-foreground);
		cursor: not-allowed;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.submit-page {
			padding: var(--memeball-space-lg) var(--memeball-space-lg) var(--memeball-space-4xl);
		}

		.page-header {
			flex-direction: column;
			gap: var(--memeball-space-lg);
			margin-bottom: var(--memeball-space-2xl);
		}

		.page-title {
			font-size: var(--memeball-text-2xl);
		}

		.token-status {
			flex-direction: column;
			text-align: center;
			gap: var(--memeball-space-md);
		}

		.form-footer {
			flex-direction: column-reverse;
		}
	}
</style>