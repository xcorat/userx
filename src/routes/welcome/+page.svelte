<script lang="ts">
	import { goto } from '$app/navigation';
	import { HelpCircle, Flame, Info } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import AuthButtons from '$lib/components/ui/auth-buttons.svelte';

	// State for which panel is expanded (null = none, 'qna' | 'about' | 'memeball')
	let expandedPanel = $state<'qna' | 'about' | 'memeball' | null>(null);

	function expandPanel(panel: 'qna' | 'about' | 'memeball') {
		expandedPanel = panel;
	}

	function collapsePanel(event?: MouseEvent) {
		if (event) {
			event.stopPropagation();
		}
		expandedPanel = null;
	}

	function navigateToQnA() {
		goto('/qna/onboarding');
	}

	function navigateToAbout() {
		goto('/about');
	}

	function navigateToMemeball() {
		goto('/memeball');
	}

	function navigateToLogin() {
		goto('/login');
	}

	function navigateToSignup() {
		goto('/signup');
	}
</script>

<div class="welcome-container">
	<!-- QnA Panel (Light) -->
	<div 
		class="panel qna-panel"
		class:expanded={expandedPanel === 'qna'}
		class:hidden={expandedPanel !== null && expandedPanel !== 'qna'}
		onclick={(e) => {
			if (expandedPanel === null) {
				expandPanel('qna');
			}
		}}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && expandedPanel === null && expandPanel('qna')}
	>
		<div class="panel-content">
			{#if expandedPanel !== 'qna'}
				<div class="icon-container">
					<HelpCircle class="panel-icon" size={120} strokeWidth={1.5} />
				</div>
			{:else}
				<div class="expanded-content" onclick={(e) => e.stopPropagation()}>
					<button class="close-btn" onclick={collapsePanel} aria-label="Close">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
					<div class="card-content">
						<HelpCircle class="card-icon" size={80} strokeWidth={1.5} />
						<h2 class="card-title">Orphos</h2>
						<p class="card-description">
							Ask questions, share answers, and connect with the community. Build your profile with thoughtful responses.
						</p>
						<Button size="lg" class="enter-btn" onclick={navigateToQnA}>
							Enter QnA
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- About Panel (Light Green-Grey) -->
	<div 
		class="panel about-panel"
		class:expanded={expandedPanel === 'about'}
		class:hidden={expandedPanel !== null && expandedPanel !== 'about'}
		onclick={(e) => {
			if (expandedPanel === null) {
				expandPanel('about');
			}
		}}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && expandedPanel === null && expandPanel('about')}
	>
		<div class="panel-content">
			{#if expandedPanel !== 'about'}
				<div class="icon-container">
					<Info class="panel-icon" size={120} strokeWidth={1.5} />
				</div>
			{:else}
				<div class="expanded-content" onclick={(e) => e.stopPropagation()}>
					<button class="close-btn" onclick={collapsePanel} aria-label="Close">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
					<div class="card-content">
						<Info class="card-icon" size={80} strokeWidth={1.5} />
						<h2 class="card-title">About UserX</h2>
						<p class="card-description">
							Learn about our vision for user-owned data, decentralized storage, and privacy-first social platforms.
						</p>
						<Button size="lg" class="enter-btn" onclick={navigateToAbout}>
							Learn More
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Memeball Panel (Dark Galactic) -->
	<div 
		class="panel memeball-panel"
		class:expanded={expandedPanel === 'memeball'}
		class:hidden={expandedPanel !== null && expandedPanel !== 'memeball'}
		onclick={(e) => {
			if (expandedPanel === null) {
				expandPanel('memeball');
			}
		}}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && expandedPanel === null && expandPanel('memeball')}
	>
		<div class="panel-content">
			{#if expandedPanel !== 'memeball'}
				<div class="icon-container">
					<Flame class="panel-icon" size={120} strokeWidth={1.5} />
				</div>
			{:else}
				<div class="expanded-content" onclick={(e) => e.stopPropagation()}>
					<button class="close-btn" onclick={collapsePanel} aria-label="Close">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
					<div class="card-content">
						<Flame class="card-icon" size={80} strokeWidth={1.5} />
						<h2 class="card-title">Memeball</h2>
						<p class="card-description">
							Curate memes for the digital archive in this cosmic experience. Swipe through the galactic collection.
						</p>
						<Button size="lg" class="enter-btn" onclick={navigateToMemeball}>
							Enter Memeball
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Center Controls (Login/Join) -->
	{#if expandedPanel === null}
		<AuthButtons onJoin={navigateToSignup} onLogin={navigateToLogin} />
	{/if}
</div>

<style>
	.welcome-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		display: flex;
	}

	.panel {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: 
			flex 0.8s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
			-webkit-clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1),
			clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
		will-change: clip-path;
		transform: translateZ(0);
	}

	.panel.hidden {
		flex: 0;
		opacity: 0;
		pointer-events: none;
	}

	.panel.expanded {
		flex: 100;
		cursor: default;
		will-change: auto;
	}

	/* QnA Panel - Light, Material Design */
	.qna-panel {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		color: #1e293b;
		-webkit-clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
		clip-path: polygon(0 0, 100% 0, 85% 100%, 0 100%);
		box-shadow: 
			inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
			0 10px 30px -5px rgba(0, 0, 0, 0.1);
	}

	.qna-panel.expanded {
		-webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}

	.qna-panel:not(.expanded):hover {
		box-shadow: 
			inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
			0 20px 40px -5px rgba(0, 0, 0, 0.15);
	}
	
	.qna-panel:not(.expanded):hover .panel-content {
		transform: scale(1.02);
		transition: transform 0.3s ease;
	}

	.qna-panel .panel-icon {
		color: #f97316;
		filter: drop-shadow(0 4px 6px rgba(249, 115, 22, 0.2));
	}

	.qna-panel .card-icon {
		color: #f97316;
	}

	/* About Panel - Light Green-Grey, Matte */
	.about-panel {
		background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
		color: #064e3b;
		-webkit-clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
		clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
		position: relative;
	}

	.about-panel::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(236, 253, 245, 0.3);
		pointer-events: none;
	}

	.about-panel.expanded {
		-webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}

	.about-panel:not(.expanded):hover {
		filter: brightness(1.05);
	}
	
	.about-panel:not(.expanded):hover .panel-content {
		transform: scale(1.02);
		transition: transform 0.3s ease;
	}

	.about-panel .panel-icon {
		color: #059669;
		filter: drop-shadow(0 4px 6px rgba(5, 150, 105, 0.2));
	}

	.about-panel .card-icon {
		color: #059669;
	}

	/* Memeball Panel - Dark Galactic, Glossy */
	.memeball-panel {
		background: 
			radial-gradient(ellipse at top left, rgba(124, 58, 237, 0.3) 0%, transparent 50%),
			radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
			radial-gradient(ellipse at center, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
			linear-gradient(180deg, #0a0014 0%, #1a0030 100%);
		color: #f8f5ff;
		-webkit-clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
		clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
		position: relative;
		overflow: hidden;
	}

	/* Galactic stars effect */
	.memeball-panel::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			radial-gradient(2px 2px at 20% 30%, white, transparent),
			radial-gradient(2px 2px at 60% 70%, white, transparent),
			radial-gradient(1px 1px at 50% 50%, white, transparent),
			radial-gradient(1px 1px at 80% 10%, white, transparent),
			radial-gradient(2px 2px at 90% 60%, white, transparent),
			radial-gradient(1px 1px at 33% 90%, white, transparent);
		background-size: 200% 200%;
		background-position: 0% 0%;
		opacity: 0.3;
		animation: stars 20s ease-in-out infinite;
	}

	/* Glass effect overlay */
	.memeball-panel::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		backdrop-filter: blur(10px);
		pointer-events: none;
	}

	.memeball-panel.expanded {
		-webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
	}

	.memeball-panel:not(.expanded):hover {
		box-shadow: 
			inset 0 0 80px rgba(124, 58, 237, 0.3),
			0 20px 60px -5px rgba(124, 58, 237, 0.4);
	}
	
	.memeball-panel:not(.expanded):hover .panel-content {
		transform: scale(1.02);
		transition: transform 0.3s ease;
	}

	.memeball-panel .panel-icon {
		color: #a78bfa;
		filter: drop-shadow(0 0 20px rgba(167, 139, 250, 0.6));
		animation: float 3s ease-in-out infinite;
	}

	.memeball-panel .card-icon {
		color: #a78bfa;
		filter: drop-shadow(0 0 20px rgba(167, 139, 250, 0.6));
	}

	@keyframes stars {
		0%, 100% {
			background-position: 0% 0%;
		}
		50% {
			background-position: 100% 100%;
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.panel-content {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: translateZ(0);
	}

	.icon-container {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.panel:not(.expanded):hover .icon-container {
		transform: scale(1.1) perspective(1000px) rotateY(5deg);
	}

	.expanded-content {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 0.5s ease-out;
		position: relative;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.close-btn {
		position: absolute;
		top: 2rem;
		right: 2rem;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		z-index: 10;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.3);
		transform: rotate(90deg);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		max-width: 500px;
		text-align: center;
		padding: 2rem;
	}

	.card-title {
		font-size: 3rem;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.card-description {
		font-size: 1.25rem;
		line-height: 1.6;
		opacity: 0.9;
		margin: 0;
	}

	.enter-btn {
		margin-top: 1rem;
		min-width: 200px;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.welcome-container {
			flex-direction: column;
		}

		.qna-panel {
			-webkit-clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
			clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
		}

		.about-panel {
			-webkit-clip-path: polygon(0 15%, 100% 0, 100% 85%, 0 100%);
			clip-path: polygon(0 15%, 100% 0, 100% 85%, 0 100%);
		}

		.memeball-panel {
			-webkit-clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 100%);
			clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 100%);
		}

		.panel.expanded {
			-webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
			clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
		}

		.card-title {
			font-size: 2rem;
		}

		.card-description {
			font-size: 1rem;
		}
	}
</style>

