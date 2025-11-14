<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let email = $state('');
	let password = $state('');
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';

		try {
			await authStore.login(email, password);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
		}
	}
</script>

<div class="flex items-center justify-center min-h-[80vh]">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Login</CardTitle>
			<CardDescription>Enter your credentials to access your account</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleLogin} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						autocomplete="current-password"
						required
					/>
				</div>

				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={authStore.isLoading}>
					{authStore.isLoading ? 'Logging in...' : 'Login'}
				</Button>

				<p class="text-sm text-center text-muted-foreground">
					Don't have an account?
					<a href="/signup" class="text-primary hover:underline">Sign up</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
