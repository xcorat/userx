<script lang="ts">
	import { onMount } from 'svelte';
	import { araliyaService, pubkeyToHex } from '$lib/services/araliya.service';
	import { isPseudonymousHandle, ledgerStore } from '$lib/stores/ledger.svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import type { DirectoryUser, PublicProfileField, QuestionItem } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { toast } from 'svelte-sonner';
	import {
		ArrowLeft,
		ChevronRight,
		Copy,
		Globe,
		HelpCircle,
		KeyRound,
		RefreshCw,
		Search,
		ShieldCheck,
		User,
		Users,
		X
	} from 'lucide-svelte';

	const PAGE_LIMIT = 50;
	const MIN_PUBLIC_USERS_PER_BATCH = 20;
	const MAX_SCAN_PAGES = 5;

	const FIELD_LABELS: Record<string, string> = {
		realName: 'Name',
		dateOfBirth: 'Date of Birth',
		pronouns: 'Pronouns',
		username: 'Username'
	};

	let users = $state<DirectoryUser[]>([]);
	let nextCursor = $state<string | null>(null);
	let isLoading = $state(false);
	let isLoadingMore = $state(false);
	let loadError = $state<string | null>(null);

	let searchQuery = $state('');
	let exactMatchUser = $state<DirectoryUser | null>(null);
	let isSearchingExact = $state(false);

	let selectedUser = $state<DirectoryUser | null>(null);
	let publicFields = $state<PublicProfileField[]>([]);
	let isLoadingProfile = $state(false);
	let profileError = $state<string | null>(null);

	let profileRequestSeq = 0;

	let myPubkeyHex = $derived(pubkeyToHex(sessionStore.identity?.userPubkey ?? ''));
	let rootPubkeyHex = $derived(pubkeyToHex(sessionStore.relayStatus?.rootPubkey ?? ''));
	let cleanedQuery = $derived(searchQuery.trim().replace(/^@+/, '').toLowerCase());

	function displayUsername(user: DirectoryUser): string {
		return rootPubkeyHex && user.userPubkeyHex.toLowerCase() === rootPubkeyHex.toLowerCase()
			? 'araliya'
			: user.username;
	}

	function matchesDirectoryQuery(user: DirectoryUser, query: string): boolean {
		if (!query) return true;
		return (
			displayUsername(user).toLowerCase().includes(query) ||
			user.username.toLowerCase().includes(query) ||
			user.displayName.toLowerCase().includes(query) ||
			user.userPubkeyHex.toLowerCase().startsWith(query)
		);
	}

	let filteredUsers = $derived.by(() => {
		const list = users.filter((u) => matchesDirectoryQuery(u, cleanedQuery));
		if (
			exactMatchUser &&
			!isPseudonymousHandle(exactMatchUser.username, exactMatchUser.userPubkeyHex) &&
			matchesDirectoryQuery(exactMatchUser, cleanedQuery) &&
			!list.some((u) => u.userPubkeyHex === exactMatchUser?.userPubkeyHex)
		) {
			list.push(exactMatchUser);
		}
		return list.sort((a, b) =>
			displayUsername(a).toLowerCase().localeCompare(displayUsername(b).toLowerCase())
		);
	});

	let selectedUserQuestions = $derived.by(() => {
		if (!selectedUser) return [];
		const targetPk = selectedUser.userPubkeyHex.toLowerCase();
		return ledgerStore.questions.filter(
			(q) => q.authorPubkeyHex.toLowerCase() === targetPk
		);
	});

	let visiblePublicFields = $derived.by(() => {
		if (!selectedUser) return [];
		const targetUsername = displayUsername(selectedUser);
		const handleLower = targetUsername.toLowerCase();
		return publicFields
			.map((field) => ({
				key: field.key,
				label: FIELD_LABELS[field.key] ?? field.key,
				value:
					field.key === 'username'
						? targetUsername
						: field.value.trim(),
				updatedAt: field.updatedAt
			}))
			.filter((field) => {
				if (!field.value) return false;
				if (field.key === 'username' && field.value.toLowerCase() === handleLower) {
					return false;
				}
				return true;
			});
	});

	function truncatePk(pk: string): string {
		if (!pk || pk.length <= 18) return pk;
		return `${pk.slice(0, 8)}…${pk.slice(-6)}`;
	}

	function formatJoinedDate(ms: number): string | null {
		if (!ms || ms <= 0) return null;
		try {
			return new Date(ms).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch {
			return null;
		}
	}

	function totalQuestionResponses(question: QuestionItem): number {
		return Object.values(question.communityCounts).reduce((sum, count) => sum + count, 0);
	}

	async function copyText(label: string, value: string) {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`Copied ${label}`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}

	async function loadPublicUsers(reset: boolean): Promise<void> {
		if (reset && isLoading) return;
		if (!reset && (isLoadingMore || isLoading || nextCursor === null)) return;

		if (reset) {
			isLoading = true;
			loadError = null;
		} else {
			isLoadingMore = true;
			loadError = null;
		}

		try {
			let cursor = reset ? null : nextCursor;
			const baseList = reset ? [] : [...users];
			const seen = new Set(baseList.map((u) => u.userPubkeyHex));
			let newlyAdded = 0;
			let pagesFetched = 0;

			while (pagesFetched < MAX_SCAN_PAGES) {
				const page = await araliyaService.listUsers(PAGE_LIMIT, cursor);
				pagesFetched += 1;
				cursor = page.nextCursor;

				for (const candidate of page.items) {
					if (!candidate.userPubkeyHex || !candidate.username) continue;
					if (isPseudonymousHandle(candidate.username, candidate.userPubkeyHex)) continue;
					if (seen.has(candidate.userPubkeyHex)) continue;
					seen.add(candidate.userPubkeyHex);
					baseList.push(candidate);
					newlyAdded += 1;
				}

				if (cursor === null || newlyAdded >= MIN_PUBLIC_USERS_PER_BATCH) {
					break;
				}
			}

			users = baseList;
			nextCursor = cursor;
		} catch (err) {
			loadError = err instanceof Error ? err.message : 'Failed to load public users from relay';
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	async function searchRelayByHandle(event?: SubmitEvent): Promise<void> {
		event?.preventDefault();
		if (!cleanedQuery || isSearchingExact) return;

		isSearchingExact = true;
		try {
			const found = await araliyaService.lookupDirectoryUserByUsername(cleanedQuery);
			if (!found || isPseudonymousHandle(found.username, found.userPubkeyHex)) {
				exactMatchUser = null;
				toast.info(`No public user @${cleanedQuery} found on relay`);
				return;
			}
			exactMatchUser = found;
			if (!users.some((u) => u.userPubkeyHex === found.userPubkeyHex)) {
				users = [...users, found];
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to search relay directory');
		} finally {
			isSearchingExact = false;
		}
	}

	function clearSearch() {
		searchQuery = '';
		exactMatchUser = null;
	}

	async function openUserProfile(user: DirectoryUser): Promise<void> {
		selectedUser = user;
		publicFields = [];
		profileError = null;
		isLoadingProfile = true;

		const seq = ++profileRequestSeq;
		if (ledgerStore.questions.length === 0 && rootPubkeyHex) {
			void ledgerStore.loadQuestionsFromRelay(rootPubkeyHex);
		}

		try {
			const fields = await araliyaService.getPublicProfileFields(user.userPubkeyHex);
			if (seq !== profileRequestSeq) return;
			publicFields = fields;
		} catch (err) {
			if (seq !== profileRequestSeq) return;
			profileError =
				err instanceof Error ? err.message : 'Failed to load public profile fields';
		} finally {
			if (seq === profileRequestSeq) {
				isLoadingProfile = false;
			}
		}
	}

	function closeUserProfile() {
		profileRequestSeq += 1;
		selectedUser = null;
		publicFields = [];
		profileError = null;
		isLoadingProfile = false;
	}

	onMount(async () => {
		if (!sessionStore.relayStatus) {
			await sessionStore.refreshRelayStatus().catch(() => null);
		}
		await loadPublicUsers(true);
	});
</script>

<div class="flex h-full flex-col overflow-hidden px-4 pt-3 pb-2">
	{#if selectedUser === null}
		<!-- Header -->
		<header class="flex items-center justify-between gap-2 pb-3">
			<div class="min-w-0">
				<div class="flex items-center gap-2">
					<h1 class="font-heading text-lg font-bold tracking-tight">Users</h1>
					<Badge variant="outline" class="font-mono text-[10px]">
						{users.length} public
					</Badge>
				</div>
				<p class="text-[11px] text-muted-foreground">
					Public handles on this relay
				</p>
			</div>

			<Button
				type="button"
				size="icon-sm"
				variant="outline"
				disabled={isLoading}
				onclick={() => loadPublicUsers(true)}
				aria-label="Refresh users"
				class="cursor-pointer"
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
			</Button>
		</header>

		<!-- Search Bar -->
		<form onsubmit={searchRelayByHandle} class="relative pb-3">
			<Search class="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				oninput={() => {
					if (exactMatchUser && !matchesDirectoryQuery(exactMatchUser, cleanedQuery)) {
						exactMatchUser = null;
					}
				}}
				placeholder="Search public @handles…"
				autocapitalize="none"
				autocomplete="off"
				class="h-9 bg-card/80 pr-9 pl-9 text-xs"
			/>
			{#if searchQuery}
				<button
					type="button"
					onclick={clearSearch}
					aria-label="Clear search"
					class="absolute top-2 right-2.5 cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground"
				>
					<X class="h-4 w-4" />
				</button>
			{/if}
		</form>

		<!-- Scrollable Public Users List -->
		<div class="min-h-0 flex-1 space-y-2 overflow-y-auto pb-4">
			{#if isLoading && users.length === 0}
				<div class="flex flex-col items-center justify-center gap-2.5 py-16 text-center">
					<RefreshCw class="h-5 w-5 animate-spin text-primary" />
					<p class="font-mono text-xs text-muted-foreground">Loading public handles…</p>
				</div>
			{:else if loadError && users.length === 0}
				<div class="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-center text-xs">
					<p class="text-destructive">{loadError}</p>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={() => loadPublicUsers(true)}
						class="cursor-pointer text-xs"
					>
						Retry
					</Button>
				</div>
			{:else if filteredUsers.length === 0}
				<div class="space-y-3 rounded-2xl border border-dashed border-border p-6 text-center">
					<Users class="mx-auto h-6 w-6 text-muted-foreground" />
					<div class="space-y-1">
						<p class="text-xs font-semibold text-foreground">
							{cleanedQuery ? `No loaded handles match "${cleanedQuery}"` : 'No public handles found'}
						</p>
						<p class="text-[11px] leading-relaxed text-muted-foreground">
							Accounts with private handles stay hidden from the directory.
						</p>
					</div>
					{#if cleanedQuery}
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isSearchingExact}
							onclick={() => searchRelayByHandle()}
							class="cursor-pointer text-xs"
						>
							<Search class="mr-1.5 h-3.5 w-3.5" />
							{isSearchingExact ? 'Searching relay…' : `Search relay for @${cleanedQuery}`}
						</Button>
					{/if}
				</div>
			{:else}
				{#each filteredUsers as user (user.userPubkeyHex)}
					{@const isMe = myPubkeyHex.length > 0 && user.userPubkeyHex === myPubkeyHex}
					{@const isGenesis = rootPubkeyHex.length > 0 && user.userPubkeyHex === rootPubkeyHex}
					{@const username = displayUsername(user)}
					{@const showDisplayName =
						user.displayName.length > 0 &&
						user.displayName.toLowerCase() !== username.toLowerCase()}
					<button
						type="button"
						onclick={() => openUserProfile(user)}
						class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/75 bg-card/85 p-3 text-left transition-colors hover:border-primary/45 hover:bg-card"
					>
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-primary">
							{username.slice(0, 1).toUpperCase()}
						</div>

						<div class="min-w-0 flex-1 space-y-0.5">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="truncate text-sm font-semibold text-foreground">
									@{username}
								</span>
								{#if isMe}
									<Badge variant="secondary" class="px-1.5 py-0 text-[10px]">
										You
									</Badge>
								{/if}
								{#if isGenesis}
									<Badge variant="outline" class="border-primary/40 px-1.5 py-0 text-[10px] text-primary">
										<ShieldCheck class="mr-0.5 h-2.5 w-2.5" />
										Genesis
									</Badge>
								{/if}
							</div>

							<p class="truncate text-[11px] text-muted-foreground">
								{#if showDisplayName}
									<span>{user.displayName}</span>
									<span class="mx-1">·</span>
								{/if}
								<span class="font-mono">{truncatePk(user.userPubkeyHex)}</span>
							</p>
						</div>

						<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground" />
					</button>
				{/each}

				{#if cleanedQuery && !filteredUsers.some((u) => u.username.toLowerCase() === cleanedQuery)}
					<div class="pt-1">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isSearchingExact}
							onclick={() => searchRelayByHandle()}
							class="h-8 w-full cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
						>
							<Search class="mr-1.5 h-3 w-3" />
							{isSearchingExact ? 'Searching relay…' : `Search relay for exact @${cleanedQuery}`}
						</Button>
					</div>
				{/if}

				{#if nextCursor !== null}
					<div class="pt-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isLoadingMore}
							onclick={() => loadPublicUsers(false)}
							class="h-9 w-full cursor-pointer text-xs"
						>
							{isLoadingMore ? 'Loading more…' : 'Load More'}
						</Button>
					</div>
				{/if}
			{/if}
		</div>
	{:else}
		{@const isMe = myPubkeyHex.length > 0 && selectedUser.userPubkeyHex === myPubkeyHex}
		{@const isGenesis = rootPubkeyHex.length > 0 && selectedUser.userPubkeyHex === rootPubkeyHex}
		{@const username = displayUsername(selectedUser)}
		{@const showDisplayName =
			selectedUser.displayName.length > 0 &&
			selectedUser.displayName.toLowerCase() !== username.toLowerCase()}
		{@const joinedDate = formatJoinedDate(selectedUser.createdAtMs)}

		<!-- Profile Detail Header -->
		<header class="flex items-center justify-between gap-2 pb-3">
			<Button
				type="button"
				size="sm"
				variant="ghost"
				onclick={closeUserProfile}
				class="-ml-2 h-8 cursor-pointer px-2 text-xs font-semibold"
			>
				<ArrowLeft class="mr-1.5 h-3.5 w-3.5" />
				Back to Users
			</Button>

			<Button
				type="button"
				size="icon-sm"
				variant="outline"
				disabled={isLoadingProfile}
				onclick={() => selectedUser && openUserProfile(selectedUser)}
				aria-label="Refresh user profile"
				class="cursor-pointer"
			>
				<RefreshCw class={`h-3.5 w-3.5 ${isLoadingProfile ? 'animate-spin' : ''}`} />
			</Button>
		</header>

		<!-- Scrollable Profile Detail Body -->
		<div class="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
			<!-- Identity Card -->
			<div class="space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4">
				<div class="flex items-start gap-3">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-lg font-bold text-primary">
						{username.slice(0, 1).toUpperCase()}
					</div>

					<div class="min-w-0 flex-1 space-y-1">
						<div class="flex flex-wrap items-center gap-1.5">
							<h2 class="truncate font-heading text-lg font-bold tracking-tight">
								@{username}
							</h2>
							{#if isMe}
								<Badge variant="secondary" class="px-1.5 py-0 text-[10px]">
									You
								</Badge>
							{/if}
							{#if isGenesis}
								<Badge variant="outline" class="border-primary/40 px-1.5 py-0 text-[10px] text-primary">
									<ShieldCheck class="mr-0.5 h-2.5 w-2.5" />
									Genesis
								</Badge>
							{/if}
						</div>

						{#if showDisplayName}
							<p class="truncate text-xs font-medium text-foreground/90">
								{selectedUser.displayName}
							</p>
						{/if}

						<div class="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
							<span class="inline-flex items-center gap-1 text-primary">
								<Globe class="h-3 w-3" />
								Public Handle
							</span>
							{#if joinedDate}
								<span>· Joined {joinedDate}</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={() => selectedUser && copyText('handle', `@${displayUsername(selectedUser)}`)}
						class="h-8 flex-1 cursor-pointer text-[11px]"
					>
						<Copy class="mr-1.5 h-3 w-3" />
						Copy @handle
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onclick={() => selectedUser && copyText('public key', selectedUser.userPubkeyHex)}
						class="h-8 flex-1 cursor-pointer text-[11px]"
					>
						<KeyRound class="mr-1.5 h-3 w-3" />
						Copy Pubkey
					</Button>
				</div>

				<Separator />

				<div class="space-y-1">
					<p class="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
						Public Key
					</p>
					<p class="rounded-lg border border-border/70 bg-background/70 p-2.5 font-mono text-[11px] break-all text-foreground/90">
						{selectedUser.userPubkeyHex}
					</p>
				</div>
			</div>

			<!-- Public Profile Fields Card -->
			<div class="space-y-2.5 rounded-2xl border border-border/80 bg-card/85 p-4">
				<div class="flex items-center gap-2 text-xs font-semibold text-foreground">
					<User class="h-4 w-4 text-primary" />
					Public Profile Fields
				</div>

				{#if isLoadingProfile}
					<div class="flex items-center gap-2 py-2 text-xs text-muted-foreground">
						<RefreshCw class="h-3.5 w-3.5 animate-spin text-primary" />
						Loading public profile…
					</div>
				{:else if profileError}
					<p class="text-xs text-destructive">{profileError}</p>
				{:else if visiblePublicFields.length === 0}
					<p class="text-xs text-muted-foreground">
						No additional public profile fields shared.
					</p>
				{:else}
					<div class="space-y-2">
						{#each visiblePublicFields as field (field.key)}
							<div class="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-xs">
								<span class="text-muted-foreground">{field.label}</span>
								<span class="truncate font-medium text-foreground">{field.value}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Public Questions Authored Card -->
			<div class="space-y-2.5 rounded-2xl border border-border/80 bg-card/85 p-4">
				<div class="flex items-center justify-between gap-2">
					<div class="flex items-center gap-2 text-xs font-semibold text-foreground">
						<HelpCircle class="h-4 w-4 text-primary" />
						Public Questions Authored
					</div>
					<Badge variant="outline" class="font-mono text-[10px]">
						{selectedUserQuestions.length}
					</Badge>
				</div>

				{#if selectedUserQuestions.length === 0}
					<p class="text-xs text-muted-foreground">
						No public questions posted yet.
					</p>
				{:else}
					<div class="space-y-2">
						{#each selectedUserQuestions as q (q.cid)}
							<div class="space-y-1.5 rounded-xl border border-border/70 bg-background/60 p-3">
								<p class="text-xs font-medium leading-snug text-foreground">
									{q.text}
								</p>
								<p class="font-mono text-[10px] text-muted-foreground">
									{totalQuestionResponses(q)} public {totalQuestionResponses(q) === 1 ? 'response' : 'responses'}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
