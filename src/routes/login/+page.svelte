<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	let username = $state('');
	let password = $state('');
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';

		try {
			await authStore.login(username, password);
			const redirect = $page.url.searchParams.get('redirect');
			goto(redirect || '/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
		}
	}

	async function handleTestLogin() {
		error = '';
		try {
			await authStore.login('alicejohnson', 'password');
			const redirect = $page.url.searchParams.get('redirect');
			goto(redirect || '/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login failed';
		}
	}

	function getSignupLink() {
		const redirect = $page.url.searchParams.get('redirect');
		return redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup';
	}
</script>

<div class="flex items-center justify-center min-h-[80vh]">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Login</CardTitle>
			<CardDescription>Enter your username and password to access your account</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleLogin} class="space-y-4">
				<div class="space-y-2">
					<Label for="username">Username</Label>
					<Input
						id="username"
						type="text"
						bind:value={username}
						placeholder="alicejohnson"
						autocomplete="username"
						required
					/>
					<p class="text-xs text-muted-foreground">
						Test users: alicejohnson, bobsmith, caroldavis, davidwilson, emmabrown
					</p>
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
					<p class="text-xs text-muted-foreground">
						Test password: password
					</p>
				</div>

				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={authStore.isLoading}>
					{authStore.isLoading ? 'Logging in...' : 'Login'}
				</Button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<span class="w-full border-t" />
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					class="w-full"
					onclick={handleTestLogin}
					disabled={authStore.isLoading}
				>
					Login as Alice (Test User)
				</Button>

				<p class="text-sm text-center text-muted-foreground">
					Don't have an account?
					<a href={getSignupLink()} class="text-primary hover:underline">Sign up</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
