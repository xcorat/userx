<!-- Memeball Independent Layout - No main app navigation -->
<script lang="ts">
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { User, LogOut, Plus, ArrowLeft } from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	
	let { children } = $props();
	let showMenu = $state(false);

	// Ensure user is authenticated for memeball
	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
		}
	});

	function toggleMenu() {
		showMenu = !showMenu;
	}

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}

	function goToMainApp() {
		goto('/questions');
	}

	function goToSubmitMeme() {
		goto('/memeball/add');
		showMenu = false;
	}

	function goToMainMemeball() {
		goto('/memeball/main');
		showMenu = false;
	}
</script>

<!-- Full screen dark space theme -->
<div class="memeball-layout">
	<!-- Minimal overlay UI -->
	{#if authStore.isAuthenticated}
		<div class="memeball-overlay">
			<!-- User avatar and menu trigger (top left) -->
			<div class="user-controls">
				<button
					class="user-avatar"
					onclick={toggleMenu}
					aria-label="Open menu"
				>
					{#if authStore.currentUser?.avatarUrl}
						<img 
							src={authStore.currentUser.avatarUrl} 
							alt={authStore.currentUser.name}
							class="avatar-image"
						/>
					{:else}
						<User size={20} />
					{/if}
				</button>

				<!-- Collapsible menu -->
				{#if showMenu}
					<div class="menu-panel">
						<div class="menu-header">
							<span class="menu-title">Memeball Console</span>
							<button onclick={toggleMenu} class="menu-close" aria-label="Close menu">
								×
							</button>
						</div>
						
						<nav class="menu-nav">
							<button onclick={goToMainMemeball} class="menu-item">
								<span>View Memes</span>
							</button>
							<button onclick={goToSubmitMeme} class="menu-item">
								<Plus size={16} />
								<span>Submit Meme</span>
							</button>
							<button onclick={goToMainApp} class="menu-item">
								<ArrowLeft size={16} />
								<span>Exit to QnA</span>
							</button>
							<hr class="menu-divider" />
							<button onclick={handleLogout} class="menu-item logout">
								<LogOut size={16} />
								<span>Logout</span>
							</button>
						</nav>

						{#if authStore.currentUser}
							<div class="menu-footer">
								<div class="user-info">
									<div class="user-name">{authStore.currentUser.name}</div>
									<div class="user-handle">@{authStore.currentUser.username}</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Main content area -->
	<main class="memeball-content">
		{@render children?.()}
	</main>

	<!-- Menu backdrop -->
	{#if showMenu}
		<div class="menu-backdrop" onclick={toggleMenu}></div>
	{/if}
</div>

<!-- Space-themed toaster -->
<Toaster richColors position="top-right" />

<style>
	:global(body) {
		background-color: #030014;
		color: #f8f5ff;
		overflow-x: hidden;
	}

	.memeball-layout {
		min-height: 100vh;
		background: radial-gradient(circle at top, rgba(88, 28, 135, 0.35), transparent 55%),
			linear-gradient(135deg, #040014 0%, #05011f 50%, #080a29 100%);
		position: relative;
		overflow-x: hidden;
	}

	.memeball-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		pointer-events: none; /* Allow clicks through overlay except on interactive elements */
	}

	.user-controls {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		pointer-events: all;
	}

	.user-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(3, 1, 20, 0.8);
		border: 2px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #f8f5ff;
		cursor: pointer;
		transition: all 200ms ease;
		backdrop-filter: blur(12px);
	}

	.user-avatar:hover {
		border-color: rgba(255, 255, 255, 0.4);
		background: rgba(3, 1, 20, 0.9);
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}

	.menu-panel {
		position: absolute;
		top: 60px;
		left: 0;
		min-width: 280px;
		background: rgba(3, 1, 20, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 16px;
		backdrop-filter: blur(20px);
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
		animation: slideIn 200ms ease;
		overflow: hidden;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.menu-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: #f8f5ff;
		letter-spacing: 0.025em;
	}

	.menu-close {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.menu-close:hover {
		color: #f8f5ff;
	}

	.menu-nav {
		padding: 0.5rem 0;
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1.25rem;
		background: none;
		border: none;
		color: rgba(248, 245, 255, 0.85);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 150ms ease;
		text-align: left;
	}

	.menu-item:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #f8f5ff;
	}

	.menu-item.logout {
		color: rgba(248, 113, 113, 0.8);
	}

	.menu-item.logout:hover {
		background: rgba(248, 113, 113, 0.1);
		color: #f87171;
	}

	.menu-divider {
		border: none;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin: 0.5rem 0;
	}

	.menu-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(0, 0, 0, 0.2);
	}

	.user-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.user-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: #f8f5ff;
	}

	.user-handle {
		font-size: 0.8rem;
		color: rgba(248, 245, 255, 0.6);
	}

	.memeball-content {
		position: relative;
		z-index: 1;
		min-height: 100vh;
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(2px);
	}

	@media (max-width: 640px) {
		.user-controls {
			top: 1rem;
			left: 1rem;
		}

		.user-avatar {
			width: 42px;
			height: 42px;
		}

		.menu-panel {
			min-width: 260px;
		}
	}
</style>