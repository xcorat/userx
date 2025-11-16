<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { HelpCircle, Flame } from 'lucide-svelte';

	function handleJoin() {
		goto('/signup');
	}

	function handleLogin() {
		goto('/login');
	}

	function goToQnA() {
		goto('/qna/questions');
	}

	function goToMemeball() {
		goto('/memeball');
	}
</script>

{#if authStore.isAuthenticated}
	<!-- App Selection for Authenticated Users -->
	<div class="flex min-h-[80vh] items-center justify-center">
		<div class="w-full max-w-4xl space-y-8 text-center">
			<!-- Hero Section -->
			<div class="space-y-4">
				<h1 class="text-5xl font-bold tracking-tight">Welcome Back!</h1>
				<p class="text-xl text-muted-foreground">
					Choose your experience
				</p>
			</div>

			<!-- App Selection Cards -->
			<div class="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
				<Card.Root class="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
					<div onclick={goToQnA} class="p-8 space-y-6">
						<div class="flex justify-center">
							<HelpCircle class="h-16 w-16 text-orange-500" />
						</div>
						<Card.Header class="p-0">
							<Card.Title class="text-2xl">QnA App</Card.Title>
						</Card.Header>
						<Card.Content class="p-0">
							<p class="text-muted-foreground">
								Ask questions, share answers, and connect with the community
							</p>
						</Card.Content>
						<Button size="lg" class="w-full">
							Enter QnA
						</Button>
					</div>
				</Card.Root>

				<Card.Root class="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary">
					<div onclick={goToMemeball} class="p-8 space-y-6">
						<div class="flex justify-center">
							<Flame class="h-16 w-16 text-purple-500" />
						</div>
						<Card.Header class="p-0">
							<Card.Title class="text-2xl">Memeball</Card.Title>
						</Card.Header>
						<Card.Content class="p-0">
							<p class="text-muted-foreground">
								Curate memes for the digital archive in this cosmic experience
							</p>
						</Card.Content>
						<Button size="lg" class="w-full" variant="outline">
							Enter Memeball
						</Button>
					</div>
				</Card.Root>
			</div>
		</div>
	</div>
{:else}
	<!-- Landing Page for Unauthenticated Users -->
	<div class="flex min-h-[80vh] items-center justify-center">
		<div class="w-full max-w-4xl space-y-8 text-center">
			<!-- Hero Section -->
			<div class="space-y-4">
				<h1 class="text-5xl font-bold tracking-tight">Welcome to QnA</h1>
				<p class="text-xl text-muted-foreground">
					Ask questions, share answers, and connect with others
				</p>
			</div>

			<!-- Feature Cards -->
			<div class="grid gap-6 md:grid-cols-3">
				<Card.Root>
					<Card.Header>
						<Card.Title>Public Questions</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							Browse and answer questions from the community. Choose to share your answers publicly or keep them private.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Direct Messages</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							Send private questions directly to specific users. Get personalized answers in your DM inbox.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Your Profile</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							Build your profile with public answers. Share your thoughts and perspectives with the community.
						</p>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- CTA Buttons -->
			<div class="flex justify-center gap-4">
				<Button size="lg" onclick={handleJoin}>
					Join Now
				</Button>
				<Button size="lg" variant="outline" onclick={handleLogin}>
					Login
				</Button>
			</div>

			<!-- Additional Info -->
			<p class="text-sm text-muted-foreground">
				Create your account in seconds. No email verification required.
			</p>
		</div>
	</div>
{/if}
