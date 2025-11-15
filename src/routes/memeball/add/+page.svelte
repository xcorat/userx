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
		min-height: 100vh;
		padding: 2rem 1rem 4rem;
		max-width: 800px;
		margin: 0 auto;
		color: #f8f5ff;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	:global(.back-button) {
		background: rgba(3, 1, 20, 0.8) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
		color: #f8f5ff !important;
		backdrop-filter: blur(12px);
		flex-shrink: 0;
		margin-top: 0.25rem;
	}

	.header-info {
		flex: 1;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #f8f5ff;
	}

	.page-subtitle {
		font-size: 1rem;
		color: rgba(248, 245, 255, 0.7);
		line-height: 1.4;
	}

	/* Token Status */
	.token-status {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.token-status.warning {
		background: rgba(248, 113, 113, 0.1);
		border-color: rgba(248, 113, 113, 0.3);
	}

	.token-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		color: #10b981;
	}

	.token-status.warning .token-icon {
		color: #f87171;
	}

	.token-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.token-text strong {
		font-weight: 600;
		color: #f8f5ff;
	}

	.token-text span {
		font-size: 0.9rem;
		color: rgba(248, 245, 255, 0.7);
	}

	/* Form */
	:global(.submission-form) {
		background: rgba(3, 1, 20, 0.8) !important;
		border: 1px solid rgba(255, 255, 255, 0.12) !important;
		backdrop-filter: blur(20px);
	}

	:global(.form-title) {
		display: flex !important;
		align-items: center !important;
		gap: 0.75rem !important;
		color: #f8f5ff !important;
	}

	:global(.form-description) {
		color: rgba(248, 245, 255, 0.7) !important;
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.field-label) {
		color: #f8f5ff !important;
		font-weight: 500 !important;
	}

	:global(.field-input) {
		background: rgba(255, 255, 255, 0.05) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
		color: #f8f5ff !important;
	}

	:global(.field-input:focus) {
		border-color: #10b981 !important;
	}

	:global(.field-error) {
		border-color: #f87171 !important;
		background: rgba(248, 113, 113, 0.1) !important;
	}

	.error-banner {
		padding: 1rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 8px;
		color: #f87171;
		font-size: 0.9rem;
	}

	.error-text {
		font-size: 0.8rem;
		color: #f87171;
		margin: 0;
	}

	.help-text {
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.6);
		margin: 0;
	}

	/* Image Preview */
	.image-preview {
		border-radius: 12px;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
	}

	.image-preview.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		gap: 1rem;
	}

	.preview-spinner {
		width: 32px;
		height: 32px;
		border: 2px solid rgba(248, 245, 255, 0.2);
		border-top: 2px solid #f8f5ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.preview-text {
		color: rgba(248, 245, 255, 0.7);
		font-size: 0.9rem;
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
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(3, 1, 20, 0.8);
		color: #f8f5ff;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8rem;
		backdrop-filter: blur(12px);
	}

	/* Guidelines */
	.guidelines {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.guidelines-title {
		font-size: 1rem;
		font-weight: 600;
		color: #f8f5ff;
		margin-bottom: 1rem;
	}

	.guidelines-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.guidelines-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		font-size: 0.9rem;
		color: rgba(248, 245, 255, 0.8);
		line-height: 1.4;
	}

	.guidelines-list li::before {
		content: '•';
		color: #10b981;
		font-weight: bold;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	/* Form Footer */
	.form-footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	:global(.cancel-button) {
		background: rgba(255, 255, 255, 0.05) !important;
		border: 1px solid rgba(255, 255, 255, 0.2) !important;
		color: #f8f5ff !important;
	}

	:global(.submit-button) {
		background: linear-gradient(135deg, #10b981, #06d6a0) !important;
		border: none !important;
		color: white !important;
	}

	:global(.submit-button:disabled) {
		background: rgba(255, 255, 255, 0.1) !important;
		color: rgba(248, 245, 255, 0.5) !important;
		cursor: not-allowed !important;
	}

	/* Mobile */
	@media (max-width: 640px) {
		.submit-page {
			padding: 1rem 1rem 3rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			margin-bottom: 1.5rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.token-status {
			flex-direction: column;
			text-align: center;
			gap: 0.75rem;
		}

		.form-footer {
			flex-direction: column-reverse;
		}
	}
</style>