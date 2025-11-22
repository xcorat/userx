<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import * as Card from '$lib/components/ui/card';
	import { HelpCircle, Flame } from 'lucide-svelte';

	function goToQnA() {
		goto('/qna/answers');
	}

	function goToMemeball() {
		goto('/memeball');
	}
</script>

<!-- App Selection for Authenticated Users -->
<AppHeader />
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
				<div onclick={goToQnA} onkeydown={(e) => e.key === 'Enter' && goToQnA()} role="button" tabindex="0" class="p-8 space-y-6">
					<div class="flex justify-center">
						<HelpCircle class="h-16 w-16 text-orange-500" />
					</div>
					<Card.Header class="p-0">
						<Card.Title class="text-2xl">Orphos</Card.Title>
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
				<div onclick={goToMemeball} onkeydown={(e) => e.key === 'Enter' && goToMemeball()} role="button" tabindex="0" class="p-8 space-y-6">
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
