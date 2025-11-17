<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	interface TableInfo {
		name: string;
		count: number;
		sampleRows: any[];
	}

	interface DbStats {
		tableCount: number;
		timestamp: string;
		tables: TableInfo[];
		repoType: string;
	}

	let dbStats = $state<DbStats | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function loadDbStats() {
		isLoading = true;
		error = null;
		try {
			const response = await fetch('/memeball/test');
			if (!response.ok) {
				throw new Error('Failed to fetch database stats');
			}
			dbStats = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadDbStats();
	});

	function getColumnHeaders(rows: any[]): string[] {
		if (rows.length === 0) return [];
		return Object.keys(rows[0]);
	}

	function formatCellValue(value: any): string {
		if (value === null) return 'NULL';
		if (typeof value === 'string') return value;
		return String(value);
	}
</script>

<svelte:head>
	<title>Memeball - Database Test</title>
	<meta name="description" content="Memeball database debugging and testing" />
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Memeball Database Test</h1>
			<p class="text-sm text-muted-foreground mt-1">View memeball tables and sample data</p>
		</div>
		<div class="flex items-center gap-2">
			<Button onclick={() => goto('/memeball/test/main-layout')}>Open main-layout</Button>
			<Button onclick={loadDbStats} disabled={isLoading}>
			{isLoading ? 'Refreshing...' : 'Refresh'}
		</Button>
		</div>
	</div>

	{#if isLoading && !dbStats}
		<Card.Root>
			<Card.Content class="py-8">
				<p class="text-center text-muted-foreground">Loading database information...</p>
			</Card.Content>
		</Card.Root>
	{:else if error}
		<Card.Root>
			<Card.Content class="py-8">
				<p class="text-center text-destructive">{error}</p>
			</Card.Content>
		</Card.Root>
	{:else if dbStats}
		<!-- Database Overview -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Database Overview</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="grid grid-cols-3 gap-4">
					<div>
						<p class="text-sm text-muted-foreground">Repository Type</p>
						<p class="text-lg font-medium capitalize">{dbStats.repoType}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Total Tables</p>
						<p class="text-lg font-medium">{dbStats.tableCount}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Last Updated</p>
						<p class="text-sm font-medium">{new Date(dbStats.timestamp).toLocaleString()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Table Details -->
		{#each dbStats.tables as table}
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title class="font-mono text-base">{table.name}</Card.Title>
						<span class="text-sm text-muted-foreground">
							{table.count} {table.count === 1 ? 'row' : 'rows'}
						</span>
					</div>
				</Card.Header>
				<Card.Content>
					{#if table.sampleRows.length === 0}
						<p class="text-sm text-muted-foreground italic">No data in this table</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full border-collapse text-sm">
								<thead>
									<tr class="border-b">
										{#each getColumnHeaders(table.sampleRows) as header}
											<th class="text-left p-2 font-semibold bg-muted/50">
												{header}
											</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each table.sampleRows as row}
										<tr class="border-b hover:bg-muted/30">
											{#each getColumnHeaders(table.sampleRows) as key}
												<td class="p-2 font-mono text-xs">
													{formatCellValue(row[key])}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						{#if table.count > 3}
							<p class="text-xs text-muted-foreground mt-2 italic">
								Showing first 3 of {table.count} rows
							</p>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>
