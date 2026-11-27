<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';
	import { sessionStore } from '$lib/stores/session.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import KeypairCustodyScreen from '$lib/components/onboarding/KeypairCustodyScreen.svelte';
	import OnboardingExplainerDeck, {
		type ExplainerTopic
	} from '$lib/components/onboarding/OnboardingExplainerDeck.svelte';
	import { Check } from 'lucide-svelte';

	interface Props {
		initialSlide?: 0 | 4;
	}

	let { initialSlide = 0 }: Props = $props();

	const LAST_SLIDE = 4;
	let currentIndex = $state<number>(untrack(() => initialSlide));
	let ready = $state(untrack(() => initialSlide === LAST_SLIDE));
	let isTransitioning = $state(false);
	let transitionTimer: ReturnType<typeof setTimeout> | null = null;
	let touchStartY = 0;
	let slide4Container = $state<HTMLDivElement | null>(null);

	let screen3Stage = $state<0 | 1 | 2 | 3>(0);
	let activeExplainer = $state<ExplainerTopic | null>(null);
	let visitedExplainers = $state<Record<ExplainerTopic, boolean>>({
		pki: false,
		storage: false,
		value: false
	});
	let selectedCustodyMode = $state<'browser-encrypted' | 'manual-no-store'>(
		sessionStore.custodyMode === 'manual-no-store' ? 'manual-no-store' : 'browser-encrypted'
	);
	let custodyChosenInIntro = $state(false);

	let isExtractiveScreen = $derived(currentIndex === 1 && activeExplainer === null);
	let decoration = $derived(themeStore.currentTheme.decoration);

	const COMMONS_POINTS = [
		{
			id: 'own-data',
			prefix: 'where ',
			highlight: 'YOU',
			suffix: ' own your data,',
			highlightClass: 'text-accent'
		},
		{
			id: 'collective-infra',
			prefix: 'where we manage infrastructure ',
			highlight: 'collectively,',
			suffix: '',
			highlightClass: 'text-primary'
		},
		{
			id: 'democratic-value',
			prefix: 'And ',
			highlight: 'democratically',
			suffix: ' manage the value we create',
			highlightClass: 'text-info'
		}
	] as const;

	let activeScreen3Point = $derived(
		screen3Stage !== 3 ? COMMONS_POINTS[screen3Stage] : null
	);

	function createUniformCrossfade(duration = 440) {
		const toReceive = new Map<string, DOMRect>();
		const toSend = new Map<string, DOMRect>();

		function morphFrom(from: DOMRect, node: Element): TransitionConfig {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;
			const opacity = +style.opacity;
			const to = node.getBoundingClientRect();
			const dx = from.left + from.width / 2 - (to.left + to.width / 2);
			const dy = from.top + from.height / 2 - (to.top + to.height / 2);
			const rawScale = to.height > 0 ? from.height / to.height : 1;
			const scale = Math.max(0.45, Math.min(2.2, rawScale));

			return {
				duration,
				easing: cubicOut,
				css: (_t, u) => `
					opacity: ${opacity};
					transform-origin: center center;
					transform: ${transform} translate(${u * dx}px, ${u * dy}px) scale(${1 + (scale - 1) * u});
				`
			};
		}

		function makeTransition(
			items: Map<string, DOMRect>,
			counterparts: Map<string, DOMRect>,
			intro: boolean
		) {
			return (node: Element, params: { key: string }): (() => TransitionConfig) => {
				items.set(params.key, node.getBoundingClientRect());
				return () => {
					const other = counterparts.get(params.key);
					if (other) {
						counterparts.delete(params.key);
						if (!intro) {
							return { duration: 0, css: () => 'opacity: 0;' };
						}
						return morphFrom(other, node);
					}
					items.delete(params.key);
					return {
						duration: 240,
						easing: cubicOut,
						css: (t, u) =>
							`opacity: ${t}; transform: translateY(${(intro ? 1 : -1) * u * 12}px);`
					};
				};
			};
		}

		return [
			makeTransition(toSend, toReceive, false),
			makeTransition(toReceive, toSend, true)
		] as const;
	}

	const [sendPoint, receivePoint] = createUniformCrossfade(440);

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

		const prevIndex = currentIndex;
		currentIndex = clamped;
		if (clamped === 2) {
			screen3Stage = prevIndex > 2 ? 3 : 0;
		}
		isTransitioning = true;
		sessionStore.setOnboardingStep(clamped === LAST_SLIDE ? 'keypair' : 'welcome');

		if (transitionTimer) clearTimeout(transitionTimer);
		transitionTimer = setTimeout(() => {
			isTransitioning = false;
		}, 720);
	}

	function nextSlide() {
		if (currentIndex === 2 && screen3Stage < 3) {
			screen3Stage = (screen3Stage + 1) as 0 | 1 | 2 | 3;
			isTransitioning = true;
			if (transitionTimer) clearTimeout(transitionTimer);
			transitionTimer = setTimeout(() => {
				isTransitioning = false;
			}, 420);
			return;
		}
		if (currentIndex < LAST_SLIDE) {
			goToSlide(currentIndex + 1);
		}
	}

	function prevSlide() {
		if (currentIndex === 2 && screen3Stage > 0) {
			screen3Stage = (screen3Stage - 1) as 0 | 1 | 2 | 3;
			isTransitioning = true;
			if (transitionTimer) clearTimeout(transitionTimer);
			transitionTimer = setTimeout(() => {
				isTransitioning = false;
			}, 420);
			return;
		}
		if (currentIndex > 0) {
			goToSlide(currentIndex - 1);
		}
	}

	function canScrollBackFromLastSlide(): boolean {
		return currentIndex < LAST_SLIDE || (slide4Container?.scrollTop ?? 0) <= 2;
	}

	function handleWheel(event: WheelEvent) {
		if (activeExplainer !== null || isTransitioning) return;
		if (Math.abs(event.deltaY) < 25) return;
		if (event.deltaY > 0) {
			nextSlide();
		} else if (canScrollBackFromLastSlide()) {
			prevSlide();
		}
	}

	function handleTouchStart(event: TouchEvent) {
		if (activeExplainer !== null) return;
		if (event.touches.length === 1) {
			touchStartY = event.touches[0].clientY;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (activeExplainer !== null || isTransitioning || event.changedTouches.length !== 1) return;
		const deltaY = touchStartY - event.changedTouches[0].clientY;
		if (Math.abs(deltaY) > 45) {
			if (deltaY > 0) {
				nextSlide();
			} else if (canScrollBackFromLastSlide()) {
				prevSlide();
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (activeExplainer !== null) return;
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
			if (currentIndex > 0 && canScrollBackFromLastSlide()) {
				event.preventDefault();
				prevSlide();
			}
		}
	}

	function openExplainer(topic: ExplainerTopic) {
		activeExplainer = topic;
		visitedExplainers[topic] = true;
	}

	function handleSelectCustody(mode: 'browser-encrypted' | 'manual-no-store') {
		selectedCustodyMode = mode;
		custodyChosenInIntro = true;
		sessionStore.setPreferredCustodyMode(mode);
	}

	function handleGenerateFromExplainer() {
		activeExplainer = null;
		goToSlide(LAST_SLIDE);
	}

	const SLIDE_LABELS = [
		'Screen 1: Digital Commons',
		'Screen 2: Extractive Internet',
		'Screen 3: Digital Public Commons',
		'Screen 4: Planting the Seeds & Tools',
		'Screen 5: Create Identity Form'
	];
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
	class={`hero-root relative h-dvh w-full overflow-hidden select-none transition-colors duration-700 ${
		isExtractiveScreen ? 'bg-[#ffffff] text-[#0f2347]' : 'bg-background text-foreground'
	}`}
	onwheel={handleWheel}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- Ambient Background Layers (Theme Surface vs Screen 2 White-Red-Blue Corporate Grid) -->
	<div
		class={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
			isExtractiveScreen ? 'opacity-0' : 'opacity-100'
		}`}
	>
		{#if decoration === 'grid'}
			<div class="theme-deco-grid absolute inset-0 opacity-35"></div>
		{:else if decoration === 'aura'}
			<div class="theme-deco-aura absolute inset-0"></div>
		{:else if decoration === 'editorial'}
			<div class="theme-deco-editorial absolute inset-0"></div>
		{:else if decoration === 'paper'}
			<div class="theme-deco-paper absolute inset-0"></div>
		{/if}
		<div class="bg-glow absolute inset-0"></div>
	</div>
	<div
		class={`bg-glow-corp pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
			isExtractiveScreen ? 'opacity-100' : 'opacity-0'
		}`}
	></div>

	<!-- Top Minimal Navigation Bar -->
	<header class="pointer-events-none fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
		<button
			type="button"
			onclick={() => currentIndex > 0 && goToSlide(0)}
			class="pointer-events-auto flex cursor-pointer items-center gap-2.5 text-left"
		>
			<svg class="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
				{#if isExtractiveScreen}
					<circle
						cx="16"
						cy="16"
						r="14"
						stroke="#2563eb"
						stroke-opacity="0.5"
						stroke-width="1.5"
					/>
					<path d="M16 7C18.5 10.5 18.5 14 16 16C13.5 14 13.5 10.5 16 7Z" fill="#dc2626" />
					<path d="M24.5 13C21.8 16.2 18.5 17 16 16C17.2 13.4 20.6 11.7 24.5 13Z" fill="#2563eb" />
					<path d="M21.2 23.2C17.5 21.8 15.8 18.8 16 16C18.8 16.4 21.2 19.2 21.2 23.2Z" fill="#1d4ed8" />
					<path d="M10.8 23.2C10.8 19.2 13.2 16.4 16 16C16.2 18.8 14.5 21.8 10.8 23.2Z" fill="#60a5fa" />
					<path d="M7.5 13C11.4 11.7 14.8 13.4 16 16C13.5 17 10.2 16.2 7.5 13Z" fill="#ef4444" fill-opacity="0.9" />
					<circle cx="16" cy="16" r="2.2" fill="#0f2347" />
				{:else}
					<circle
						cx="16"
						cy="16"
						r="14"
						stroke="var(--primary)"
						stroke-opacity="0.5"
						stroke-width="1.5"
					/>
					<path d="M16 7C18.5 10.5 18.5 14 16 16C13.5 14 13.5 10.5 16 7Z" fill="var(--illus-earth)" />
					<path d="M24.5 13C21.8 16.2 18.5 17 16 16C17.2 13.4 20.6 11.7 24.5 13Z" fill="var(--illus-green)" />
					<path d="M21.2 23.2C17.5 21.8 15.8 18.8 16 16C18.8 16.4 21.2 19.2 21.2 23.2Z" fill="var(--primary)" />
					<path d="M10.8 23.2C10.8 19.2 13.2 16.4 16 16C16.2 18.8 14.5 21.8 10.8 23.2Z" fill="var(--illus-blue)" />
					<path d="M7.5 13C11.4 11.7 14.8 13.4 16 16C13.5 17 10.2 16.2 7.5 13Z" fill="var(--accent)" fill-opacity="0.9" />
					<circle cx="16" cy="16" r="2.2" fill="var(--foreground)" />
				{/if}
			</svg>
			<span
				class={`font-serif-hero text-lg tracking-wide transition-colors duration-500 ${
					isExtractiveScreen ? 'text-[#0f2347]' : 'text-foreground'
				}`}
			>
				Araliya
			</span>
		</button>

		<div class="pointer-events-auto flex items-center gap-2 sm:gap-3">
			{#if !sessionStore.isLoggedIn}
				<button
					type="button"
					onclick={() => sessionStore.openUnlockScreen()}
					class={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
						isExtractiveScreen
							? 'border-[#2563eb]/35 bg-white/95 text-[#1d4ed8] hover:bg-[#eff6ff]'
							: 'border-primary/35 bg-card/90 text-foreground hover:bg-secondary'
					}`}
				>
					Unlock
				</button>
			{:else}
				<button
					type="button"
					onclick={() => sessionStore.setOnboardingStep('feed')}
					class={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
						isExtractiveScreen
							? 'border-[#2563eb]/35 bg-white/95 text-[#1d4ed8] hover:bg-[#eff6ff]'
							: 'border-primary/35 bg-card/90 text-foreground hover:bg-secondary'
					}`}
				>
					Feed →
				</button>
			{/if}

			<button
				type="button"
				onclick={() => goToSlide(LAST_SLIDE)}
				class={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
					isExtractiveScreen
						? 'text-[#334e73] hover:bg-[#1d4ed8]/5 hover:text-[#0f2347]'
						: 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
				} ${
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
						? isExtractiveScreen
							? 'h-6 w-2.5 bg-[#dc2626]'
							: 'h-6 w-2.5 bg-primary'
						: isExtractiveScreen
							? 'h-2.5 w-2.5 bg-[#1d4ed8]/25 hover:bg-[#1d4ed8]/50'
							: 'h-2.5 w-2.5 bg-foreground/25 hover:bg-foreground/50'
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
								<stop offset="0%" style="stop-color: var(--illus-green); stop-opacity: 0.32;" />
								<stop offset="58%" style="stop-color: var(--illus-earth); stop-opacity: 0.16;" />
								<stop offset="100%" style="stop-color: var(--background); stop-opacity: 0;" />
							</radialGradient>
							<linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color: var(--illus-green);" />
								<stop offset="50%" style="stop-color: var(--illus-blue);" />
								<stop offset="100%" style="stop-color: var(--accent);" />
							</linearGradient>
						</defs>

						<circle cx="200" cy="140" r="112" fill="url(#sunGlow)" class="halo-pulse" />
						<circle
							cx="200"
							cy="140"
							r="88"
							fill="none"
							stroke="url(#ringGrad)"
							stroke-width="1.25"
							stroke-dasharray="4 6"
							stroke-opacity="0.65"
							class="spin-slow"
						/>
						<circle
							cx="200"
							cy="140"
							r="56"
							fill="none"
							stroke="var(--illus-blue)"
							stroke-width="1.2"
							stroke-opacity="0.55"
							class="halo-pulse-delayed"
						/>

						<path
							d="M115 170 Q200 115 285 170"
							fill="none"
							stroke="var(--primary)"
							stroke-opacity="0.45"
							stroke-width="1.6"
							stroke-dasharray="3 5"
						/>
						<path
							d="M140 98 Q200 140 260 98"
							fill="none"
							stroke="var(--accent)"
							stroke-opacity="0.45"
							stroke-width="1.6"
							stroke-dasharray="3 5"
						/>

						<!-- Center Commons Emblem (Araliya Blossom) -->
						<g transform="translate(200, 140)">
							<circle r="19" fill="var(--card)" stroke="var(--primary)" stroke-opacity="0.7" stroke-width="1.6" />
							<g class="spin-slow" style="transform-origin: 0px 0px;">
								<ellipse cx="0" cy="-9" rx="4" ry="7" fill="var(--illus-earth)" fill-opacity="0.92" />
								<ellipse
									cx="8.5"
									cy="-3"
									rx="4"
									ry="7"
									transform="rotate(72 8.5 -3)"
									fill="var(--illus-green)"
									fill-opacity="0.95"
								/>
								<ellipse
									cx="5.2"
									cy="7.5"
									rx="4"
									ry="7"
									transform="rotate(144 5.2 7.5)"
									fill="var(--primary)"
									fill-opacity="0.9"
								/>
								<ellipse
									cx="-5.2"
									cy="7.5"
									rx="4"
									ry="7"
									transform="rotate(216 -5.2 7.5)"
									fill="var(--illus-blue)"
									fill-opacity="0.9"
								/>
								<ellipse
									cx="-8.5"
									cy="-3"
									rx="4"
									ry="7"
									transform="rotate(288 -8.5 -3)"
									fill="var(--accent)"
									fill-opacity="0.9"
								/>
							</g>
							<circle r="4" fill="var(--foreground)" stroke="var(--card)" stroke-width="1.4" />
						</g>

						<g class="human-bob-1" transform="translate(105, 165)">
							<circle cx="0" cy="-16" r="10" fill="var(--card)" stroke="var(--primary)" stroke-width="2" />
							<path
								d="M-16 14 C-16 0, 16 0, 16 14"
								fill="var(--secondary)"
								stroke="var(--primary)"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-2" transform="translate(295, 165)">
							<circle cx="0" cy="-16" r="10" fill="var(--card)" stroke="var(--accent)" stroke-width="2" />
							<path
								d="M-16 14 C-16 0, 16 0, 16 14"
								fill="var(--secondary)"
								stroke="var(--accent)"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-3" transform="translate(142, 86)">
							<circle cx="0" cy="-12" r="7.5" fill="var(--card)" stroke="var(--info)" stroke-width="1.8" />
							<path
								d="M-12 10 C-12 0, 12 0, 12 10"
								fill="var(--secondary)"
								stroke="var(--info)"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</g>

						<g class="human-bob-1" transform="translate(258, 86)">
							<circle cx="0" cy="-12" r="7.5" fill="var(--card)" stroke="var(--foreground)" stroke-width="1.8" />
							<path
								d="M-12 10 C-12 0, 12 0, 12 10"
								fill="var(--secondary)"
								stroke="var(--foreground)"
								stroke-width="1.8"
								stroke-linecap="round"
							/>
						</g>

						<circle cx="80" cy="95" r="2.5" fill="var(--illus-earth)" class="mote-1" />
						<circle cx="322" cy="105" r="2" fill="var(--illus-green)" class="mote-2" />
						<circle cx="205" cy="48" r="2.5" fill="var(--illus-blue)" class="mote-3" />
						<circle cx="165" cy="215" r="2" fill="var(--accent)" class="mote-2" />
						<circle cx="242" cy="212" r="2.5" fill="var(--primary)" class="mote-1" />
					</svg>
				</div>

				<p class="reveal-item delay-1 mb-3 text-xs font-medium tracking-[0.24em] text-primary uppercase sm:text-sm">
					Welcome to Araliya
				</p>
				<h1 class="reveal-item delay-2 font-serif-hero text-[clamp(2.85rem,8vw,5.75rem)] leading-[1.04] font-semibold tracking-tight text-foreground">
					Digital Commons
				</h1>
				<p class="reveal-item delay-3 mt-3 text-[clamp(1.35rem,3.4vw,2.35rem)] font-light tracking-wide text-accent sm:mt-4">
					Built for humans..!
				</p>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/35 bg-card/95 px-6 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary sm:mt-10"
				>
					<span>Continue</span>
					<svg class="chevron-bounce h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 1 (Screen 2): From centralized, gated and extractive internet (WHITE-RED-BLUE)
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 1}
			aria-label="Centralized and Extractive Internet"
		>
			<div class="flex w-full max-w-4xl flex-col items-center px-4 text-center">
				<div class="mb-5 w-full max-w-[300px] sm:mb-7 sm:max-w-[400px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[33dvh] w-full overflow-visible"
						role="img"
						aria-label="Illustration of a centralized gated corporate silo extracting data and attention from users"
					>
						<defs>
							<radialGradient id="corpCoreGlow" cx="50%" cy="46%" r="50%">
								<stop offset="0%" stop-color="#fee2e2" stop-opacity="0.78" />
								<stop offset="60%" stop-color="#dbeafe" stop-opacity="0.45" />
								<stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
							</radialGradient>
						</defs>

						<circle cx="200" cy="135" r="115" fill="url(#corpCoreGlow)" class="halo-pulse" />
						<circle
							cx="200"
							cy="135"
							r="96"
							fill="none"
							stroke="#2563eb"
							stroke-opacity="0.3"
							stroke-width="1.2"
							stroke-dasharray="4 7"
							class="spin-slow"
						/>

						<!-- Inward Extraction Streams -->
						<g stroke-linecap="round" fill="none">
							<line x1="68" y1="110" x2="156" y2="118" stroke="#dc2626" stroke-opacity="0.78" stroke-width="2" class="mesh-flow" />
							<line x1="332" y1="110" x2="244" y2="118" stroke="#2563eb" stroke-opacity="0.7" stroke-width="2" class="mesh-flow" />
							<line x1="96" y1="215" x2="162" y2="170" stroke="#2563eb" stroke-opacity="0.7" stroke-width="2" class="mesh-flow" />
							<line x1="304" y1="215" x2="238" y2="170" stroke="#dc2626" stroke-opacity="0.78" stroke-width="2" class="mesh-flow" />
						</g>

						<!-- Outer Users Outside the Gate -->
						<g class="human-bob-1" transform="translate(56, 108)">
							<circle r="16" fill="#ffffff" stroke="#1d4ed8" stroke-width="1.8" />
							<circle cx="0" cy="-3" r="4.5" fill="#1e40af" />
							<path d="M-7 8 C-7 2, 7 2, 7 8" fill="#1e40af" />
						</g>
						<g class="human-bob-2" transform="translate(344, 108)">
							<circle r="16" fill="#ffffff" stroke="#2563eb" stroke-width="1.8" />
							<circle cx="0" cy="-3" r="4.5" fill="#dc2626" />
							<path d="M-7 8 C-7 2, 7 2, 7 8" fill="#dc2626" />
						</g>
						<g class="human-bob-3" transform="translate(88, 220)">
							<circle r="14" fill="#ffffff" stroke="#2563eb" stroke-width="1.7" />
							<circle cx="0" cy="-2.5" r="4" fill="#1e40af" />
							<path d="M-6 7 C-6 2, 6 2, 6 7" fill="#1e40af" />
						</g>
						<g class="human-bob-1" transform="translate(312, 220)">
							<circle r="14" fill="#ffffff" stroke="#1d4ed8" stroke-width="1.7" />
							<circle cx="0" cy="-2.5" r="4" fill="#dc2626" />
							<path d="M-6 7 C-6 2, 6 2, 6 7" fill="#dc2626" />
						</g>

						<!-- Central Gated Corporate Silo -->
						<rect
							x="156"
							y="48"
							width="88"
							height="156"
							rx="14"
							fill="#ffffff"
							stroke="#1d4ed8"
							stroke-width="2.2"
						/>
						<!-- Rack Bars -->
						<rect x="172" y="68" width="56" height="9" rx="3" fill="#eff6ff" stroke="#2563eb" stroke-opacity="0.55" />
						<circle cx="179" cy="72.5" r="2.2" fill="#dc2626" />
						<rect x="172" y="85" width="56" height="9" rx="3" fill="#eff6ff" stroke="#2563eb" stroke-opacity="0.55" />
						<circle cx="179" cy="89.5" r="2.2" fill="#2563eb" />
						<rect x="172" y="102" width="56" height="9" rx="3" fill="#eff6ff" stroke="#2563eb" stroke-opacity="0.55" />
						<circle cx="179" cy="106.5" r="2.2" fill="#dc2626" />

						<!-- Locked Gate Emblem -->
						<g transform="translate(200, 154)">
							<circle r="22" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
							<rect x="-8" y="-2" width="16" height="12" rx="2.5" fill="#dc2626" />
							<path
								d="M-4.5 -2 V-6.5 A4.5 4.5 0 0 1 4.5 -6.5 V-2"
								fill="none"
								stroke="#dc2626"
								stroke-width="2.2"
								stroke-linecap="round"
							/>
							<circle cx="0" cy="4" r="1.7" fill="#ffffff" />
						</g>

						<!-- Gate Barrier Line -->
						<line x1="142" y1="204" x2="258" y2="204" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round" />
					</svg>
				</div>

				<p class="reveal-item delay-1 mb-3 text-xs font-semibold tracking-[0.24em] text-[#dc2626] uppercase sm:text-sm">
					The Internet Today
				</p>
				<h2 class="reveal-item delay-2 font-serif-hero text-[clamp(2.1rem,6vw,4.5rem)] leading-[1.08] font-semibold tracking-tight text-[#0f2347]">
					From centralized, gated and extractive internet.
				</h2>
				<p class="reveal-item delay-3 mt-3 max-w-2xl text-[clamp(1.1rem,2.7vw,1.75rem)] font-normal text-[#334e73] sm:mt-4">
					where companies own your data, and profit off of your attention,
				</p>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#1d4ed8] bg-[#1d4ed8] px-6 py-3 text-sm font-medium text-white shadow-md shadow-[#1d4ed8]/20 transition hover:bg-[#1e40af] sm:mt-10"
				>
					<span>Continue</span>
					<svg class="chevron-bounce h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 2 (Screen 3): Towards a digital public commons (Staged Bullets)
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 2}
			aria-label="Towards a Digital Public Commons"
		>
			<div class="flex w-full max-w-4xl flex-col items-center px-4 text-center">
				<div class="mb-3 w-full max-w-[240px] sm:mb-5 sm:max-w-[320px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[20dvh] w-full overflow-visible sm:max-h-[25dvh]"
						role="img"
						aria-label="Illustration of peer-to-peer nodes with personal cryptographic keys forming a resilient mesh"
					>
						<g stroke-linecap="round" fill="none">
							<line x1="90" y1="90" x2="200" y2="55" stroke="var(--illus-green)" stroke-opacity="0.7" stroke-width="2" class="mesh-flow" />
							<line x1="200" y1="55" x2="310" y2="95" stroke="var(--illus-earth)" stroke-opacity="0.7" stroke-width="2" class="mesh-flow-reverse" />
							<line x1="90" y1="90" x2="120" y2="205" stroke="var(--illus-blue)" stroke-opacity="0.7" stroke-width="2" class="mesh-flow-reverse" />
							<line x1="310" y1="95" x2="280" y2="205" stroke="var(--illus-green)" stroke-opacity="0.7" stroke-width="2" class="mesh-flow" />
							<line x1="120" y1="205" x2="280" y2="205" stroke="var(--illus-earth)" stroke-opacity="0.7" stroke-width="2" class="mesh-flow" />
							<line x1="90" y1="90" x2="280" y2="205" stroke="var(--illus-blue)" stroke-opacity="0.45" stroke-width="1.5" class="mesh-flow" />
							<line x1="310" y1="95" x2="120" y2="205" stroke="var(--illus-blue)" stroke-opacity="0.45" stroke-width="1.5" class="mesh-flow-reverse" />
							<line x1="200" y1="55" x2="120" y2="205" stroke="var(--illus-green)" stroke-opacity="0.45" stroke-width="1.5" class="mesh-flow" />
							<line x1="200" y1="55" x2="280" y2="205" stroke="var(--illus-green)" stroke-opacity="0.45" stroke-width="1.5" class="mesh-flow-reverse" />
						</g>

						<!-- Top Center Node (Your Node with Lock) -->
						<g transform="translate(200, 55)">
							<circle r="28" fill="var(--card)" stroke="var(--accent)" stroke-width="2" />
							<circle r="35" fill="none" stroke="var(--accent)" stroke-opacity="0.3" stroke-width="1.5" class="peer-core" />
							<rect x="-8" y="-3" width="16" height="12" rx="3" fill="var(--accent)" />
							<path d="M-4.5 -3 V-7.5 A4.5 4.5 0 0 1 4.5 -7.5 V-3" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" />
							<circle cx="0" cy="3" r="1.8" fill="var(--card)" />
						</g>

						<g transform="translate(90, 90)">
							<circle r="20" fill="var(--secondary)" stroke="var(--primary)" stroke-width="2" />
							<circle r="7" fill="var(--primary)" class="peer-core-2" />
						</g>

						<g transform="translate(310, 95)">
							<circle r="20" fill="var(--secondary)" stroke="var(--info)" stroke-width="2" />
							<circle r="7" fill="var(--info)" class="peer-core" />
						</g>

						<g transform="translate(120, 205)">
							<circle r="22" fill="var(--card)" stroke="var(--info)" stroke-width="2" />
							<polygon points="0,-8 8,-3 8,5 0,10 -8,5 -8,-3" fill="none" stroke="var(--foreground)" stroke-width="1.6" />
							<polyline points="-8,-3 0,2 8,-3" fill="none" stroke="var(--foreground)" stroke-width="1.4" />
							<line x1="0" y1="2" x2="0" y2="10" stroke="var(--foreground)" stroke-width="1.4" />
						</g>

						<g transform="translate(280, 205)">
							<circle r="22" fill="var(--card)" stroke="var(--primary)" stroke-width="2" />
							<circle cx="-3" cy="0" r="4.5" fill="none" stroke="var(--accent)" stroke-width="1.8" />
							<path d="M1.5 0 H9 M6.5 0 V3.5 M9 0 V2.5" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" />
						</g>

						<g transform="translate(200, 146)">
							<rect x="-46" y="-12" width="92" height="24" rx="12" fill="var(--card)" fill-opacity="0.96" stroke="var(--foreground)" stroke-opacity="0.35" />
							<text x="0" y="4" text-anchor="middle" fill="var(--foreground)" font-family="JetBrains Mono, monospace" font-size="10">araliya-net</text>
						</g>
					</svg>
				</div>

				<p class="reveal-item delay-1 mb-2 text-xs font-medium tracking-[0.24em] text-info uppercase sm:text-sm">
					Peer-to-Peer Sovereignty
				</p>
				<h2 class="reveal-item delay-2 font-serif-hero text-[clamp(1.75rem,4.8vw,3.35rem)] leading-[1.1] font-semibold tracking-tight text-foreground">
					Towards a digital public commons
				</h2>

				<!-- Settled Compact Bullet List -->
				{#if screen3Stage > 0}
					<ul class="mt-4 flex w-full max-w-xl flex-col items-start gap-2 rounded-2xl border border-border bg-card/90 px-4 py-3 text-left shadow-sm sm:px-5 sm:py-3.5">
						{#each COMMONS_POINTS.slice(0, screen3Stage) as pt (pt.id)}
							<li
								in:receivePoint={{ key: pt.id }}
								out:sendPoint={{ key: pt.id }}
								animate:flip={{ duration: 420 }}
								class="flex items-start gap-2.5 text-sm leading-snug text-foreground sm:text-base"
							>
								<span class="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
								<span>
									{pt.prefix}<strong class={`font-semibold ${pt.highlightClass}`}>{pt.highlight}</strong>{pt.suffix}
								</span>
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Active Large Hero Focus Point -->
				<div class="relative mt-3 flex min-h-[4.75rem] w-full max-w-2xl items-center justify-center sm:min-h-[5.5rem]">
					{#if activeScreen3Point}
						{#key activeScreen3Point.id}
							<div class="absolute inset-0 flex items-center justify-center px-2">
								<p
									in:receivePoint={{ key: activeScreen3Point.id }}
									out:sendPoint={{ key: activeScreen3Point.id }}
									class="font-serif-hero text-[clamp(1.35rem,3.6vw,2.35rem)] leading-snug font-medium text-foreground"
								>
									{activeScreen3Point.prefix}<span class={activeScreen3Point.highlightClass}>{activeScreen3Point.highlight}</span>{activeScreen3Point.suffix}
								</p>
							</div>
						{/key}
					{/if}
				</div>

				<!-- Stage Dots -->
				<div class="mt-2 flex items-center gap-2" aria-hidden="true">
					{#each COMMONS_POINTS as pt, idx (pt.id)}
						<span
							class={`h-1.5 rounded-full transition-all duration-300 ${
								idx < screen3Stage
									? 'w-5 bg-primary'
									: idx === screen3Stage
										? 'w-6 bg-accent'
										: 'w-2 bg-foreground/20'
							}`}
						></span>
					{/each}
				</div>

				<button
					type="button"
					onclick={nextSlide}
					class="reveal-item delay-3 mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/35 bg-card/95 px-6 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary sm:mt-6 sm:py-3"
				>
					<span>
						{screen3Stage < 3 ? `Swipe up · Next (${screen3Stage + 1}/3)` : 'Continue'}
					</span>
					<svg class="chevron-bounce h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 3 (Screen 4): Planting the seeds & Tools Hub
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === 3}
			aria-label="Planting the Seeds and Tools"
		>
			<div class="flex max-h-full w-full max-w-4xl flex-col items-center overflow-y-auto px-4 py-1 text-center">
				<div class="mb-3 w-full max-w-[230px] sm:mb-4 sm:max-w-[300px]">
					<svg
						viewBox="0 0 400 280"
						class="h-auto max-h-[19dvh] w-full overflow-visible sm:max-h-[23dvh]"
						role="img"
						aria-label="Illustration of seeds dropping into soil and growing into a blooming garden"
					>
						<defs>
							<linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color: var(--illus-earth); stop-opacity: 0.42;" />
								<stop offset="100%" style="stop-color: var(--background); stop-opacity: 0;" />
							</linearGradient>
						</defs>

						<path d="M40 220 Q200 192 360 220 L360 260 L40 260 Z" fill="url(#soilGrad)" />
						<path
							d="M40 220 Q200 192 360 220"
							fill="none"
							stroke="var(--accent)"
							stroke-opacity="0.7"
							stroke-width="2"
							stroke-linecap="round"
						/>

						<ellipse cx="128" cy="212" rx="4" ry="6" fill="var(--accent)" opacity="0" class="seed-drop-1" />
						<ellipse cx="200" cy="205" rx="5" ry="7" fill="var(--foreground)" opacity="0" class="seed-drop-2" />
						<ellipse cx="272" cy="212" rx="4" ry="6" fill="var(--accent)" opacity="0" class="seed-drop-3" />

						<path
							d="M128 212 Q125 170 112 145"
							fill="none"
							stroke="var(--primary)"
							stroke-width="2.5"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M120 165 C102 158, 98 142, 114 146" fill="var(--illus-green)" class="grow-leaf leaf-d1" />
						<path d="M123 175 C140 166, 144 152, 128 158" fill="var(--illus-green-soft)" class="grow-leaf leaf-d2" />

						<path
							d="M200 205 Q196 140 200 84"
							fill="none"
							stroke="var(--primary)"
							stroke-width="3.2"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M198 160 C170 152, 164 128, 195 138" fill="var(--illus-green)" class="grow-leaf leaf-d1" />
						<path d="M200 144 C228 136, 234 112, 202 122" fill="var(--illus-green)" class="grow-leaf leaf-d2" />
						<path d="M198 118 C176 110, 174 92, 197 100" fill="var(--illus-green-soft)" class="grow-leaf leaf-d3" />

						<path
							d="M272 212 Q276 172 288 148"
							fill="none"
							stroke="var(--primary)"
							stroke-width="2.5"
							stroke-linecap="round"
							class="draw-stem"
						/>
						<path d="M280 168 C298 160, 302 145, 286 150" fill="var(--illus-green)" class="grow-leaf leaf-d2" />
						<path d="M276 180 C260 172, 256 158, 272 164" fill="var(--illus-green-soft)" class="grow-leaf leaf-d3" />

						<g transform="translate(200, 76)" class="bloom-flower">
							<circle r="24" fill="var(--illus-blue)" fill-opacity="0.22" />
							<ellipse cx="0" cy="-12" rx="6" ry="11" fill="var(--illus-petal)" stroke="var(--accent)" stroke-width="1" />
							<ellipse cx="11.5" cy="-4" rx="6" ry="11" transform="rotate(72 11.5 -4)" fill="var(--illus-petal)" stroke="var(--accent)" stroke-width="1" />
							<ellipse cx="7" cy="9.5" rx="6" ry="11" transform="rotate(144 7 9.5)" fill="var(--illus-petal)" stroke="var(--accent)" stroke-width="1" />
							<ellipse cx="-7" cy="9.5" rx="6" ry="11" transform="rotate(216 -7 9.5)" fill="var(--illus-petal)" stroke="var(--accent)" stroke-width="1" />
							<ellipse cx="-11.5" cy="-4" rx="6" ry="11" transform="rotate(288 -11.5 -4)" fill="var(--illus-petal)" stroke="var(--accent)" stroke-width="1" />
							<circle r="6" fill="var(--accent)" />
							<circle r="2.2" fill="var(--foreground)" />
						</g>

						<circle cx="155" cy="86" r="2" fill="var(--illus-earth)" class="mote-1" />
						<circle cx="248" cy="94" r="2.2" fill="var(--illus-blue)" class="mote-2" />
						<circle cx="200" cy="36" r="2" fill="var(--illus-green)" class="mote-3" />
					</svg>
				</div>

				<h2 class="reveal-item delay-1 font-serif-hero text-[clamp(1.85rem,5vw,3.35rem)] leading-[1.08] font-semibold tracking-tight text-foreground">
					We are planting the seeds,
				</h2>
				<p class="reveal-item delay-2 mt-1.5 font-serif-hero text-[clamp(1.2rem,3vw,1.95rem)] text-accent">
					Tools are here:
				</p>

				<!-- Explainer Topic Triggers -->
				<div class="reveal-item delay-2 mt-4 w-full max-w-md space-y-2 text-left sm:mt-5 sm:space-y-2.5">
					<button
						type="button"
						onclick={() => openExplainer('pki')}
						class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 transition hover:border-primary hover:bg-card"
					>
						<div class="min-w-0">
							<p class="text-sm font-semibold text-foreground">
								Explain PKI (Public Key Infrastructure)
							</p>
							<p class="text-xs text-muted-foreground">
								Keys, local signing &amp; secret storage choice
							</p>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							{#if custodyChosenInIntro}
								<span class="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary">
									{selectedCustodyMode === 'manual-no-store' ? 'Manual Key' : 'Browser Password'}
								</span>
							{/if}
							{#if visitedExplainers.pki}
								<Check class="h-4 w-4 text-primary" />
							{:else}
								<span class="text-sm text-primary">→</span>
							{/if}
						</div>
					</button>

					<button
						type="button"
						onclick={() => openExplainer('storage')}
						class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 transition hover:border-info hover:bg-card"
					>
						<div class="min-w-0">
							<p class="text-sm font-semibold text-foreground">
								Explain decentralized storage
							</p>
							<p class="text-xs text-muted-foreground">
								Araliya net &amp; encrypted relays
							</p>
						</div>
						<div class="shrink-0">
							{#if visitedExplainers.storage}
								<Check class="h-4 w-4 text-info" />
							{:else}
								<span class="text-sm text-info">→</span>
							{/if}
						</div>
					</button>

					<button
						type="button"
						onclick={() => openExplainer('value')}
						class="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 transition hover:border-accent hover:bg-card"
					>
						<div class="min-w-0">
							<p class="text-sm font-semibold text-foreground">
								Explain Choice-centered value creation
							</p>
							<p class="text-xs text-muted-foreground">
								Question–answer model vs. plain ads
							</p>
						</div>
						<div class="shrink-0">
							{#if visitedExplainers.value}
								<Check class="h-4 w-4 text-accent" />
							{:else}
								<span class="text-sm text-accent">→</span>
							{/if}
						</div>
					</button>
				</div>

				<button
					type="button"
					onclick={() => goToSlide(LAST_SLIDE)}
					class="reveal-item delay-3 mt-5 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 sm:mt-6 sm:py-3.5 sm:text-base"
				>
					<span>Generate Identity</span>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
						<path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
		</section>

		<!-- ===================================================================
		     SLIDE 4 (Screen 5 · STOPS HERE): Create Identity Form
		     =================================================================== -->
		<section
			class="screen"
			class:is-active={ready && currentIndex === LAST_SLIDE}
			aria-label="Create Your Identity Form"
		>
			<div
				bind:this={slide4Container}
				class="reveal-item delay-1 flex max-h-dvh w-full items-start justify-center overflow-y-auto px-4 pt-16 pb-8 sm:items-center"
			>
				<KeypairCustodyScreen
					isActive={currentIndex === LAST_SLIDE}
					preferredCustodyMode={selectedCustodyMode}
					custodyChosenInIntro={custodyChosenInIntro}
					onChangeCustodyMode={handleSelectCustody}
					onBackToTools={() => goToSlide(3)}
					onReplayIntro={() => goToSlide(0)}
				/>
			</div>
		</section>
	</div>

	{#if activeExplainer !== null}
		<OnboardingExplainerDeck
			topic={activeExplainer}
			custodyMode={selectedCustodyMode}
			onSelectCustody={handleSelectCustody}
			onClose={() => (activeExplainer = null)}
			onGenerateIdentity={handleGenerateFromExplainer}
		/>
	{/if}
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
			radial-gradient(circle at 18% 18%, color-mix(in oklab, var(--illus-green) 20%, transparent), transparent 48%),
			radial-gradient(circle at 82% 24%, color-mix(in oklab, var(--illus-blue) 16%, transparent), transparent 46%),
			radial-gradient(circle at 72% 82%, color-mix(in oklab, var(--illus-earth) 14%, transparent), transparent 48%);
	}

	.bg-glow-corp {
		background-color: #ffffff;
		background-image:
			radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.09), transparent 46%),
			radial-gradient(circle at 82% 76%, rgba(220, 38, 38, 0.07), transparent 48%),
			linear-gradient(to right, rgba(29, 78, 216, 0.05) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(29, 78, 216, 0.05) 1px, transparent 1px);
		background-size: 100% 100%, 100% 100%, 28px 28px, 28px 28px;
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
