<script module lang="ts">
	export type ExplainerTopic = 'pki' | 'storage' | 'value';
</script>

<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { Check, Globe, Lock } from 'lucide-svelte';

	interface Props {
		topic: ExplainerTopic;
		custodyMode: 'browser-encrypted' | 'manual-no-store';
		onSelectCustody: (mode: 'browser-encrypted' | 'manual-no-store') => void;
		onClose: () => void;
		onGenerateIdentity: () => void;
	}

	let {
		topic,
		custodyMode,
		onSelectCustody,
		onClose,
		onGenerateIdentity
	}: Props = $props();

	let subIndex = $state(0);
	let touchStartX = 0;
	let touchStartY = 0;
	let scrollContainer = $state<HTMLDivElement | null>(null);

	let slideCount = $derived(topic === 'pki' ? 2 : topic === 'value' ? 3 : 1);
	let isCorporateSlide = $derived(topic === 'value' && subIndex === 0);
	let decoration = $derived(themeStore.currentTheme.decoration);

	$effect(() => {
		void topic;
		subIndex = 0;
	});

	function nextSubSlide() {
		if (subIndex < slideCount - 1) {
			subIndex += 1;
			if (scrollContainer) scrollContainer.scrollTop = 0;
		}
	}

	function prevSubSlide() {
		if (subIndex > 0) {
			subIndex -= 1;
			if (scrollContainer) scrollContainer.scrollTop = 0;
		} else {
			onClose();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName ?? '';
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			onClose();
			return;
		}
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'PageDown') {
			if (subIndex < slideCount - 1) {
				event.preventDefault();
				event.stopPropagation();
				nextSubSlide();
			}
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'PageUp') {
			event.preventDefault();
			event.stopPropagation();
			prevSubSlide();
		}
	}

	function handleTouchStart(event: TouchEvent) {
		event.stopPropagation();
		if (event.touches.length === 1) {
			touchStartX = event.touches[0].clientX;
			touchStartY = event.touches[0].clientY;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		event.stopPropagation();
		if (event.changedTouches.length !== 1) return;
		const dx = touchStartX - event.changedTouches[0].clientX;
		const dy = touchStartY - event.changedTouches[0].clientY;

		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45) {
			if (dx > 0) {
				nextSubSlide();
			} else {
				prevSubSlide();
			}
			return;
		}

		if (Math.abs(dy) > 55) {
			const el = scrollContainer;
			const atTop = !el || el.scrollTop <= 2;
			const atBottom = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
			if (dy > 0 && atBottom) {
				nextSubSlide();
			} else if (dy < 0 && atTop) {
				prevSubSlide();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	role="dialog"
	aria-modal="true"
	aria-label="Onboarding tool explainer"
	class={`fixed inset-0 z-40 flex flex-col backdrop-blur-md transition-colors duration-300 ${
		isCorporateSlide ? 'bg-[#ffffff]/98 text-[#0f2347]' : 'bg-background/98 text-foreground'
	}`}
	onwheel={(e) => e.stopPropagation()}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- Ambient Background Layer -->
	{#if isCorporateSlide}
		<div
			class="pointer-events-none fixed inset-0 z-0"
			style="background: radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.08), transparent 46%), radial-gradient(circle at 80% 75%, rgba(220, 38, 38, 0.06), transparent 46%);"
		></div>
	{:else}
		{#if decoration === 'grid'}
			<div class="theme-deco-grid pointer-events-none fixed inset-0 z-0 opacity-35"></div>
		{:else if decoration === 'aura'}
			<div class="theme-deco-aura pointer-events-none fixed inset-0 z-0"></div>
		{:else if decoration === 'editorial'}
			<div class="theme-deco-editorial pointer-events-none fixed inset-0 z-0"></div>
		{:else if decoration === 'paper'}
			<div class="theme-deco-paper pointer-events-none fixed inset-0 z-0"></div>
		{/if}
		<div
			class="pointer-events-none fixed inset-0 z-0"
			style="background: radial-gradient(circle at 20% 20%, color-mix(in oklab, var(--illus-green) 16%, transparent), transparent 46%), radial-gradient(circle at 82% 28%, color-mix(in oklab, var(--illus-blue) 14%, transparent), transparent 45%), radial-gradient(circle at 76% 80%, color-mix(in oklab, var(--illus-earth) 14%, transparent), transparent 46%);"
		></div>
	{/if}

	<!-- Top Navigation Bar -->
	<header
		class={`relative z-10 flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-8 ${
			isCorporateSlide ? 'border-[#1d4ed8]/15' : 'border-border'
		}`}
	>
		<button
			type="button"
			onclick={onClose}
			class={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
				isCorporateSlide
					? 'border-[#1d4ed8]/25 bg-white text-[#1d4ed8] hover:bg-[#eff6ff]'
					: 'border-border bg-card text-foreground hover:border-primary hover:bg-secondary'
			}`}
		>
			<span>← Back to Tools</span>
		</button>

		{#if slideCount > 1}
			<div class="flex items-center gap-2" aria-label="Explainer slide progress">
				{#each Array.from({ length: slideCount }, (_, i) => i) as idx (idx)}
					<button
						type="button"
						onclick={() => (subIndex = idx)}
						aria-label={`Slide ${idx + 1} of ${slideCount}`}
						aria-current={subIndex === idx ? 'step' : undefined}
						class={`cursor-pointer rounded-full transition-all duration-300 ${
							subIndex === idx
								? isCorporateSlide
									? 'h-2 w-6 bg-[#dc2626]'
									: 'h-2 w-6 bg-primary'
								: isCorporateSlide
									? 'h-2 w-2 bg-[#1d4ed8]/25 hover:bg-[#1d4ed8]/50'
									: 'h-2 w-2 bg-foreground/20 hover:bg-foreground/45'
						}`}
					></button>
				{/each}
			</div>
		{/if}

		<button
			type="button"
			onclick={onGenerateIdentity}
			class={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
				isCorporateSlide
					? 'bg-[#1d4ed8] text-white hover:bg-[#1e40af]'
					: 'bg-primary text-primary-foreground hover:bg-primary/90'
			}`}
		>
			<span>Generate Identity →</span>
		</button>
	</header>

	<!-- Scrollable Slide Body -->
	<div
		bind:this={scrollContainer}
		class="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
	>
		<div class="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center">
			{#if topic === 'pki'}
				{#if subIndex === 0}
					<!-- 4a.1: Simple PKI Explainer -->
					<div class="space-y-5">
						<div class="space-y-2 text-center">
							<p class="font-mono text-xs font-medium tracking-[0.22em] text-primary uppercase">
								Public Key Infrastructure · 1 / 2
							</p>
							<h2 class="font-serif-hero text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.12] font-semibold text-foreground">
								Your identity is math, not a company account.
							</h2>
						</div>

						<!-- Inline SVG: Public Lock on Network vs Secret Key on Device -->
						<div class="mx-auto w-full max-w-[360px]">
							<svg viewBox="0 0 360 150" class="h-auto w-full overflow-visible" role="img" aria-label="Diagram comparing your shareable public key on the network and your private secret key on your device">
								<!-- Network Node -->
								<rect x="20" y="25" width="130" height="100" rx="16" fill="var(--card)" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.6" />
								<text x="85" y="48" text-anchor="middle" fill="var(--primary)" font-size="10" font-family="JetBrains Mono, monospace">OPEN NETWORK</text>
								<g transform="translate(85, 84)">
									<circle r="20" fill="var(--secondary)" stroke="var(--primary)" stroke-width="1.75" />
									<rect x="-7" y="-2" width="14" height="11" rx="2.5" fill="var(--primary)" />
									<path d="M-4 -2 V-6 A4 4 0 0 1 4 -6 V-2" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" />
								</g>
								<text x="85" y="117" text-anchor="middle" fill="var(--foreground)" font-size="9.5">Public Key (Shareable)</text>

								<!-- Verification Arrow -->
								<line x1="156" y1="75" x2="204" y2="75" stroke="var(--info)" stroke-opacity="0.75" stroke-width="1.8" stroke-dasharray="4 4" />
								<polygon points="154,75 162,71 162,79" fill="var(--info)" />
								<text x="180" y="66" text-anchor="middle" fill="var(--info)" font-size="8.5" font-family="JetBrains Mono, monospace">signs</text>

								<!-- Device Vault -->
								<rect x="210" y="25" width="130" height="100" rx="16" fill="var(--card)" stroke="var(--accent)" stroke-opacity="0.75" stroke-width="1.6" />
								<text x="275" y="48" text-anchor="middle" fill="var(--accent)" font-size="10" font-family="JetBrains Mono, monospace">YOUR DEVICE</text>
								<g transform="translate(275, 84)">
									<circle r="20" fill="var(--secondary)" stroke="var(--accent)" stroke-width="1.75" />
									<circle cx="-4" cy="0" r="4.5" fill="none" stroke="var(--accent)" stroke-width="1.8" />
									<path d="M0.5 0 H9 M6 0 V3.5 M9 0 V2.5" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" />
								</g>
								<text x="275" y="117" text-anchor="middle" fill="var(--foreground)" font-size="9.5">Secret Key (Only You)</text>
							</svg>
						</div>

						<div class="grid gap-3">
							<div class="rounded-2xl border border-primary/30 bg-card/95 p-4">
								<p class="text-sm font-semibold text-primary">Public Key</p>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
									Your shareable address on the network so anyone can verify what you sign.
								</p>
							</div>
							<div class="rounded-2xl border border-accent/30 bg-card/95 p-4">
								<p class="text-sm font-semibold text-accent">Secret (Private) Key</p>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
									Stays only with you — signs your actions and decrypts your private data locally.
								</p>
							</div>
							<div class="rounded-2xl border border-border bg-card/95 p-4">
								<p class="text-sm font-semibold text-foreground">No central gatekeeper</p>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
									No company holds your password or can lock you out.
								</p>
							</div>
						</div>

						<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
							<button
								type="button"
								onclick={onClose}
								class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
							>
								← Back to Tools
							</button>
							<button
								type="button"
								onclick={nextSubSlide}
								class="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
							>
								Next: Choose how to save your secret key →
							</button>
						</div>
					</div>
				{:else}
					<!-- 4a.2: Secret Key Storage Choice -->
					<div class="space-y-5">
						<div class="space-y-2 text-center">
							<p class="font-mono text-xs font-medium tracking-[0.22em] text-primary uppercase">
								Public Key Infrastructure · 2 / 2
							</p>
							<h2 class="font-serif-hero text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.12] font-semibold text-foreground">
								How do you want to save your secret key?
							</h2>
							<p class="text-xs text-muted-foreground sm:text-sm">
								Your choice here configures the identity setup screen next.
							</p>
						</div>

						<div class="space-y-3">
							<button
								type="button"
								onclick={() => onSelectCustody('browser-encrypted')}
								class={`flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-left transition ${
									custodyMode === 'browser-encrypted'
										? 'border-primary bg-primary/10 ring-1 ring-primary'
										: 'border-border bg-card/90 hover:border-primary/60'
								}`}
							>
								<span
									class={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
										custodyMode === 'browser-encrypted'
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-foreground/35'
									}`}
								>
									{#if custodyMode === 'browser-encrypted'}
										<Check class="h-3.5 w-3.5" />
									{/if}
								</span>
								<div class="space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<span class="text-sm font-semibold text-foreground">
											Encrypt in this browser with a local password
										</span>
										<span class="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
											Recommended
										</span>
									</div>
									<p class="text-xs leading-relaxed text-muted-foreground">
										Locked on this device with a password you choose. Fast unlock whenever you return.
									</p>
								</div>
							</button>

							<button
								type="button"
								onclick={() => onSelectCustody('manual-no-store')}
								class={`flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-left transition ${
									custodyMode === 'manual-no-store'
										? 'border-accent bg-accent/10 ring-1 ring-accent'
										: 'border-border bg-card/90 hover:border-accent/60'
								}`}
							>
								<span
									class={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
										custodyMode === 'manual-no-store'
											? 'border-accent bg-accent text-accent-foreground'
											: 'border-foreground/35'
									}`}
								>
									{#if custodyMode === 'manual-no-store'}
										<Check class="h-3.5 w-3.5" />
									{/if}
								</span>
								<div class="space-y-1">
									<span class="text-sm font-semibold text-foreground">
										Save manually / Password manager
									</span>
									<p class="text-xs leading-relaxed text-muted-foreground">
										Never written to browser storage. Copy your key to a password manager or offline backup and paste it each session.
									</p>
								</div>
							</button>
						</div>

						<div class="flex flex-wrap items-center justify-between gap-2.5 pt-2">
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={prevSubSlide}
									class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
								>
									← Back
								</button>
								<button
									type="button"
									onclick={onClose}
									class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
								>
									Back to Tools
								</button>
							</div>
							<button
								type="button"
								onclick={onGenerateIdentity}
								class="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
							>
								Generate Identity →
							</button>
						</div>
					</div>
				{/if}
			{:else if topic === 'storage'}
				<!-- 4b: Decentralized Storage (1 slide) -->
				<div class="space-y-5">
					<div class="space-y-2 text-center">
						<p class="font-mono text-xs font-medium tracking-[0.22em] text-info uppercase">
							Araliya net · Decentralized Storage
						</p>
						<h2 class="font-serif-hero text-[clamp(1.85rem,4.8vw,2.95rem)] leading-[1.12] font-semibold text-foreground">
							Decentralized Storage
						</h2>
					</div>

					<!-- Inline SVG: Local Encryption -> Iroh Relay Ring -> Peer Storage Nodes -->
					<div class="mx-auto w-full max-w-[380px]">
						<svg viewBox="0 0 380 155" class="h-auto w-full overflow-visible" role="img" aria-label="Diagram showing local encryption connected via public Iroh relays to resilient distributed storage nodes">
							<!-- Links -->
							<line x1="88" y1="78" x2="185" y2="78" stroke="var(--accent)" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="4 4" />
							<line x1="195" y1="78" x2="292" y2="34" stroke="var(--primary)" stroke-opacity="0.65" stroke-width="1.8" />
							<line x1="195" y1="78" x2="310" y2="78" stroke="var(--info)" stroke-opacity="0.65" stroke-width="1.8" />
							<line x1="195" y1="78" x2="292" y2="122" stroke="var(--primary)" stroke-opacity="0.65" stroke-width="1.8" />

							<!-- Local Device + XChaCha20 Lock -->
							<rect x="16" y="34" width="76" height="88" rx="14" fill="var(--card)" stroke="var(--accent)" stroke-opacity="0.75" stroke-width="1.6" />
							<g transform="translate(54, 70)">
								<rect x="-8" y="-3" width="16" height="12" rx="2.5" fill="var(--accent)" />
								<path d="M-4.5 -3 V-7.5 A4.5 4.5 0 0 1 4.5 -7.5 V-3" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
							</g>
							<text x="54" y="102" text-anchor="middle" fill="var(--accent)" font-size="8.5" font-family="JetBrains Mono, monospace">LOCAL KEY</text>
							<text x="54" y="113" text-anchor="middle" fill="var(--muted-foreground)" font-size="7.5">Encrypt/Decrypt</text>

							<!-- Iroh Relay Ring -->
							<circle cx="190" cy="78" r="34" fill="var(--secondary)" stroke="var(--info)" stroke-width="1.8" stroke-dasharray="5 4" />
							<circle cx="190" cy="78" r="21" fill="var(--card)" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.4" />
							<text x="190" y="75" text-anchor="middle" fill="var(--foreground)" font-size="9" font-family="JetBrains Mono, monospace">iroh</text>
							<text x="190" y="87" text-anchor="middle" fill="var(--info)" font-size="8">relays</text>

							<!-- Peer Storage Nodes -->
							{#each [{ x: 300, y: 34, label: 'Peer A', stroke: 'var(--primary)' }, { x: 320, y: 78, label: 'Peer B', stroke: 'var(--info)' }, { x: 300, y: 122, label: 'Peer C', stroke: 'var(--primary)' }] as node (node.label)}
								<g transform={`translate(${node.x}, ${node.y})`}>
									<rect x="-24" y="-14" width="48" height="28" rx="10" fill="var(--card)" stroke={node.stroke} stroke-opacity="0.8" stroke-width="1.5" />
									<text x="0" y="3" text-anchor="middle" fill="var(--foreground)" font-size="9" font-family="JetBrains Mono, monospace">{node.label}</text>
								</g>
							{/each}
						</svg>
					</div>

					<ul class="space-y-3 rounded-2xl border border-border bg-card/95 p-5">
						<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
							<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
							<span>The data can be stored anywhere that is connected to internet, no need for servers</span>
						</li>
						<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
							<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-info"></span>
							<span>Public relays (iroh) are used to connect to storage relays,</span>
						</li>
						<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
							<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--illus-green)]"></span>
							<span>As relays are added, the network resilience increases,</span>
						</li>
						<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
							<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
							<span>Data stored encrypted, decrypted only locally with your key</span>
						</li>
					</ul>

					<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
						<button
							type="button"
							onclick={onClose}
							class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
						>
							← Back to Tools
						</button>
						<button
							type="button"
							onclick={onGenerateIdentity}
							class="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
						>
							Generate Identity →
						</button>
					</div>
				</div>
			{:else}
				<!-- 4c: Choice-Centered Value Creation (3 slides) -->
				{#if subIndex === 0}
					<!-- 4c.1: Plain Ad-Based Model (White-Red-Blue Corporate Theme) -->
					<div class="space-y-5">
						<div class="space-y-2 text-center">
							<p class="font-mono text-xs font-semibold tracking-[0.22em] text-[#dc2626] uppercase">
								Choice-Centered Value · 1 / 3
							</p>
							<h2 class="font-serif-hero text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.12] font-semibold text-[#0f2347]">
								Plain ads profit from your attention.
							</h2>
						</div>

						<!-- Inline SVG: Passive attention funnel into opaque ad auction -->
						<div class="mx-auto w-full max-w-[360px]">
							<svg viewBox="0 0 360 140" class="h-auto w-full overflow-visible" role="img" aria-label="Diagram of passive attention funneling into an opaque ad auction">
								<circle cx="52" cy="70" r="24" fill="#ffffff" stroke="#1d4ed8" stroke-width="1.8" />
								<text x="52" y="74" text-anchor="middle" fill="#0f2347" font-size="9.5" font-weight="600">You</text>

								<!-- Funnel -->
								<polygon points="105,36 178,56 178,84 105,104" fill="#eff6ff" stroke="#2563eb" stroke-width="1.6" />
								<text x="140" y="73" text-anchor="middle" fill="#dc2626" font-size="8.5" font-weight="600" font-family="JetBrains Mono, monospace">TRACKING</text>

								<line x1="78" y1="70" x2="103" y2="70" stroke="#2563eb" stroke-dasharray="3 3" stroke-width="1.6" />
								<line x1="180" y1="70" x2="216" y2="70" stroke="#dc2626" stroke-dasharray="3 3" stroke-width="1.6" />

								<!-- Ad Auction Box -->
								<rect x="218" y="34" width="122" height="72" rx="14" fill="#ffffff" stroke="#dc2626" stroke-width="1.8" />
								<text x="279" y="64" text-anchor="middle" fill="#0f2347" font-size="10" font-weight="600">Ad Auction</text>
								<text x="279" y="82" text-anchor="middle" fill="#dc2626" font-size="8.5" font-weight="600">Platform keeps $$</text>
							</svg>
						</div>

						<ul class="space-y-3 rounded-2xl border border-[#2563eb]/25 bg-[#eff6ff]/70 p-5">
							<li class="flex items-start gap-3 text-sm leading-relaxed text-[#0f2347]">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#dc2626]"></span>
								<span>Platforms track clicks, pauses, and behavior silently in the background.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-[#0f2347]">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2563eb]"></span>
								<span>Feeds optimize for outrage and endless scroll time instead of what matters to you.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-[#0f2347]">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#dc2626]"></span>
								<span>Advertisers pay the platform — you get distraction, not value.</span>
							</li>
						</ul>

						<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
							<button
								type="button"
								onclick={onClose}
								class="cursor-pointer rounded-full border border-[#1d4ed8]/25 bg-white px-4 py-2.5 text-xs font-medium text-[#1d4ed8] transition hover:bg-[#eff6ff]"
							>
								← Back to Tools
							</button>
							<button
								type="button"
								onclick={nextSubSlide}
								class="cursor-pointer rounded-full bg-[#1d4ed8] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1e40af] sm:text-sm"
							>
								Next: Question–Answer Model →
							</button>
						</div>
					</div>
				{:else if subIndex === 1}
					<!-- 4c.2: The Question-Answer Model -->
					<div class="space-y-5">
						<div class="space-y-2 text-center">
							<p class="font-mono text-xs font-medium tracking-[0.22em] text-primary uppercase">
								Choice-Centered Value · 2 / 3
							</p>
							<h2 class="font-serif-hero text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.12] font-semibold text-foreground">
								Replace passive ads with deliberate choices.
							</h2>
						</div>

						<!-- Mock Q&A Preview Card -->
						<div class="mx-auto w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
							<div class="flex items-center justify-between gap-2 text-xs">
								<span class="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono font-semibold text-accent">
									Sponsored Question
								</span>
								<div class="flex items-center gap-1.5">
									<span class="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-xs text-primary">
										<Lock class="h-2.5 w-2.5" />
										Private
									</span>
									<span class="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-xs text-info">
										<Globe class="h-2.5 w-2.5" />
										Public
									</span>
								</div>
							</div>
							<p class="font-heading text-sm font-semibold text-foreground">
								Should community infrastructure grants prioritize open relay operators?
							</p>
							<div class="grid grid-cols-2 gap-2 text-xs">
								<div class="flex items-center justify-between rounded-xl border border-primary bg-primary/15 px-3 py-2 font-medium text-foreground">
									<span>Agree</span>
									<Check class="h-3.5 w-3.5 text-primary" />
								</div>
								<div class="rounded-xl border border-border bg-background px-3 py-2 text-muted-foreground">
									Disagree
								</div>
							</div>
						</div>

						<ul class="space-y-3 rounded-2xl border border-border bg-card/95 p-5">
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
								<span>Instead of hidden surveillance, interaction happens through explicit <strong class="text-primary">Public</strong> and <strong class="text-accent">Sponsored</strong> questions.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-info"></span>
								<span>You choose what to answer, with clear context and transparent sponsorship.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
								<span>You decide per answer what stays encrypted privately and what is shared publicly.</span>
							</li>
						</ul>

						<div class="flex flex-wrap items-center justify-between gap-3 pt-2">
							<button
								type="button"
								onclick={prevSubSlide}
								class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
							>
								← Back
							</button>
							<button
								type="button"
								onclick={nextSubSlide}
								class="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
							>
								Next: Value Creation →
							</button>
						</div>
					</div>
				{:else}
					<!-- 4c.3: Democratic Value Creation -->
					<div class="space-y-5">
						<div class="space-y-2 text-center">
							<p class="font-mono text-xs font-medium tracking-[0.22em] text-accent uppercase">
								Choice-Centered Value · 3 / 3
							</p>
							<h2 class="font-serif-hero text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.12] font-semibold text-foreground">
								Monetize your choices, not your attention.
							</h2>
						</div>

						<!-- Inline SVG: Your Choice -> Direct Reward to You + Shared Commons Treasury -->
						<div class="mx-auto w-full max-w-[380px]">
							<svg viewBox="0 0 380 140" class="h-auto w-full overflow-visible" role="img" aria-label="Diagram showing your intentional choice generating direct rewards to you and funding a shared commons treasury">
								<rect x="14" y="42" width="108" height="56" rx="14" fill="var(--secondary)" stroke="var(--primary)" stroke-width="1.6" />
								<text x="68" y="67" text-anchor="middle" fill="var(--foreground)" font-size="10" font-weight="600">Your Choice</text>
								<text x="68" y="83" text-anchor="middle" fill="var(--primary)" font-size="8.5">Intentional Answer</text>

								<path d="M124 70 H175 L218 40" fill="none" stroke="var(--accent)" stroke-width="2" />
								<path d="M124 70 H175 L218 100" fill="none" stroke="var(--info)" stroke-width="2" />

								<rect x="220" y="16" width="146" height="46" rx="12" fill="var(--card)" stroke="var(--accent)" stroke-width="1.6" />
								<text x="293" y="37" text-anchor="middle" fill="var(--accent)" font-size="10" font-weight="600">Direct Reward to You</text>
								<text x="293" y="51" text-anchor="middle" fill="var(--muted-foreground)" font-size="8">Earned for your input</text>

								<rect x="220" y="78" width="146" height="46" rx="12" fill="var(--card)" stroke="var(--info)" stroke-width="1.6" />
								<text x="293" y="99" text-anchor="middle" fill="var(--info)" font-size="10" font-weight="600">Commons Treasury</text>
								<text x="293" y="113" text-anchor="middle" fill="var(--muted-foreground)" font-size="8">Democratic infra &amp; dev</text>
							</svg>
						</div>

						<ul class="space-y-3 rounded-2xl border border-border bg-card/95 p-5">
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
								<span>Answering sponsored questions rewards <strong class="text-accent">you</strong> directly for intentional input.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-info"></span>
								<span>Powered by an open market that no single corporation controls.</span>
							</li>
							<li class="flex items-start gap-3 text-sm leading-relaxed text-foreground">
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
								<span>A share flows back to democratically fund shared infrastructure and protocol development.</span>
							</li>
						</ul>

						<div class="flex flex-wrap items-center justify-between gap-2.5 pt-2">
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={prevSubSlide}
									class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
								>
									← Back
								</button>
								<button
									type="button"
									onclick={onClose}
									class="cursor-pointer rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-secondary"
								>
									Back to Tools
								</button>
							</div>
							<button
								type="button"
								onclick={onGenerateIdentity}
								class="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
							>
								Generate Identity →
							</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>
