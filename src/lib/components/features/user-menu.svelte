<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.store.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { User, LogOut, MessageCircle, Users, Home } from 'lucide-svelte';
	
	function handleLogout() {
		authStore.logout();
		goto('/login');
	}
	
	function goToProfile() {
		if (authStore.currentUser) {
			goto(`/profile/${authStore.currentUser.id}`);
		}
	}
	
	function goToMyProfile() {
		goto('/profile');
	}

	function goToMain() {
		goto('/');
	}

	function goToFriends() {
		goto('/friends');
	}

	function goToDMs() {
		goto('/dm');
	}
	
	// Get user initials from name
	function getInitials(name: string): string {
		return name
			.split(' ')
			.map(part => part.charAt(0).toUpperCase())
			.slice(0, 2)
			.join('');
	}
</script>

{#if authStore.currentUser}
	<DropdownMenu>
		<DropdownMenuTrigger class="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
			<Avatar class="h-8 w-8">
				{#if authStore.currentUser.avatarUrl}
					<AvatarImage src={authStore.currentUser.avatarUrl} alt={authStore.currentUser.name} />
				{/if}
				<AvatarFallback>{getInitials(authStore.currentUser.name)}</AvatarFallback>
			</Avatar>
		</DropdownMenuTrigger>
		
		<DropdownMenuContent align="end" class="w-56">
			<DropdownMenuLabel class="font-normal">
				<div class="flex flex-col space-y-1">
					<p class="text-sm font-medium leading-none">{authStore.currentUser.name}</p>
					<p class="text-xs leading-none text-muted-foreground">
						{authStore.currentUser.email}
					</p>
				</div>
			</DropdownMenuLabel>
			
			<DropdownMenuSeparator />
			
			<DropdownMenuItem onclick={goToMain}>
				<Home class="mr-2 h-4 w-4" />
				<span>Main Menu</span>
			</DropdownMenuItem>
			
			<DropdownMenuItem onclick={goToMyProfile}>
				<User class="mr-2 h-4 w-4" />
				<span>Profile</span>
			</DropdownMenuItem>

			<DropdownMenuItem onclick={goToFriends}>
				<Users class="mr-2 h-4 w-4" />
				<span>Friends</span>
			</DropdownMenuItem>

			<DropdownMenuItem onclick={goToDMs}>
				<MessageCircle class="mr-2 h-4 w-4" />
				<span>Messages</span>
			</DropdownMenuItem>
			
			<DropdownMenuSeparator />
			
			<DropdownMenuItem onclick={handleLogout}>
				<LogOut class="mr-2 h-4 w-4" />
				<span>Logout</span>
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
{/if}