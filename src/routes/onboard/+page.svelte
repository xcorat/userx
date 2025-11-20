<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { validateEmailFormat, validateUsername, validateUserName } from '$lib/utils/validation';

	let step = $state(1);
	let isSubmitting = $state(false);
	let error = $state('');

	// Form data
	let email = $state('');
	let password = $state('');
	let username = $state('');
	let name = $state('');
	let birthdate = $state('');
	let location = $state('');
	let timezone = $state('');

	// Validation errors
	let emailError = $state('');
	let usernameError = $state('');
	let nameError = $state('');

	const totalSteps = 4;

	function validateStep1(): boolean {
		emailError = '';
		error = '';

		try {
			validateEmailFormat(email);
			return true;
		} catch (err) {
			emailError = err instanceof Error ? err.message : 'Invalid email';
			return false;
		}
	}

	function validateStep2(): boolean {
		usernameError = '';
		error = '';

		if (!username.trim()) {
			// Username is optional, can skip
			return true;
		}

		try {
			validateUsername(username);
			return true;
		} catch (err) {
			usernameError = err instanceof Error ? err.message : 'Invalid username';
			return false;
		}
	}

	function validateStep3(): boolean {
		nameError = '';
		error = '';

		if (!name.trim()) {
			// Name is optional, can skip
			return true;
		}

		try {
			validateUserName(name);
			return true;
		} catch (err) {
			nameError = err instanceof Error ? err.message : 'Invalid name';
			return false;
		}
	}

	async function handleNext() {
		if (step === 1) {
			if (validateStep1()) {
				step = 2;
			}
		} else if (step === 2) {
			if (validateStep2()) {
				step = 3;
			}
		} else if (step === 3) {
			if (validateStep3()) {
				step = 4;
			}
		} else if (step === 4) {
			await handleSubmit();
		}
	}

	function handleBack() {
		if (step > 1) {
			step--;
			error = '';
		}
	}

	function handleSkip() {
		if (step === 2) {
			username = '';
			step = 3;
		} else if (step === 3) {
			name = '';
			step = 4;
		} else if (step === 4) {
			birthdate = '';
			location = '';
			timezone = '';
			handleSubmit();
		}
	}

	async function handleSubmit() {
		isSubmitting = true;
		error = '';

		try {
			// Password is required for encrypting the private key
			if (!password?.trim()) {
				error = 'Password is required to secure your cryptographic keys';
				isSubmitting = false;
				return;
			}

			await authStore.signup({
				email: email.trim(),
				password: password.trim(),
				name: name.trim() || email.split('@')[0],
				username: username.trim() || undefined,
				birthdate: birthdate || undefined,
				location: location.trim() || undefined,
				timezone: timezone.trim() || undefined
			});
			
			toast.success('Account created successfully! Your cryptographic keys have been generated.');
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Signup failed';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex min-h-[80vh] items-center justify-center">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Welcome! Let's get you started</Card.Title>
			<Card.Description>
				Step {step} of {totalSteps} • All fields are optional except email
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			{#if step === 1}
				<div class="space-y-2">
					<Label for="email">Email *</Label>
					<Input
						id="email"
						type="email"
						placeholder="your@email.com"
						bind:value={email}
						disabled={isSubmitting}
						required
					/>
					{#if emailError}
						<p class="text-sm text-destructive">{emailError}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<Label for="password">Password *</Label>
					<Input
						id="password"
						type="password"
						placeholder="••••••••"
						bind:value={password}
						disabled={isSubmitting}
						autocomplete="new-password"
						required
					/>
					<p class="text-xs text-muted-foreground">
						Used to encrypt your cryptographic keys. Choose a strong password!
					</p>
				</div>
				<div class="rounded-md bg-muted p-3 text-sm">
					<p class="font-medium mb-1">🔐 Secure Identity System</p>
					<p class="text-muted-foreground">
						We'll generate Ed25519 cryptographic keys for you. Your password encrypts your private key - keep it safe!
					</p>
				</div>
			{/if}

			{#if step === 2}
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						type="text"
						placeholder="johndoe"
						bind:value={username}
						disabled={isSubmitting}
					/>
					{#if usernameError}
						<p class="text-sm text-destructive">{usernameError}</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						3-30 characters. Letters, numbers, hyphens, and underscores only.
					</p>
				</div>
			{/if}

			{#if step === 3}
				<div class="space-y-2">
					<Label for="name">Display Name</Label>
					<Input
						id="name"
						type="text"
						placeholder="John Doe"
						bind:value={name}
						disabled={isSubmitting}
					/>
					{#if nameError}
						<p class="text-sm text-destructive">{nameError}</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						How you'll appear to other users
					</p>
				</div>
			{/if}

			{#if step === 4}
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="birthdate">Birth Date</Label>
						<Input
							id="birthdate"
							type="date"
							bind:value={birthdate}
							disabled={isSubmitting}
						/>
					</div>
					<div class="space-y-2">
						<Label for="location">Location</Label>
						<Input
							id="location"
							type="text"
							placeholder="New York, USA"
							bind:value={location}
							disabled={isSubmitting}
						/>
					</div>
					<div class="space-y-2">
						<Label for="timezone">Timezone</Label>
						<Input
							id="timezone"
							type="text"
							placeholder="America/New_York"
							bind:value={timezone}
							disabled={isSubmitting}
						/>
						<p class="text-xs text-muted-foreground">
							e.g., America/New_York, Europe/London, Asia/Tokyo
						</p>
					</div>
				</div>
			{/if}
		</Card.Content>
		<Card.Footer class="flex justify-between">
			<div>
				{#if step > 1}
					<Button variant="outline" onclick={handleBack} disabled={isSubmitting}>
						Back
					</Button>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if step > 1}
					<Button variant="ghost" onclick={handleSkip} disabled={isSubmitting}>
						Skip
					</Button>
				{/if}
				<Button onclick={handleNext} disabled={isSubmitting}>
					{#if step === totalSteps}
						{isSubmitting ? 'Creating Account...' : 'Complete'}
					{:else}
						Next
					{/if}
				</Button>
			</div>
		</Card.Footer>
	</Card.Root>
</div>
