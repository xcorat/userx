<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import KeypairCustodyScreen from '$lib/components/onboarding/KeypairCustodyScreen.svelte';

	interface Props {
		initialSlide?: 0 | 3;
	}

	let { initialSlide = 0 }: Props = $props();

	const LAST_SLIDE = 3;
	let currentIndex = $state<number>(untrack(() => initialSlide));
	let ready = $state(untrack(() => initialSlide === LAST_SLIDE));
	let isTransitioning = $state(false);
	let transitionTimer: ReturnType<typeof setTimeout> | null = null;
	let touchStartY = 0;
	let slide3Container = $state<HTMLDivElement | null>(null);

	onMount(() => {
		if (!ready) {
			requestAnimationFrame(() => {
				ready = true;
			});
		}
		return () => {
			if (transitionTimer) clearTimeout(transitionTimer);
		};
	});

	$effect(() => {
		const target = initialSlide;
		if (target !== untrack(() => currentIndex)) {
			currentIndex = target;
			ready = true;
		}
	});

	function goToSlide(index: number) {
		const clamped = Math.max(0, Math.min(LAST_SLIDE, index));
		if (clamped === currentIndex) return;

		currentIndex = clamped;
		isTransitioning = true;
		sessionStore.setOnboardingStep(clamped === LAST_SLIDE ? 'keypair' : 'welcome');

		if (transitionTimer) clearTimeout(transitionTimer);
		transitionTimer = setTimeout(() => {
			isTransitioning = false;
		}, 720);
	}

	function nextSlide() {
		if (currentIndex < LAST_SLIDE) {
			goToSlide(currentIndex + 1);
		}
	}

	function prevSlide() {
		if (currentIndex > 0) {
			goToSlide(currentIndex - 1);
		}
	}

	function canScrollBackFromSlide3(): boolean {
		return currentIndex < LAST_SLIDE || (slide3Container?.scrollTop ?? 0) <= 2;
	}

	function handleWheel(event: WheelEvent) {
		if (isTransitioning) return;
		if (Math.abs(event.deltaY) < 25) return;
		if (event.deltaY > 0) {
			nextSlide();
		} else if (canScrollBackFromSlide3()) {
			prevSlide();
		}
	}

	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 1) {
			touchStartY = event.touches[0].clientY;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (isTransitioning || event.changedTouches.length !== 1) return;
		const deltaY = touchStartY - event.changedTouches[0].clientY;
		if (Math.abs(deltaY) > 45) {
			if (deltaY > 0) {
				nextSlide();
			} else if (canScrollBackFromSlide3()) {
				prevSlide();
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName ?? '';
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
		if (event.key === ' ' && (tag === 'BUTTON' || tag === 'A')) return;

		if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
			if (currentIndex < LAST_SLIDE) {
				event.preventDefault();
				nextSlide();
			}
		} else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
			if (currentIndex > 0 && canScrollBackFromSlide3()) {
				event.preventDefault();
				prevSlide();
			}
		}
	}

	const SLIDE_LABELS = [
		'Screen 1: Digital Commons',
		'Screen 2: Owned Data & Collective Infrastructure',
		'Screen 3: Tend the Garden',
		'Screen 4: Create Identity Form'
	];
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class="hero-root relative h-dvh w-full overflow-hidden bg-[#0b120f] text-[#f4f1ea] select-none"
	onwheel={handleWheel}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- Ambient Sage + Amberleaf Background Glow -->
	<div class="bg-glow pointer-events-none fixed inset-0 z-0"></div>

	<!-- Top Minimal Navigation Bar -->
	<header class="pointer-events-none fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
		<button
			type="button"
			onclick={() => currentIndex > 0 && goToSlide(0)}
			class="pointer-events-auto flex cursor-pointer items-center gap-2.5 text-left"
		>
			<svg class="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
				<circle cx="16" cy="16" r="14" stroke="#34d399" stroke-opacity="0.35" stroke-width="1.5" />
				<path d="M16 7C18.5 10.5 18.5 14 16 16C13.5 14 13.5 10.5 16 7Z" fill="#f5b841" />
				<path d="M24.5 13C21.8 16.2 18.5 17 16 16C17.2 13.4 20.6 11.7 24.5 13Z" fill="#6ee7b7" />
				<path d="M21.2 23.2C17.5 21.8 15.8 18.8 16 16C18.8 16.4 21.2 19.2 21.2 23.2Z" fill="#34d399" />
				<path d="M10.8 23.2C10.8 19.2 13.2 16.4 16 16C16.2 18.8 14.5 21.8 10.8 23.2Z" fill="#6ee7b7" />
				<path d="M7.5 13C11.4 11.7 14.8 13.4 16 16C13.5 17 10.2 16.2 7.5 13Z" fill="#f5b841" fill-opacity="0.85" />
				<circle cx="16" cy="16" r="2.2" fill="#0b120f" />
			</svg>
			<span class="font-serif-hero text-lg tracking-wide text-[#f4f1ea]/90">Araliya</span>
		</button>

		<div class="pointer-events-auto flex items-center gap-2 sm:gap-3">
			{#if !sessionStore.isLoggedIn}
				<button
					type="button"
					onclick={() => sessionStore.openUnlockScreen()}
					class="cursor-pointer rounded-full border border-emerald-400/25 bg-[#101c17]/75 px-3.5 py-1.5 text-xs font-medium text-[#a7f3d0] transition hover:bg-[#182b23]"
				>
					Unlock
				</button>
			{:else}
				<button
					type="button"
					onclick={() => sessionStore.setOnboardingStep('feed')}
					class="cursor-pointer rounded-full border border-emerald-400/25 bg-[#101c17]/75 px-3.5 py-1.5 text-xs font-medium text-[#a7f3d0] transition hover:bg-[#182b23]"
				>
					Feed →
				</button>
			{/if}

			<button
				type="button"
				onclick={() => goToSlide(LAST_SLIDE)}
				class={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-[#f4f1ea]/75 transition hover:bg-white/5 hover:text-[#f4f1ea] ${
					currentIndex === LAST_SLIDE ? 'pointer-events-none opacity-0' : 'opacity-100'
				}`}
			>
				Skip intro →
			</button>
		</div>
	</header>

	<!-- Right-Side Vertical Progress Dots -->
	<nav
		aria-label="Onboarding progress"
		class="fixed top-1/2 right-3 z-30 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-7"
	>
		{#each SLIDE_LABELS as label, idx (idx)}
			<button
				type="button"
				onclick={() => goToSlide(idx)}
				aria-label={label}
				aria-current={currentIndex === idx ? 'step' : undefined}
				class={`cursor-pointer rounded-full transition-all duration-300 ${
					currentIndex === idx
						? 'h-6 w-2.5 bg-[#6ee7b7]'
						: 'h-2.5 w-2.5 bg-white/25 hover:bg-white/50'
				}`}
			></button>
		{/each}
	</nav>

	<!-- Main Vertical Sliding Track -->
	<div
		id="slide-track"
		class="slide-track relative z-10"
		style={`transform: translate3d(0, -${currentIndex * 100}dvh, 0);`}
	>
		<!-- ===================================================================
		     SLIDE 0: Digital Commons / Built for humans..!
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 0}
			aria-label="Digital Commons"
		>
			<div class="flex w-full max-w-4xl flex-col items-center px-4 text-center">
				<div class="mb-5 w-full max-w-[320px] sm:mb-7 sm:max-w-[440px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[36dvh] w-full overflow-visible"
						role="img"
						aria-label="Illustration of humans gathered around a glowing digital commons"
					>
						<defs>
							<radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
								<stop offset="0%" stop-color="#f5b841" stop-opacity="0.45" />
								<stop offset="60%" stop-color="#34d399" stop-opacity="0.14" />
								<stop offset="100%" stop-color="#0b120f" stop-opacity="0" />
							</radialGradient>
							<linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stop-color="#6ee7b7" />
								<stop offset="100%" stop-color="#f5b841" />
							</linearGradient>
						</defs>

						<circle cx="200" cy="140" r="112" fill="url(#sunGlow)" class="halo-pulse" />
						<circle
							cx="200"
							cy="140"
							r="88"
							fill="none"
							stroke="url(#ringGrad)"
							stroke-width="1"
							stroke-dasharray="4 6"
							stroke-opacity="0.45"
							class="spin-slow"
						/>
						<circle
							cx="200"
							cy="140"
							r="56"
							fill="none"
							stroke="#6ee7b7"
							stroke-width="1"
							stroke-opacity="0.28"
							class="halo-pulse-delayed"
						/>

						<path
							d="M115 170 Q200 115 285 170"
							fill="none"
							stroke="#6ee7b7"
							stroke-opacity="0.35"
							stroke-width="1.5"
							stroke-dasharray="3 5"
						/>
						<path
							d="M140 98 Q200 140 260 98"
							fill="none"
							stroke="#f5b841"
							stroke-opacity="0.35"
							stroke-width="1.5"
							stroke-dasharray="3 5"
						/>

						<!-- Center Commons Emblem (Araliya Blossom) -->
						<g transform="translate(200, 140)">
							<circle r="19" fill="#101c17" stroke="#6ee7b7" stroke-opacity="0.5" stroke-width="1.5" />
							<g class="spin-slow" style="transform-origin: 0px 0px;">
								<ellipse cx="0" cy="-9" rx="4" ry="7" fill="#f5b841" fill-opacity="0.9" />
								<ellipse
									cx="8.5"
									cy="-3"
									rx="4"
									ry="7"
									transform="rotate(72 8.5 -3)"
									fill="#6ee7b7"
									fill-opacity="0.85"
								/>
								<ellipse
									cx="5.2"
									cy="7.5"
									rx="4"
									ry="7"
									transform="rotate(144 5.2 7.5)"
									fill="#34d399"
									fill-opacity="0.85"
								/>
								<ellipse
									cx="-5.2"
									cy="7.5"
									rx="4"
									ry="7"
									transform="rotate(216 -5.2 7.5)"
									fill="#6ee7b7"
									fill-opacity="0.85"
								/>
								<ellipse
									cx="-8.5"
									cy="-3"
									rx="4"
									ry="7"
									transform="rotate(288 -8.5 -3)"
									fill="#f5b841"
									fill-opacity="0.85"
								/>
							</g>
							<circle r="4" fill="#0b120f" stroke="#f5b841" stroke-width="1.5" />
						</g>

						<g class="human-bob-1" transform="translate(105, 165)">
							<circle cx="0" cy="-16" r="10" fill="#182b23" stroke="#6ee7b7" stroke-width="2" />
							<path
								d="M-16 14 C-16 0, 16 0, 16 14"
								fill="#182b23"
								stroke="#6ee7b7"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-2" transform="translate(295, 165)">
							<circle cx="0" cy="-16" r="10" fill="#182b23" stroke="#f5b841" stroke-width="2" />
							<path
								d="M-16 14 C-16 0, 16 0, 16 14"
								fill="#182b23"
								stroke="#f5b841"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-3" transform="translate(142, 86)">
							<circle cx="0" cy="-12" r="7.5" fill="#182b23" stroke="#a7f3d0" stroke-width="1.75" />
							<path
								d="M-12 10 C-12 0, 12 0, 12 10"
								fill="#182b23"
								stroke="#a7f3d0"
								stroke-width="1.75"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-1" transform="translate(258, 86)">
							<circle cx="0" cy="-12" r="7.5" fill="#182b23" stroke="#a7f3d0" stroke-width="1.75" />
							<path
								d="M-12 10 C-12 0, 12 0, 12 10"
								fill="#182b23"
								stroke="#a7f3d0"
								stroke-width="1.75"
								stroke-linecap="round"
							/>
						</g>

						<circle cx="80" cy="95" r="2.5" fill="#f5b841" class="mote-1" />
						<circle cx="322" cy="105" r="2" fill="#6ee7b7" class="mote-2" />
						<circle cx="205" cy="48" r="2.5" fill="#a7f3d0" class="mote-3" />
						<circle cx="165" cy="215" r="2" fill="#f5b841" class="mote-2" />
						<circle cx="242" cy="212" r="2.5" fill="#34d399" class="mote-1" />
					</svg>
				</div>

				<p class="reveal-item delay-1 mb-3 text-xs font-medium tracking-[0.24em] text-[#6ee7b7]/85 uppercase sm:text-sm">
					Welcome to Araliya
				</p>
				<h1 class="reveal-item delay-2 font-serif-hero text-[clamp(2.85rem,8vw,5.75rem)] leading-[1.04] font-semibold tracking-tight text-[#f4f1ea]">
					Digital Commons
				</h1>
				<p class="reveal-item delay-3 mt-3 text-[clamp(1.35rem,3.4vw,2.35rem)] font-light tracking-wide text-[#f5b841] sm:mt-4">
					Built for humans..!
				</p>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#6ee7b7]/30 bg-[#182b23]/90 px-6 py-3 text-sm font-medium text-[#f4f1ea] shadow-lg shadow-black/30 transition hover:bg-[#244034] sm:mt-10"
				>
					<span>Continue</span>
					<svg class="chevron-bounce h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 1: You own the data you share / Together we build the infrastructure!
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 1}
			aria-label="Data Ownership and Collective Infrastructure"
		>
			<div class="flex w-full max-w-4xl flex-col items-center px-4 text-center">
				<div class="mb-5 w-full max-w-[320px] sm:mb-7 sm:max-w-[440px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[36dvh] w-full overflow-visible"
						role="img"
						aria-label="Illustration of peer-to-peer nodes with personal cryptographic keys forming a resilient mesh"
					>
						<g stroke-linecap="round" fill="none">
							<line x1="90" y1="90" x2="200" y2="55" stroke="#34d399" stroke-opacity="0.4" stroke-width="2" class="mesh-flow" />
							<line x1="200" y1="55" x2="310" y2="95" stroke="#f5b841" stroke-opacity="0.45" stroke-width="2" class="mesh-flow-reverse" />
							<line x1="90" y1="90" x2="120" y2="205" stroke="#6ee7b7" stroke-opacity="0.35" stroke-width="2" class="mesh-flow-reverse" />
							<line x1="310" y1="95" x2="280" y2="205" stroke="#34d399" stroke-opacity="0.4" stroke-width="2" class="mesh-flow" />
							<line x1="120" y1="205" x2="280" y2="205" stroke="#f5b841" stroke-opacity="0.45" stroke-width="2" class="mesh-flow" />
							<line x1="90" y1="90" x2="280" y2="205" stroke="#6ee7b7" stroke-opacity="0.25" stroke-width="1.5" class="mesh-flow" />
							<line x1="310" y1="95" x2="120" y2="205" stroke="#6ee7b7" stroke-opacity="0.25" stroke-width="1.5" class="mesh-flow-reverse" />
							<line x1="200" y1="55" x2="120" y2="205" stroke="#34d399" stroke-opacity="0.22" stroke-width="1.5" class="mesh-flow" />
							<line x1="200" y1="55" x2="280" y2="205" stroke="#34d399" stroke-opacity="0.22" stroke-width="1.5" class="mesh-flow-reverse" />
						</g>

						<!-- Top Center Node (Your Node with Lock) -->
						<g transform="translate(200, 55)">
							<circle r="28" fill="#101c17" stroke="#f5b841" stroke-width="2" />
							<circle r="35" fill="none" stroke="#f5b841" stroke-opacity="0.25" stroke-width="1.5" class="peer-core" />
							<rect x="-8" y="-3" width="16" height="12" rx="3" fill="#f5b841" />
							<path d="M-4.5 -3 V-7.5 A4.5 4.5 0 0 1 4.5 -7.5 V-3" fill="none" stroke="#f5b841" stroke-width="2.2" stroke-linecap="round" />
							<circle cx="0" cy="3" r="1.8" fill="#0b120f" />
						</g>

						<g transform="translate(90, 90)">
							<circle r="20" fill="#182b23" stroke="#6ee7b7" stroke-width="2" />
							<circle r="7" fill="#6ee7b7" class="peer-core-2" />
						</g>

						<g transform="translate(310, 95)">
							<circle r="20" fill="#182b23" stroke="#6ee7b7" stroke-width="2" />
							<circle r="7" fill="#6ee7b7" class="peer-core" />
						</g>

						<g transform="translate(120, 205)">
							<circle r="22" fill="#182b23" stroke="#34d399" stroke-width="2" />
							<polygon points="0,-8 8,-3 8,5 0,10 -8,5 -8,-3" fill="none" stroke="#a7f3d0" stroke-width="1.6" />
							<polyline points="-8,-3 0,2 8,-3" fill="none" stroke="#a7f3d0" stroke-width="1.4" />
							<line x1="0" y1="2" x2="0" y2="10" stroke="#a7f3d0" stroke-width="1.4" />
						</g>

						<g transform="translate(280, 205)">
							<circle r="22" fill="#182b23" stroke="#34d399" stroke-width="2" />
							<circle cx="-3" cy="0" r="4.5" fill="none" stroke="#f5b841" stroke-width="1.8" />
							<path d="M1.5 0 H9 M6.5 0 V3.5 M9 0 V2.5" stroke="#f5b841" stroke-width="1.8" stroke-linecap="round" />
						</g>

						<g transform="translate(200, 146)">
							<rect x="-46" y="-12" width="92" height="24" rx="12" fill="#0b120f" fill-opacity="0.88" stroke="#34d399" stroke-opacity="0.4" />
							<text x="0" y="4" text-anchor="middle" fill="#a7f3d0" font-family="JetBrains Mono, monospace" font-size="10">araliya-net</text>
						</g>
					</svg>
				</div>

				<p class="reveal-item delay-1 mb-3 text-xs font-medium tracking-[0.24em] text-[#6ee7b7]/85 uppercase sm:text-sm">
					Peer-to-Peer Sovereignty
				</p>
				<h2 class="reveal-item delay-2 font-serif-hero text-[clamp(2.35rem,6.8vw,5rem)] leading-[1.08] font-semibold tracking-tight text-[#f4f1ea]">
					You own the data you share,
				</h2>
				<p class="reveal-item delay-3 mt-3 text-[clamp(1.25rem,3vw,2.15rem)] font-light text-[#a7f3d0] sm:mt-4">
					Together we build the infrastructure!
				</p>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#6ee7b7]/30 bg-[#182b23]/90 px-6 py-3 text-sm font-medium text-[#f4f1ea] shadow-lg shadow-black/30 transition hover:bg-[#244034] sm:mt-10"
				>
					<span>Continue</span>
					<svg class="chevron-bounce h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 2: Tools are here / We are just planting the seeds / Let's tend the garden!
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 2}
			aria-label="Planting the Seeds"
		>
			<div class="flex w-full max-w-4xl flex-col items-center px-4 text-center">
				<div class="mb-5 w-full max-w-[320px] sm:mb-7 sm:max-w-[440px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[36dvh] w-full overflow-visible"
						role="img"
						aria-label="Illustration of seeds dropping into soil and growing into a blooming garden"
					>
						<defs>
							<linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" stop-color="#244034" stop-opacity="0.65" />
								<stop offset="100%" stop-color="#0b120f" stop-opacity="0" />
							</linearGradient>
						</defs>

						<path d="M40 220 Q200 192 360 220 L360 260 L40 260 Z" fill="url(#soilGrad)" />
						<path
							d="M40 220 Q200 192 360 220"
							fill="none"
							stroke="#34d399"
							stroke-opacity="0.45"
							stroke-width="2"
							stroke-linecap="round"
						/>

						<ellipse cx="128" cy="212" rx="4" ry="6" fill="#f5b841" opacity="0" class="seed-drop-1" />
						<ellipse cx="200" cy="205" rx="5" ry="7" fill="#f5b841" opacity="0" class="seed-drop-2" />
						<ellipse cx="272" cy="212" rx="4" ry="6" fill="#f5b841" opacity="0" class="seed-drop-3" />

						<path
							d="M128 212 Q125 170 112 145"
							fill="none"
							stroke="#6ee7b7"
							stroke-width="2.5"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M120 165 C102 158, 98 142, 114 146" fill="#34d399" class="grow-leaf leaf-d1" />
						<path d="M123 175 C140 166, 144 152, 128 158" fill="#6ee7b7" class="grow-leaf leaf-d2" />

						<path
							d="M200 205 Q196 140 200 84"
							fill="none"
							stroke="#34d399"
							stroke-width="3.2"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M198 160 C170 152, 164 128, 195 138" fill="#34d399" class="grow-leaf leaf-d1" />
						<path d="M200 144 C228 136, 234 112, 202 122" fill="#6ee7b7" class="grow-leaf leaf-d2" />
						<path d="M198 118 C176 110, 174 92, 197 100" fill="#a7f3d0" class="grow-leaf leaf-d3" />

						<path
							d="M272 212 Q276 172 288 148"
							fill="none"
							stroke="#6ee7b7"
							stroke-width="2.5"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M280 168 C298 160, 302 145, 286 150" fill="#34d399" class="grow-leaf leaf-d2" />
						<path d="M276 180 C260 172, 256 158, 272 164" fill="#6ee7b7" class="grow-leaf leaf-d3" />

						<g transform="translate(200, 76)" class="bloom-flower">
							<circle r="24" fill="#f5b841" fill-opacity="0.14" />
							<ellipse cx="0" cy="-12" rx="6" ry="11" fill="#f4f1ea" />
							<ellipse cx="11.5" cy="-4" rx="6" ry="11" transform="rotate(72 11.5 -4)" fill="#f4f1ea" />
							<ellipse cx="7" cy="9.5" rx="6" ry="11" transform="rotate(144 7 9.5)" fill="#f4f1ea" />
							<ellipse cx="-7" cy="9.5" rx="6" ry="11" transform="rotate(216 -7 9.5)" fill="#f4f1ea" />
							<ellipse cx="-11.5" cy="-4" rx="6" ry="11" transform="rotate(288 -11.5 -4)" fill="#f4f1ea" />
							<circle r="6" fill="#f5b841" />
						</g>

						<circle cx="155" cy="86" r="2" fill="#f5b841" class="mote-1" />
						<circle cx="248" cy="94" r="2.2" fill="#a7f3d0" class="mote-2" />
						<circle cx="200" cy="36" r="2" fill="#6ee7b7" class="mote-3" />
					</svg>
				</div>

				<p class="reveal-item delay-1 text-[clamp(1.15rem,2.4vw,1.65rem)] font-light text-[#f4f1ea]/75">
					Tools are here,
				</p>
				<h2 class="reveal-item delay-2 mt-1.5 font-serif-hero text-[clamp(2.35rem,6.8vw,5rem)] leading-[1.08] font-semibold tracking-tight text-[#f4f1ea]">
					We are just planting the seeds,
				</h2>
				<p class="reveal-item delay-3 mt-3 font-serif-hero text-[clamp(1.65rem,4vw,2.85rem)] text-[#f5b841] sm:mt-4">
					Let's tend the garden!
				</p>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-8 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[#6ee7b7] px-7 py-3.5 text-sm font-semibold text-[#0b120f] shadow-xl shadow-emerald-950/50 transition hover:bg-[#a7f3d0] sm:mt-10 sm:text-base"
				>
					<span>Create Your Identity</span>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
						<path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 3 (STOPS HERE): First Form Page — Create Your Identity
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 3}
			aria-label="Create Your Identity Form"
		>
			<div
				bind:this={slide3Container}
				class="reveal-item delay-1 flex max-h-dvh w-full items-start justify-center overflow-y-auto px-4 pt-16 pb-8 sm:items-center"
			>
				<KeypairCustodyScreen
					isActive={currentIndex === 3}
					onReplayIntro={() => goToSlide(0)}
				/>
			</div>
		</section>
	</div>
</div>

<style>
	.slide-track {
		height: 100dvh;
		width: 100%;
		transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}

	.screen {
		height: 100dvh;
		width: 100%;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4.25rem 1.5rem 2rem;
		box-sizing: border-box;
		overflow: hidden;
	}

	.bg-glow {
		background:
			radial-gradient(circle at 20% 20%, rgba(52, 211, 153, 0.09), transparent 45%),
			radial-gradient(circle at 80% 75%, rgba(245, 184, 65, 0.08), transparent 45%);
	}

	.reveal-item {
		opacity: 0;
		transform: translateY(22px);
		transition:
			opacity 0.8s ease,
			transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.screen.is-active .reveal-item {
		opacity: 1;
		transform: translateY(0);
	}

	.screen.is-active .delay-1 {
		transition-delay: 0.18s;
	}
	.screen.is-active .delay-2 {
		transition-delay: 0.38s;
	}
	.screen.is-active .delay-3 {
		transition-delay: 0.58s;
	}

	@keyframes slowSpin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulseHalo {
		0%,
		100% {
			transform: scale(0.95);
			opacity: 0.22;
		}
		50% {
			transform: scale(1.07);
			opacity: 0.52;
		}
	}

	@keyframes floatMote {
		0%,
		100% {
			transform: translateY(0px) translateX(0px);
			opacity: 0.35;
		}
		50% {
			transform: translateY(-12px) translateX(5px);
			opacity: 0.9;
		}
	}

	@keyframes gentleBob {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.spin-slow {
		transform-origin: 200px 140px;
		animation: slowSpin 38s linear infinite;
	}

	.halo-pulse {
		transform-origin: 200px 140px;
		animation: pulseHalo 4.8s ease-in-out infinite;
	}

	.halo-pulse-delayed {
		transform-origin: 200px 140px;
		animation: pulseHalo 4.8s ease-in-out 1.6s infinite;
	}

	.human-bob-1 {
		animation: gentleBob 4s ease-in-out infinite;
	}
	.human-bob-2 {
		animation: gentleBob 4.4s ease-in-out 0.6s infinite;
	}
	.human-bob-3 {
		animation: gentleBob 3.8s ease-in-out 1.1s infinite;
	}

	.mote-1 {
		animation: floatMote 5s ease-in-out infinite;
	}
	.mote-2 {
		animation: floatMote 6.2s ease-in-out 1s infinite;
	}
	.mote-3 {
		animation: floatMote 4.6s ease-in-out 2s infinite;
	}

	@keyframes dashFlow {
		to {
			stroke-dashoffset: -48;
		}
	}

	@keyframes nodeGlow {
		0%,
		100% {
			opacity: 0.65;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.12);
		}
	}

	.mesh-flow {
		stroke-dasharray: 6 10;
		animation: dashFlow 2.6s linear infinite;
	}

	.mesh-flow-reverse {
		stroke-dasharray: 5 11;
		animation: dashFlow 3.2s linear infinite reverse;
	}

	.peer-core {
		transform-box: fill-box;
		transform-origin: center;
		animation: nodeGlow 3.6s ease-in-out infinite;
	}

	.peer-core-2 {
		transform-box: fill-box;
		transform-origin: center;
		animation: nodeGlow 4.1s ease-in-out 1.2s infinite;
	}

	.draw-stem {
		stroke-dasharray: 220;
		stroke-dashoffset: 220;
		transition: stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s;
	}

	.screen.is-active .draw-stem {
		stroke-dashoffset: 0;
	}

	.grow-leaf {
		transform-box: fill-box;
		transform-origin: bottom center;
		transform: scale(0);
		opacity: 0;
		transition:
			transform 1s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.7s ease;
	}

	.screen.is-active .grow-leaf {
		transform: scale(1);
		opacity: 1;
	}

	.screen.is-active .leaf-d1 {
		transition-delay: 0.85s;
	}
	.screen.is-active .leaf-d2 {
		transition-delay: 1.05s;
	}
	.screen.is-active .leaf-d3 {
		transition-delay: 1.25s;
	}

	@keyframes seedDrop {
		0% {
			transform: translateY(-28px);
			opacity: 0;
		}
		35% {
			opacity: 1;
		}
		80% {
			transform: translateY(0px);
			opacity: 1;
		}
		100% {
			transform: translateY(3px);
			opacity: 0.85;
		}
	}

	.screen.is-active .seed-drop-1 {
		animation: seedDrop 1.2s ease-out 0.1s forwards;
	}
	.screen.is-active .seed-drop-2 {
		animation: seedDrop 1.2s ease-out 0.35s forwards;
	}
	.screen.is-active .seed-drop-3 {
		animation: seedDrop 1.2s ease-out 0.55s forwards;
	}

	.bloom-flower {
		transform-box: fill-box;
		transform-origin: center;
		transform: scale(0) rotate(-35deg);
		opacity: 0;
		transition:
			transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s,
			opacity 0.8s ease 1.5s;
	}

	.screen.is-active .bloom-flower {
		transform: scale(1) rotate(0deg);
		opacity: 1;
	}

	@keyframes bounceDown {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.6;
		}
		50% {
			transform: translateY(6px);
			opacity: 1;
		}
	}

	.chevron-bounce {
		animation: bounceDown 2.1s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.slide-track {
			transition-duration: 0.2s;
		}
		.reveal-item {
			transition-duration: 0.2s;
		}
		.spin-slow,
		.halo-pulse,
		.halo-pulse-delayed,
		.human-bob-1,
		.human-bob-2,
		.human-bob-3,
		.mote-1,
		.mote-2,
		.mote-3,
		.mesh-flow,
		.mesh-flow-reverse,
		.peer-core,
		.peer-core-2,
		.chevron-bounce {
			animation: none;
		}
	}
</style>
