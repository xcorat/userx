<script lang="ts">
    import type { AppMenuItem } from '$lib/models/types';
    import { Command, HelpCircle, Flame, Info } from 'lucide-svelte';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '$lib/components/ui/dropdown-menu';

    export let showApps: boolean = true;
    export let apps: AppMenuItem[] | null = null;
    export let align: 'start' | 'end' = 'start';

    const defaultApps: AppMenuItem[] = [
        { id: 'orph', label: 'Orph', path: '/qna/answers', Icon: HelpCircle },
        { id: 'memeball', label: 'Memeball', path: '/memeball', Icon: Flame }
    ];

    $: _apps = apps ?? defaultApps;
</script>

<DropdownMenu>
    <DropdownMenuTrigger aria-label="App Selection" class="p-2 hover:bg-muted rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <slot name="trigger">
            <Command class="h-6 w-6" />
        </slot>
    </DropdownMenuTrigger>

    <DropdownMenuContent align={align} class="min-w-[14rem]">
        <!-- Optional top slot (custom quick links or actions) -->
        <slot name="top" />

        {#if showApps}
            {#each _apps as app}
                <DropdownMenuItem>
                    <a href={app.path} class="flex items-center gap-2 w-full">
                        {#if app.Icon}
                            <svelte:component this={app.Icon} class="h-4 w-4 mr-2" />
                        {/if}
                        <span>{app.label}</span>
                    </a>
                </DropdownMenuItem>
            {/each}
        {/if}

        <DropdownMenuSeparator />

        <!-- Default bottom group: single Information / About item -->
        <DropdownMenuItem>
            <a href="/about" class="flex items-center gap-2 w-full">
                <Info class="h-4 w-4 mr-2" />
                <span>Information</span>
            </a>
        </DropdownMenuItem>
    </DropdownMenuContent>
</DropdownMenu>

