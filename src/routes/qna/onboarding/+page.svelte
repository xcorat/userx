<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { HelpCircle } from 'lucide-svelte';

	function handleSignup() {
		goto('/signup?redirect=/qna');
	}

	function handleLogin() {
		goto('/login?redirect=/qna');
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center gap-6">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<div class="flex justify-center mb-4">
				<HelpCircle class="h-16 w-16 text-orange-500" />
			</div>
			<Card.Title>Welcome to Orphos</Card.Title>
			<Card.Description>
				Join our Q&A community to ask questions, share answers, and connect with others.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<p class="text-sm text-muted-foreground text-center">
				Get started by creating an account or logging in to your existing account.
			</p>
		</Card.Content>
		<Card.Footer class="flex flex-col gap-2">
			<Button size="lg" class="w-full" onclick={handleSignup}>
				Create Account
			</Button>
			<Button size="lg" variant="outline" class="w-full" onclick={handleLogin}>
				Login
			</Button>
		</Card.Footer>
	</Card.Root>
</div>

