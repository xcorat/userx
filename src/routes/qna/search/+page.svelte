<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import DIContainer from '$lib/config/di-container';
	import type { User, RelationStatus } from '$lib/models';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Search, UserPlus, UserCheck, UserX, Clock } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let searchQuery = $state('');
	let allUsers = $state<User[]>([]);
	let filteredUsers = $state<User[]>([]);
	let relationStatuses = $state<Map<string, { status: RelationStatus | 'none'; relationId?: string; isInitiator?: boolean }>>(new Map());
	let isLoading = $state(false);

	onMount(async () => {
		console.log('Current Auth User ID on Mount:', authStore.currentUser);
		await loadUsers();
	});

	async function loadUsers() {
		try {
			isLoading = true;
			const userService = DIContainer.getUserService();
			const users = await userService.getAllUsers();

			// Filter out the current logged-in user
			allUsers = users.filter(u => u.id !== authStore.currentUser?.id);
			filteredUsers = allUsers;
            
            console.log('Auth user:', authStore.currentUser?.id);
			// Load relation statuses for all users
			if (authStore.currentUser) {
				await loadRelationStatuses();
			}
		} catch (error) {
			console.error('Failed to load users:', error);
			toast.error('Failed to load users');
		} finally {
			isLoading = false;
		}
	}

	async function loadRelationStatuses() {
		if (!authStore.currentUser) return;

		try {
			const relationService = DIContainer.getRelationService();
			const newStatuses = new Map<string, { status: RelationStatus | 'none'; relationId?: string; isInitiator?: boolean }>();

			for (const user of allUsers) {
				const status = await relationService.getRelationStatus(authStore.currentUser.id, user.id);
				newStatuses.set(user.id, status);
			}

			relationStatuses = newStatuses;
		} catch (error) {
			console.error('Failed to load relation statuses:', error);
		}
	}

	function handleSearch() {
		if (!searchQuery.trim()) {
			filteredUsers = allUsers;
			return;
		}

		const query = searchQuery.toLowerCase();
		filteredUsers = allUsers.filter(user =>
			user.name.toLowerCase().includes(query) ||
			user.username.toLowerCase().includes(query) ||
			user.email.toLowerCase().includes(query)
		);
	}

	async function sendFriendRequest(userId: string) {
		if (!authStore.currentUser) {
			toast.error('Please log in to send friend requests');
			return;
		}

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.sendRequest(authStore.currentUser.id, userId);
			toast.success('Friend request sent!');
			await loadRelationStatuses();
		} catch (error) {
			console.error('Failed to send friend request:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to send friend request');
		}
	}

	async function removeRelation(userId: string) {
		if (!authStore.currentUser) return;

		const status = relationStatuses.get(userId);
		if (!status?.relationId) return;

		try {
			const relationService = DIContainer.getRelationService();
			await relationService.removeRelation(authStore.currentUser.id, status.relationId);
			toast.success('Removed successfully');
			await loadRelationStatuses();
		} catch (error) {
			console.error('Failed to remove relation:', error);
			toast.error('Failed to remove relation');
		}
	}

	function getRelationButtonContent(userId: string) {
		const status = relationStatuses.get(userId);

		if (!status || status.status === 'none') {
			return {
				text: 'Add Friend',
				icon: UserPlus,
				variant: 'default' as const,
				action: () => sendFriendRequest(userId)
			};
		}

		if (status.status === 'pending') {
			if (status.isInitiator) {
				return {
					text: 'Pending',
					icon: Clock,
					variant: 'outline' as const,
					action: () => removeRelation(userId)
				};
			} else {
				return {
					text: 'Accept/Reject',
					icon: Clock,
					variant: 'secondary' as const,
					action: () => {} // Should navigate to pending requests
				};
			}
		}

		if (status.status === 'approved') {
			return {
				text: 'Friends',
				icon: UserCheck,
				variant: 'secondary' as const,
				action: () => removeRelation(userId)
			};
		}

		if (status.status === 'rejected') {
			return {
				text: 'Rejected',
				icon: UserX,
				variant: 'ghost' as const,
				action: () => sendFriendRequest(userId)
			};
		}

		return {
			text: 'Add Friend',
			icon: UserPlus,
			variant: 'default' as const,
			action: () => sendFriendRequest(userId)
		};
	}
</script>

<div class="space-y-6">
<div class="flex items-center justify-between">
<h1 class="text-3xl font-bold">Search Users</h1>
</div>

<!-- Search Bar -->
<div class="flex gap-2">
<div class="relative flex-1">
<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input
type="text"
placeholder="Search by name, username, or email..."
bind:value={searchQuery}
class="pl-9"
/>
</div>
<Button onclick={handleSearch}>Search</Button>
</div>

<!-- Results -->
<div class="space-y-4">
{#if isLoading}
<div class="text-center py-8 text-muted-foreground">
Loading users...
</div>
{:else if filteredUsers.length === 0}
<div class="text-center py-8 text-muted-foreground">
{searchQuery ? 'No users found matching your search.' : 'No users available.'}
</div>
{:else}
{#each filteredUsers as user (user.id)}
<div class="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
<div class="flex items-center gap-4">
{#if user.avatarUrl}
<img src={user.avatarUrl} alt={user.name} class="w-12 h-12 rounded-full" />
{:else}
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
<span class="text-lg font-semibold text-primary">
{user.name.charAt(0).toUpperCase()}
</span>
</div>
{/if}

<div>
<h3 class="font-semibold">{user.name}</h3>
<p class="text-sm text-muted-foreground">@{user.username}</p>
</div>
</div>

{#if authStore.currentUser}
{@const buttonInfo = getRelationButtonContent(user.id)}
{@const IconComponent = buttonInfo.icon}
<Button 
variant={buttonInfo.variant} 
size="sm"
onclick={buttonInfo.action}
>
<IconComponent class="w-4 h-4 mr-1" />
{buttonInfo.text}
</Button>
{/if}
</div>
{/each}
{/if}
</div>
</div>
