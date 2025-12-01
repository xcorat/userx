<script lang="ts">
	import ExpandableCard from '$lib/components/ui/ExpandableCard.svelte';
	import StatChip from '$lib/components/ui/StatChip.svelte';

	import { onMount } from 'svelte';

	let nPledgees = $state<number>(0);

	onMount(async () => {
		try {
			const res = await fetch('/api/pledge');
			if (res.ok) {
				const data: any = await res.json();
				nPledgees = data.verifiedCount ?? data.total ?? 0;
			}
		} catch (err) {
			// ignore
		}
	});

</script>

<svelte:head>
	<title>Free, but profitable? | UserX</title>
	<meta
		name="description"
		content="How UserX aligns user ownership with sustainable value capture through peer-to-peer infrastructure and token economics."
	/>
</svelte:head>

<div class="value-page">
	<div class="value-container">
		<!-- Breadcrumb -->
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/about" class="breadcrumb-link">About</a>
			<span class="breadcrumb-separator">/</span>
			<span class="breadcrumb-current">Value</span>
		</nav>

		<!-- Header -->
		<header class="value-header">
			<h1 class="value-title">Free, but profitable?</h1>
			<p class="value-subtitle">
				How UserX aligns user ownership with sustainable value capture
			</p>

			<!-- Stats Row -->
			<div class="stats-row">
				<a href="/about/pledge" class="stat-link" aria-label="View and make a pledge">
					<StatChip label="Pledges" value={nPledgees ? `${nPledgees}` : '~15'} variant="sage" />
				</a>
				<StatChip label="Goal" value="$10k" variant="highlight" />
				<StatChip label="Timeline" value="3–6 months" variant="slate" />
			</div>
		</header>

		<!-- Intro -->
		<section class="value-intro">
			<p>
				UserX centers <strong>choice and ownership</strong>. We pair a question-and-answer social
				model with peer-to-peer infrastructure that lets users control their data while enabling
				real economic value.
			</p>
			<p class="intro-secondary">
				The platform is designed to be free for basic use, with sustainable revenue through
				token-based attention markets and infrastructure fees.
			</p>
		</section>

		<!-- Jump Navigation -->
		<nav class="jump-nav" aria-label="Quick navigation">
			<span class="jump-label">Jump to:</span>
			<a href="#user-choice" class="jump-link">User Choice</a>
			<a href="#p2p-infra" class="jump-link">P2P Infrastructure</a>
			<a href="#token-economics" class="jump-link">Token Economics</a>
			<a href="#roadmap" class="jump-link">Roadmap</a>
		</nav>

		<!-- Cards Grid -->
		<section class="value-cards">
			<ExpandableCard
				id="user-choice"
				title="User choice matters"
				summary="Engagement over attention. You choose what to share."
				tldr="QnA drives meaningful interactions, not just scrolling. Users control data exposure and benefit from agentic interfaces."
				links={[
					{
						label: 'Developer Guide',
						href: 'https://xcorat.github.io/RustDHT/developers-guide-overview.html'
					}
				]}
			>
				<p>
					A question-and-answer app has <strong>user engagement built in</strong> — not just
					attention. Users have control over what data to expose and to whom, creating a foundation
					of trust and intentional interaction.
				</p>
				<p>
					QnA with multi-interface design provides unique opportunities for <strong
						>marketing, polling, and recommendation engines</strong
					>
					to get real user data without invasive tracking.
				</p>
				<div class="example">
					Example: <strong>Agentic interfaces</strong> — The ability for a user to create an agent
					quickly is a marketed goal of the platform. This enables integration into future agentic
					networks and web3 payment platforms, where users can delegate tasks while maintaining
					control.
				</div>
				<div class="example">
					Use case: A polling service could ask "Which features matter most?" and users choose to
					answer publicly or privately. The platform aggregates insights without selling individual
					data.
				</div>
			</ExpandableCard>

			<ExpandableCard
				id="p2p-infra"
				title="Why peer-to-peer infrastructure?"
				summary="Privacy-first, sybil-resistant trust model."
				tldr="P2P provides security and privacy by default, with vetted entry peers and trusted contact graphs. Enables censorship-resistant, user-owned networks."
				links={[
					{
						label: 'Existing Decentralized Solutions',
						href: 'https://xcorat.github.io/RustDHT/existing-decentralized-solutions.html'
					},
					{
						label: 'Technical Overview',
						href: 'https://xcorat.github.io/RustDHT/rustdht-technical-overview.html'
					},
					{
						label: 'Structural Context',
						href: 'https://xcorat.github.io/RustDHT/structural-context-technofeudalism.html'
					}
				]}
			>
				<p>
					Peer-to-peer has the challenge of new technology — you need buy-in before it provides
					full value. But it provides <strong>security and privacy by default</strong>, and a p2p
					network can have sybil-vetted continents with direct initiation records built into the
					infrastructure.
				</p>
				<p>
					<strong>Trusted network model:</strong> The initial peer a user joins through can be recorded
					and vetted. Users can set other trusted contacts to build a trusted network, creating natural
					community boundaries and reducing spam/abuse.
				</p>
				<div class="example">
					Real-world analogy: Think of it like joining a co-op through a member you trust. That
					member vouches for you, and over time you vouch for others. The network grows organically
					with built-in trust.
				</div>
				<div class="example">
					Use case examples: <strong>p2p Uber/Instacart</strong> with a free basic matching tier, <strong
						>Craigslist-style listings</strong
					>, <strong>second-hand marketplace</strong>, <strong
						>tool or art-lending service</strong
					>
					(economic value in logistics and insurance/trust).
				</div>
			</ExpandableCard>

			<ExpandableCard
				id="token-economics"
				title="Built-in attention & token economics"
				summary="Users share value directly — tokens for attention, voting, and micropayments."
				tldr="Token system rewards users for attention and participation. Anyone can bid tokens to promote content, with transparent platform fees."
				links={[
					{
						label: 'Use Cases & Applications',
						href: 'https://xcorat.github.io/RustDHT/use-cases-and-applications.html'
					}
				]}
			>
				<p>
					Regular social media attention values exist, <strong
						>but with user ownership of the infrastructure</strong
					>, users become investors themselves. The value of their time is shared directly via
					token-based buy-sell mechanics.
				</p>
				<p>
					<strong>Token use cases:</strong> Tokens can be used for voting, prioritizing content, and
					buying user attention. Anyone can bid tokens to show content to users, and
					<code>1 - bid_value</code> becomes the platform/infrastructure fee.
				</p>
				<div class="example">
					Example: <strong>memeball</strong> — Each ad meme shown gives the user 1 token. Users can
					spend tokens to promote their own questions or content. A 2% platform fee per transaction
					funds infrastructure and development.
				</div>
				<div class="example">
					Example transaction flow: Alice views 100 memes → earns 100 tokens. She spends 50 tokens
					to promote her question to 50 users. Platform keeps 1 token (2% fee), 49 tokens burned or
					redistributed. Net result: Alice gets visibility, users get paid for attention, platform
					sustains itself.
				</div>
				<p>
					This model avoids speculation while creating <strong>real utility</strong> — tokens represent
					actual attention and engagement, not just promises.
				</p>
			</ExpandableCard>

			<ExpandableCard
				id="roadmap"
				title="Roadmap & funding"
				summary="Prototype → P2P infrastructure → Web3 integration."
				tldr="Clear milestones from current prototype ($10k, 3–6mo) through p2p infra ($25k–50k, 2–3mo) to full web3 integration. Low costs until 1k–10k users."
				links={[
					{ label: 'Full Value Proposition', href: '/pub_docs/about/value.md' },
					{
						label: 'Community Participation',
						href: 'https://xcorat.github.io/RustDHT/community-participation.html'
					}
				]}
			>
				<p><strong>Phase 1: Prototype, MVP (current)</strong></p>
				<ul>
					<li>Usable UserX app with a couple of interfaces (QnA, memeball)</li>
					<li>Basic messaging infrastructure built with p2p (using commercial relays)</li>
					<li>Minimal costs up to 1,000–10,000 users</li>
				</ul>
				<div class="example">
					Funding: $10k initial pledge targeting a few hundred people ($5–50 each). Timeline: 3–6
					months part-time. Current status: ~15 pledges, actively seeking early supporters.
				</div>

				<p><strong>Phase 2: Web app with p2p infrastructure</strong></p>
				<ul>
					<li>Basic p2p infrastructure with document-like storage (RustDHT)</li>
					<li>Vetted and secure web app similar to the prototype</li>
					<li>Offline-first capabilities and censorship resistance</li>
				</ul>
				<div class="example">
					Funding: ~$25k–50k raised through existing networks. Timeline: 2–3 months, small team.
					This phase proves the technical foundation and attracts larger investment.
				</div>

				<p><strong>Phase 3: Integration into web3</strong></p>
				<ul>
					<li>Implement token-based system for voting (first priority)</li>
					<li>Implement tokens for ads and questions</li>
					<li>Implement basic agentic systems with micropayments</li>
					<li>Open API for third-party apps and integrations</li>
				</ul>
				<div class="example">
					At this stage, the project becomes self-sustaining through token fees and can scale to
					support diverse use cases beyond social QnA.
				</div>
			</ExpandableCard>
		</section>

		<!-- Proof & Signals -->
		<section class="proof-section">
			<h2 class="section-heading">Proof & signals</h2>
			<div class="proof-grid">
				<div class="proof-item">
					<div class="proof-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 11L12 14L22 4M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div class="proof-content">
						<h3 class="proof-title">Working Prototype</h3>
						<p class="proof-text">
							Live demo at <a href="/" class="inline-link">userx.app</a> with QnA and memeball
							interfaces.
						</p>
					</div>
				</div>

				<div class="proof-item">
					<div class="proof-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M12 2L2 7L12 12L22 7L12 2Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M2 17L12 22L22 17"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M2 12L12 17L22 12"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div class="proof-content">
						<h3 class="proof-title">Technical Foundation</h3>
						<p class="proof-text">
							RustDHT in active development. See <a
								href="https://xcorat.github.io/RustDHT/"
								class="inline-link"
								target="_blank"
								rel="noopener noreferrer">technical docs</a
							>.
						</p>
					</div>
				</div>

				<div class="proof-item">
					<div class="proof-icon">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
					<div class="proof-content">
						<h3 class="proof-title">Early Community</h3>
						<p class="proof-text">~15 early pledges and growing interest from the open-source community.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section class="faq-section">
			<h2 class="section-heading">Frequently Asked Questions</h2>
			<div class="faq-list">
				<details class="faq-item">
					<summary class="faq-question">Why QnA instead of traditional social media?</summary>
					<p class="faq-answer">
						QnA creates intentional engagement. Users actively participate rather than passively
						scroll. Questions drive conversations, and answers build reputation. This structure
						naturally filters noise and rewards thoughtful contribution.
					</p>
				</details>

				<details class="faq-item">
					<summary class="faq-question">Why build p2p infrastructure now?</summary>
					<p class="faq-answer">
						Web3 and decentralized apps are gaining traction, but most still rely on centralized
						servers. Building true p2p infrastructure now positions UserX to be infrastructure for
						the next wave of user-owned applications. Early investment in this space creates
						defensible value.
					</p>
				</details>

				<details class="faq-item">
					<summary class="faq-question">How do tokens avoid speculation bubbles?</summary>
					<p class="faq-answer">
						Tokens have <strong>direct utility</strong> — they buy attention, not promises. 1 token
						= 1 user view. The platform burns or redistributes tokens after use, preventing
						hoarding. Supply is tied to actual platform usage, not arbitrary minting.
					</p>
				</details>

				<details class="faq-item">
					<summary class="faq-question">How do users control their data?</summary>
					<p class="faq-answer">
						Private keys never leave the client. Users choose what to share publicly vs. privately.
						P2P infrastructure means no central database to breach. Post-prototype, granular access
						controls let users share specific data subsets with specific apps or people.
					</p>
				</details>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="cta-section">
			<h2 class="cta-heading">Get involved</h2>
			<p class="cta-text">
				UserX is in early development and seeking contributors, advisors, and early supporters.
			</p>
			<div class="cta-buttons">
				<a href="/pub_docs/about/value.md" class="cta-button cta-primary">
					Read Full Value Proposition
				</a>
				<a href="/about/pledge" class="cta-button cta-secondary">
					Make a Pledge
				</a>
			</div>
		</section>

		<!-- Footer Links -->
		<footer class="value-footer">
			<div class="footer-links">
				<a href="https://xcorat.github.io/RustDHT/" target="_blank" rel="noopener noreferrer"
					>Technical Docs</a
				>
				<a
					href="https://xcorat.github.io/RustDHT/community-participation.html"
					target="_blank"
					rel="noopener noreferrer">Community Participation</a
				>
				<a href="https://github.com/xcorat/userx" target="_blank" rel="noopener noreferrer"
					>GitHub</a
				>
				<a
					href="https://xcorat.github.io/RustDHT/possibilities-decentralized-systems.html"
					target="_blank"
					rel="noopener noreferrer">Possibilities of Decentralized Systems</a
				>
			</div>
		</footer>
	</div>
</div>

<style>
	@import '$lib/styles/skins/startup-earthy.css';

	.value-page {
		min-height: 100vh;
		background: var(--se-background, #f5f2ed);
		padding: var(--se-space-2xl, 2rem) var(--se-space-lg, 1.5rem);
	}

	.value-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: var(--se-space-sm, 0.5rem);
		margin-bottom: var(--se-space-xl, 1.5rem);
		font-size: var(--se-text-sm, 0.875rem);
	}

	.breadcrumb-link {
		color: var(--se-info, #4a5568);
		text-decoration: none;
		transition: color var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.breadcrumb-link:hover {
		color: var(--se-info-hover, #2d3748);
		text-decoration: underline;
	}

	.breadcrumb-separator {
		color: var(--se-muted-foreground, #6b6055);
	}

	.breadcrumb-current {
		color: var(--se-foreground, #2a251f);
		font-weight: var(--se-font-medium, 500);
	}

	/* Header */
	.value-header {
		text-align: center;
		margin-bottom: var(--se-space-3xl, 3rem);
	}

	.value-title {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: var(--se-font-bold, 700);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-md, 0.75rem) 0;
		line-height: var(--se-leading-tight, 1.25);
		letter-spacing: var(--se-tracking-tight, -0.025em);
	}

	.value-subtitle {
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		color: var(--se-muted-foreground, #6b6055);
		font-weight: var(--se-font-normal, 400);
		margin: 0 0 var(--se-space-xl, 1.5rem) 0;
		line-height: var(--se-leading-normal, 1.5);
	}

	.stats-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--se-space-md, 0.75rem);
	}

	/* Intro */
	.value-intro {
		margin-bottom: var(--se-space-3xl, 3rem);
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}

	.value-intro p {
		font-size: clamp(1rem, 2vw, 1.125rem);
		color: var(--se-foreground, #2a251f);
		line-height: var(--se-leading-relaxed, 1.625);
		text-align: center;
		margin: 0 0 var(--se-space-lg, 1rem) 0;
	}

	.intro-secondary {
		color: var(--se-muted-foreground, #6b6055);
		font-size: clamp(0.9rem, 1.8vw, 1rem);
	}

	/* Jump Navigation */
	.jump-nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--se-space-sm, 0.5rem) var(--se-space-md, 0.75rem);
		margin-bottom: var(--se-space-2xl, 2rem);
		padding: var(--se-space-lg, 1rem);
		background: var(--se-surface, #ebe6dd);
		border-radius: var(--se-radius-md, 8px);
	}

	.jump-label {
		font-size: var(--se-text-sm, 0.875rem);
		font-weight: var(--se-font-medium, 500);
		color: var(--se-muted-foreground, #6b6055);
	}

	.jump-link {
		font-size: var(--se-text-sm, 0.875rem);
		color: var(--se-info, #4a5568);
		text-decoration: none;
		padding: var(--se-space-xs, 0.25rem) var(--se-space-sm, 0.5rem);
		border-radius: var(--se-radius-sm, 4px);
		transition: all var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.jump-link:hover {
		background: var(--se-info, #4a5568);
		color: var(--se-info-foreground, #ffffff);
	}

	/* Cards Grid */
	.value-cards {
		display: grid;
		gap: var(--se-space-xl, 1.5rem);
		margin-bottom: var(--se-space-4xl, 4rem);
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		.value-cards {
			grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		}
	}

	@media (min-width: 1024px) {
		.value-cards {
			grid-template-columns: repeat(2, 1fr);
		}

		.value-cards :global(.expandable-card) {
			height: fit-content;
		}
	}

	/* Proof Section */
	.proof-section,
	.faq-section {
		margin-bottom: var(--se-space-4xl, 4rem);
	}

	.section-heading {
		font-size: var(--se-text-2xl, 1.875rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-xl, 1.5rem) 0;
		text-align: center;
	}

	.proof-grid {
		display: grid;
		gap: var(--se-space-xl, 1.5rem);
		grid-template-columns: 1fr;
	}

	@media (min-width: 640px) {
		.proof-grid {
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		}
	}

	@media (min-width: 768px) {
		.proof-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.proof-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.proof-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: var(--se-space-xl, 1.5rem);
		background: var(--se-card-background, #ffffff);
		border: 1px solid var(--se-card-border, rgba(122, 90, 52, 0.12));
		border-radius: var(--se-radius-lg, 12px);
		box-shadow: var(--se-shadow-sm, 0 1px 2px rgba(42, 37, 31, 0.08));
	}

	.proof-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--se-accent, #4b7a56);
		color: var(--se-accent-foreground, #ffffff);
		border-radius: var(--se-radius-md, 8px);
		margin-bottom: var(--se-space-md, 0.75rem);
	}

	.proof-title {
		font-size: var(--se-text-md, 1.125rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-sm, 0.5rem) 0;
	}

	.proof-text {
		font-size: var(--se-text-sm, 0.875rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		margin: 0;
	}

	/* FAQ Section */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: var(--se-space-md, 0.75rem);
	}

	.faq-item {
		background: var(--se-card-background, #ffffff);
		border: 1px solid var(--se-card-border, rgba(122, 90, 52, 0.12));
		border-radius: var(--se-radius-md, 8px);
		padding: var(--se-space-lg, 1rem);
		transition: box-shadow var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.faq-item:hover {
		box-shadow: var(--se-shadow-md, 0 4px 8px rgba(42, 37, 31, 0.1));
	}

	.faq-item[open] {
		box-shadow: var(--se-shadow-md, 0 4px 8px rgba(42, 37, 31, 0.1));
	}

	.faq-question {
		font-size: var(--se-text-base, 1rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		cursor: pointer;
		list-style: none;
		padding: var(--se-space-sm, 0.5rem) 0;
	}

	.faq-question::-webkit-details-marker {
		display: none;
	}

	.faq-question::before {
		content: '+';
		display: inline-block;
		width: 1.5rem;
		color: var(--se-accent, #4b7a56);
		font-weight: var(--se-font-bold, 700);
	}

	.faq-item[open] .faq-question::before {
		content: '−';
	}

	.faq-answer {
		font-size: var(--se-text-sm, 0.875rem);
		color: var(--se-muted-foreground, #6b6055);
		line-height: var(--se-leading-relaxed, 1.625);
		margin: var(--se-space-md, 0.75rem) 0 0 1.5rem;
	}

	/* CTA Section */
	.cta-section {
		text-align: center;
		padding: var(--se-space-3xl, 3rem) var(--se-space-lg, 1rem);
		background: var(--se-surface, #ebe6dd);
		border-radius: var(--se-radius-lg, 12px);
		margin-bottom: var(--se-space-4xl, 4rem);
	}

	.cta-heading {
		font-size: var(--se-text-2xl, 1.875rem);
		font-weight: var(--se-font-semibold, 600);
		color: var(--se-foreground, #2a251f);
		margin: 0 0 var(--se-space-md, 0.75rem) 0;
	}

	.cta-text {
		font-size: var(--se-text-base, 1rem);
		color: var(--se-muted-foreground, #6b6055);
		margin: 0 0 var(--se-space-2xl, 2rem) 0;
		line-height: var(--se-leading-relaxed, 1.625);
	}

	.cta-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--se-space-lg, 1rem);
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--se-space-md, 0.75rem) var(--se-space-xl, 1.5rem);
		font-size: var(--se-text-base, 1rem);
		font-weight: var(--se-font-semibold, 600);
		text-decoration: none;
		border-radius: var(--se-radius-md, 8px);
		transition: all var(--se-duration-normal, 200ms) var(--se-ease-in-out, ease);
		min-height: 44px;
	}

	.cta-primary {
		background: var(--se-cta, #d98b3d);
		color: var(--se-cta-foreground, #ffffff);
		box-shadow: var(--se-shadow-cta, 0 4px 12px rgba(217, 139, 61, 0.25));
	}

	.cta-primary:hover {
		background: var(--se-cta-hover, #c47729);
		box-shadow: var(--se-shadow-cta-hover, 0 8px 20px rgba(217, 139, 61, 0.3));
		transform: translateY(-2px);
	}

	.cta-secondary {
		background: var(--se-primary, #7a5a34);
		color: var(--se-primary-foreground, #ffffff);
		box-shadow: var(--se-shadow-primary, 0 4px 12px rgba(122, 90, 52, 0.2));
	}

	.cta-secondary:hover {
		background: var(--se-primary-hover, #5d4427);
		box-shadow: var(--se-shadow-primary-hover, 0 8px 20px rgba(122, 90, 52, 0.25));
		transform: translateY(-2px);
	}

	.cta-button:focus-visible {
		outline: 2px solid var(--se-ring, #4b7a56);
		outline-offset: 2px;
	}

	/* Footer */
	.value-footer {
		padding-top: var(--se-space-3xl, 3rem);
		border-top: 1px solid var(--se-border-subtle, rgba(122, 90, 52, 0.08));
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--se-space-md, 0.75rem) var(--se-space-xl, 1.5rem);
	}

	.footer-links a {
		color: var(--se-info, #4a5568);
		text-decoration: none;
		font-size: var(--se-text-sm, 0.875rem);
		font-weight: var(--se-font-medium, 500);
		transition: color var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	.footer-links a:hover {
		color: var(--se-info-hover, #2d3748);
		text-decoration: underline;
	}

	.footer-links a:focus-visible {
		outline: 2px solid var(--se-ring, #4b7a56);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Inline link style */
	:global(.inline-link) {
		color: var(--se-primary, #7a5a34);
		text-decoration: underline;
		font-weight: var(--se-font-medium, 500);
		transition: color var(--se-duration-fast, 150ms) var(--se-ease, ease);
	}

	/* Stats Row link: make a stat chip clickable */
	.stat-link {
		display: inline-block;
		text-decoration: none;
	}

	.stat-link:focus-visible {
		outline: 2px solid var(--se-ring, #4b7a56);
		outline-offset: 2px;
		border-radius: var(--se-radius-sm, 4px);
	}

	:global(.inline-link:hover) {
		color: var(--se-primary-hover, #5d4427);
	}

	/* Code inline */
	:global(code) {
		font-family: var(--se-font-family-mono, monospace);
		font-size: 0.9em;
		padding: 0.125rem 0.25rem;
		background: var(--se-badge-slate, rgba(107, 109, 112, 0.12));
		border-radius: var(--se-radius-sm, 4px);
		color: var(--se-badge-slate-foreground, #4a4c4f);
	}

	/* Readable line lengths for body content */
	.value-cards :global(.expandable-card) :global(p),
	.faq-answer {
		max-width: 70ch;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.value-page {
			padding: var(--se-space-xl, 1.5rem) var(--se-space-md, 1rem);
		}

		.value-container {
			max-width: 100%;
		}

		.jump-nav {
			flex-direction: column;
			align-items: flex-start;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: stretch;
		}

		.cta-button {
			width: 100%;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.cta-button,
		.jump-link,
		.breadcrumb-link,
		.proof-item,
		.faq-item {
			transition: none;
		}
	}
</style>
