<script lang="ts">
	import AppHeader from '$lib/components/layout/AppHeader.svelte';
	import * as Card from '$lib/components/ui/card';
	import { ChevronDown, ChevronUp, Shield, Rocket, List } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let openCards = $state({
		features: false,
		security: false,
		gettingStarted: false
	});

	function toggleCard(key: keyof typeof openCards) {
		openCards[key] = !openCards[key];
	}
</script>

<AppHeader />

<div class="container mx-auto px-4 py-8 max-w-3xl space-y-10">
	<!-- Intro Section -->
	<section class="space-y-3 text-center pt-4">
		<h1 class="text-2xl font-semibold tracking-tight text-foreground/90">UserX</h1>
		<p class="text-base text-muted-foreground leading-relaxed">
			A lightweight, single-user social platform built on a shared application layer where <strong class="text-foreground">the user is the sole owner of their data</strong>. It powers multiple experiences, including a core Q&A application and companion apps like "Memeball". The platform emphasizes modularity, allowing different front-end features to consume shared services and data, while the user retains full control over access permissions.
		</p>
	</section>

	<!-- Prototype notice -->
	<div class="mt-4 px-4 py-3 rounded-md bg-yellow-50 border border-yellow-100 text-black text-sm max-w-2xl mx-auto">
		<strong class="font-medium">Prototype:</strong>
		<span class="ml-2">This is an early prototype intended to introduce possible apps and gather momentum. It is experimental, may contain bugs, and much of the current code was produced during a rapid prototype phase.</span>
		<div class="mt-2">
			Visit the project on GitHub: <a href="https://github.com/xcorat/userx" target="_blank" rel="noopener noreferrer" class="text-primary underline">github.com/xcorat/userx</a> — or reach out at <a href="mailto:xcorat@gmail.com" class="text-primary underline">xcorat@gmail.com</a>. Messaging inside the app is coming soon.
		</div>
	</div>

	<!-- Collapsible Cards Section -->
	<section class="grid gap-4 md:grid-cols-1">
		<!-- Key Features -->
		<Card.Root class="border-none shadow-sm bg-secondary/10 ring-1 ring-yellow-50">
			<Card.Header class="cursor-pointer hover:bg-secondary/20 transition-colors py-4" onclick={() => toggleCard('features')}>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-primary/10 rounded-full">
							<List class="h-4 w-4 text-primary" />
						</div>
						<Card.Title class="text-base font-medium">Key Features</Card.Title>
					</div>
					<Button variant="ghost" size="icon" class="h-8 w-8">
						{#if openCards.features}
							<ChevronUp class="h-4 w-4" />
						{:else}
							<ChevronDown class="h-4 w-4" />
						{/if}
					</Button>
				</div>
			</Card.Header>
			{#if openCards.features}
				<Card.Content class="pt-0 pb-4 px-6">
					<ul class="grid gap-3 text-sm text-muted-foreground mt-2">
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Social Q&A:</strong> Post short questions, provide public or private answers, and view aggregate statistics.</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Direct Messaging:</strong> Send private questions and maintain 1:1 conversations via a secure DM inbox.</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">User Profiles:</strong> Public profiles displaying answers and engagement stats.</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Companion Apps:</strong> Extensible architecture supporting additional apps like Memeball (swipe-based meme voting).</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Ed25519 Identity:</strong> Secure, key-based user identification using Ed25519 public keys.</span></li>
					</ul>
				</Card.Content>
			{/if}
		</Card.Root>

		<!-- Security & Privacy -->
		<Card.Root class="border-none shadow-sm bg-secondary/10 ring-1 ring-yellow-50">
			<Card.Header class="cursor-pointer hover:bg-secondary/20 transition-colors py-4" onclick={() => toggleCard('security')}>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-primary/10 rounded-full">
							<Shield class="h-4 w-4 text-primary" />
						</div>
						<Card.Title class="text-base font-medium">Security & Privacy</Card.Title>
					</div>
					<Button variant="ghost" size="icon" class="h-8 w-8">
						{#if openCards.security}
							<ChevronUp class="h-4 w-4" />
						{:else}
							<ChevronDown class="h-4 w-4" />
						{/if}
					</Button>
				</div>
			</Card.Header>
			{#if openCards.security}
				<Card.Content class="pt-0 pb-4 px-6">
					<ul class="grid gap-3 text-sm text-muted-foreground mt-2">
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Client-Side Sovereignty:</strong> User private keys and passwords <strong class="text-foreground">never leave the client</strong>. This ensures that even in the event of a server-side data breach, private data remains cryptographically unreadable.</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Protected Data (Roadmap):</strong> Post-prototype development will focus on granular access controls, enabling users to share specific data subsets only with authorized apps or individuals.</span></li>
						<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Credentials Test:</strong> For a hands-on look at credential handling and security, visit the interactive test at <a href="/tests/credentials" class="text-primary underline">/tests/credentials</a>.</span></li>
					</ul>
				</Card.Content>
			{/if}
		</Card.Root>

		<!-- Getting Started -->
		<Card.Root class="border-none shadow-sm bg-secondary/10 ring-1 ring-yellow-50">
			<Card.Header class="cursor-pointer hover:bg-secondary/20 transition-colors py-4" onclick={() => toggleCard('gettingStarted')}>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="p-2 bg-primary/10 rounded-full">
							<Rocket class="h-4 w-4 text-primary" />
						</div>
						<Card.Title class="text-base font-medium">Getting Started</Card.Title>
					</div>
					<Button variant="ghost" size="icon" class="h-8 w-8">
						{#if openCards.gettingStarted}
							<ChevronUp class="h-4 w-4" />
						{:else}
							<ChevronDown class="h-4 w-4" />
						{/if}
					</Button>
				</div>
			</Card.Header>
			{#if openCards.gettingStarted}
				<Card.Content class="pt-0 pb-4 px-6">
					<ol class="grid gap-3 text-sm text-muted-foreground mt-2 list-decimal pl-4">
						<li><span class="pl-1"><strong class="text-foreground">Feed:</strong> Visit <code>/</code> to browse and filter public questions.</span></li>
						<li><span class="pl-1"><strong class="text-foreground">Interact:</strong> Click any question to answer. Choose <code>PUBLIC</code> for visibility or <code>PRIVATE</code> for personal tracking.</span></li>
						<li><span class="pl-1"><strong class="text-foreground">Profile:</strong> Manage your identity and view your activity at <code>/profile</code>.</span></li>
						<li><span class="pl-1"><strong class="text-foreground">DMs:</strong> Access your private inbox at <code>/dm</code> to exchange direct questions.</span></li>
					</ol>
				</Card.Content>
			{/if}
		</Card.Root>
	</section>

	<!-- Detailed Text Sections -->
	<div class="space-y-12">
		<section class="space-y-3">
			<h2 class="text-lg font-semibold tracking-tight border-b pb-2">Why UserX?</h2>
			<p class="text-sm text-muted-foreground leading-relaxed">
				UserX exists primarily to design, build, and validate a peer-to-peer graph database backed by a Rust-based Distributed Hash Table (DHT). The user-facing Q&A and companion apps are both practical experiences and a testbed for research and engineering work on decentralized storage and identity. A core part of this effort is the RustDHT implementation (see: <a href="https://xcorat.github.io/RustDHT/" target="_blank" rel="noopener noreferrer" class="text-primary underline">https://xcorat.github.io/RustDHT/</a>), which we use to explore offline-first, censorship-resistant replication while keeping users in control of their data.
			</p>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold tracking-tight border-b pb-2">Architecture</h2>
			<ul class="grid gap-2 text-sm text-muted-foreground">
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Framework:</strong> SvelteKit (Svelte 5 + TypeScript).</span></li>
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Design Pattern:</strong> Layered architecture with strict separation of concerns (UI, Stores, Services, Repositories).</span></li>
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Dependency Injection:</strong> Centralized DI container (<code>lib/config/di-container.ts</code>) for managing service and repository dependencies.</span></li>
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">State Management:</strong> Powered by Svelte 5 Runes (<code>$state</code>, <code>$derived</code>) within <code>.svelte.ts</code> store files.</span></li>
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">Server Boundary:</strong> Strict isolation of server-side code (database adapters) from client-side bundles.</span></li>
			</ul>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold tracking-tight border-b pb-2">Data & Storage</h2>
			<ul class="grid gap-2 text-sm text-muted-foreground">
				<li class="flex gap-2"><span class="text-primary">•</span><span>
					<strong class="text-foreground">Flexible Storage:</strong> The app dynamically selects storage adapters based on the environment:
					<ul class="pl-4 mt-1 space-y-1 border-l-2 border-muted ml-1">
						<li><strong class="text-foreground">Development:</strong> SQLite (local <code>better-sqlite3</code>) or Mock data.</li>
						<li><strong class="text-foreground">Production:</strong> Cloudflare D1 via server API routes.</li>
					</ul>
				</span></li>
				<li class="flex gap-2"><span class="text-primary">•</span><span><strong class="text-foreground">API Layer:</strong> Client-side apps communicate via a unified REST API, allowing multiple front-ends (web, mobile) to share the same backend logic.</span></li>
			</ul>
		</section>
	</div>
</div>
