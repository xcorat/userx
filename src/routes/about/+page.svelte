<div class="about-page">
<div class="about-container">
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
		<div class="mt-2">
			Interested in the vision? Learn about <a href="/about/value" class="text-primary underline font-medium">how UserX can be free, but profitable</a>.
		</div>
	</div>

	<!-- Hero Cards Section -->
	<section class="hero-cards-grid">
		<!-- Regenerative Future Card -->
		<div class="hero-card card-ghibli">
			<div class="card-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<h2 class="card-title">Regenerative Future</h2>
			<p class="card-blurb">
				P2P and user-centered social networks build local resilience and fair exchange. Communities keep value circulating while retaining ownership.
			</p>
			<ul class="card-bullets">
				<li>User-owned infrastructure</li>
				<li>Sybil-vetted trust networks</li>
				<li>Circular regenerative markets</li>
			</ul>
			<a href="https://xcorat.github.io/RustDHT/possibilities-decentralized-systems.html" target="_blank" rel="noopener noreferrer" class="card-cta">
				Explore the Vision
			</a>
		</div>

		<!-- Future-Proof Technology Card -->
		<div class="hero-card card-ethereal">
			<div class="card-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<h2 class="card-title">Future-Proof Technology</h2>
			<p class="card-blurb">
				Offline-first RustDHT, trusted-peer graphs, and a modular app layer that survives platform churn.
			</p>
			<ul class="card-bullets">
				<li>Decentralized storage (RustDHT)</li>
				<li>Trusted peer onboarding</li>
				<li>Open API for apps</li>
			</ul>
			<a href="https://xcorat.github.io/RustDHT/rustdht-technical-overview.html" target="_blank" rel="noopener noreferrer" class="card-cta">
				See the Tech Overview
			</a>
		</div>

		<!-- Capture Value Card -->
		<div class="hero-card card-investor">
			<div class="card-icon">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
					<path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			</div>
			<h2 class="card-title">Capture Value</h2>
			<p class="card-blurb">
				Free for basic use; tokenized attention and transparent fees align incentives between users and platform.
			</p>
			<ul class="card-bullets">
				<li>Tokens for attention & votes</li>
				<li>Bid-to-show content model</li>
				<li>Clear, sustainable fee structure</li>
			</ul>
			<a href="/about/value" class="card-cta">
				Read the Value Page
			</a>
		</div>
	</section>

	<!-- Detailed Text Sections -->
	<div class="detailed-sections space-y-12">
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
</div>

<style>
	.about-page {
		min-height: 100vh;
		background: var(--background);
		padding: 2rem 1.5rem;
	}

	.about-container {
		max-width: 1280px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	/* Hero cards use full container width */
	.hero-cards-grid {
		max-width: 100%;
		width: 100%;
	}

	/* Readable line lengths for detailed text sections only */
	.detailed-sections section {
		max-width: 75ch;
		margin-left: auto;
		margin-right: auto;
		width: 100%;
	}

	@media (max-width: 768px) {
		.about-page {
			padding: 1.5rem 1rem;
		}
	}

	/* Hero Cards Grid */
	/* Hero Cards Grid */
	.hero-cards-grid {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	@media (min-width: 768px) {
		.hero-cards-grid {
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		}
	}

	@media (min-width: 1024px) {
		.hero-cards-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* Hero Card Base */
	.hero-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 2rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		border: 1px solid transparent;
		min-height: 380px;
	}

	.hero-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
	}

	/* Card Icon */
	.card-icon {
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		margin-bottom: 1.25rem;
		transition: transform 0.2s ease;
	}

	.hero-card:hover .card-icon {
		transform: scale(1.1);
	}

	/* Card Content */
	.card-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}

	.card-blurb {
		font-size: 0.9rem;
		line-height: 1.6;
		margin-bottom: 1.25rem;
		flex-grow: 1;
	}

	.card-bullets {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem 0;
		width: 100%;
	}

	.card-bullets li {
		font-size: 0.875rem;
		padding: 0.5rem 0;
		padding-left: 1.25rem;
		position: relative;
		line-height: 1.5;
	}

	.card-bullets li::before {
		content: '→';
		position: absolute;
		left: 0;
		font-weight: 600;
	}

	/* Card CTA */
	.card-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.625rem 1.25rem;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		border-radius: 8px;
		transition: all 0.2s ease;
		border: 2px solid;
		min-height: 44px;
		margin-top: auto;
	}

	.card-cta:focus-visible {
		outline: 2px solid;
		outline-offset: 2px;
	}

	/* Ghibli Card (Regenerative Future) */
	.card-ghibli {
		background: linear-gradient(135deg, #f5f2ed 0%, #eaf3f1 50%, #f7e7c1 100%);
		border-color: rgba(139, 157, 127, 0.25);
	}

	.card-ghibli .card-icon {
		background: rgba(139, 157, 127, 0.2);
		color: #5a6b4f;
	}

	.card-ghibli .card-title {
		color: #2d3a25;
	}

	.card-ghibli .card-blurb {
		color: #4a5540;
	}

	.card-ghibli .card-bullets li {
		color: #5a6b4f;
	}

	.card-ghibli .card-bullets li::before {
		color: #7a9968;
	}

	.card-ghibli .card-cta {
		background: #8b9d7f;
		color: #ffffff;
		border-color: #8b9d7f;
	}

	.card-ghibli .card-cta:hover {
		background: #7a8c6e;
		border-color: #7a8c6e;
		transform: translateY(-2px);
	}

	/* Ethereal Card (Future-Proof Tech) */
	.card-ethereal {
		background: radial-gradient(ellipse at top, rgba(60, 60, 80, 0.35), transparent),
			linear-gradient(135deg, #0b1020 0%, #14182a 50%, #1a1e34 100%);
		border-color: rgba(255, 255, 255, 0.12);
	}

	.card-ethereal .card-icon {
		background: rgba(99, 102, 241, 0.25);
		color: #8b8eff;
	}

	.card-ethereal .card-title {
		color: #e8e8f5;
	}

	.card-ethereal .card-blurb {
		color: #b8b8d0;
	}

	.card-ethereal .card-bullets li {
		color: #c0c0db;
	}

	.card-ethereal .card-bullets li::before {
		color: #8b8eff;
	}

	.card-ethereal .card-cta {
		background: rgba(99, 102, 241, 0.15);
		color: #c0c0ff;
		border-color: rgba(99, 102, 241, 0.4);
	}

	.card-ethereal .card-cta:hover {
		background: rgba(99, 102, 241, 0.3);
		border-color: rgba(99, 102, 241, 0.6);
		color: #e8e8ff;
		transform: translateY(-2px);
	}

	/* Investor Card (Capture Value) */
	.card-investor {
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
		border-color: #d1d5db;
	}

	.card-investor .card-icon {
		background: rgba(107, 114, 128, 0.15);
		color: #4b5563;
	}

	.card-investor .card-title {
		color: #1f2937;
	}

	.card-investor .card-blurb {
		color: #4b5563;
	}

	.card-investor .card-bullets li {
		color: #6b7280;
	}

	.card-investor .card-bullets li::before {
		color: #9ca3af;
	}

	.card-investor .card-cta {
		background: #374151;
		color: #ffffff;
		border-color: #374151;
	}

	.card-investor .card-cta:hover {
		background: #1f2937;
		border-color: #1f2937;
		transform: translateY(-2px);
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.hero-card,
		.card-icon,
		.card-cta {
			transition: none;
		}

		.hero-card:hover {
			transform: none;
		}

		.hero-card:hover .card-icon {
			transform: none;
		}

		.card-cta:hover {
			transform: none;
		}
	}

	/* Mobile Adjustments */
	@media (max-width: 640px) {
		.hero-card {
			padding: 1.5rem 1.25rem;
			min-height: auto;
		}

		.card-title {
			font-size: 1.25rem;
		}

		.card-blurb {
			font-size: 0.875rem;
		}
	}
</style>
