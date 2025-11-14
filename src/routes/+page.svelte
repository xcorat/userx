<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	function handleJoin() {
		goto('/signup');
	}

	function handleLogin() {
		goto('/login');
	}
</script>

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
