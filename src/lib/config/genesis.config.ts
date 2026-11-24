import { browser } from '$app/environment';
import { env as dynamicPublicEnv } from '$env/dynamic/public';
import * as staticPublicEnv from '$env/static/public';
import type { ManualRelayOverride } from '$lib/types';

const staticEnv = staticPublicEnv as Record<string, string | undefined>;
const MANUAL_RELAY_STORAGE_KEY = 'userx_relay_override_v1';

function readPublicEnv(key: `PUBLIC_${string}`): string {
	return (dynamicPublicEnv[key] ?? staticEnv[key] ?? '').trim();
}

/**
 * Parse one or more peer addresses (bare `EndpointId`s, comma/newline-separated IDs,
 * a single `EndpointAddr` JSON object, or a JSON array of peers) without breaking on
 * commas inside JSON `EndpointAddr` strings.
 */
export function parsePeerList(raw: string): string[] {
	const trimmed = raw.trim();
	if (!trimmed) return [];

	if (trimmed.startsWith('[')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed
					.map((item) => (typeof item === 'string' ? item.trim() : JSON.stringify(item)))
					.filter((item) => item.length > 0);
			}
		} catch {
			// Fall through to object/list parsing if malformed array syntax
		}
	}

	if (trimmed.startsWith('{')) {
		return [trimmed];
	}

	return trimmed
		.split(/[,\n;]+/)
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

export function parseUrlList(raw: string): string[] {
	return raw
		.split(/[,\n;]+/)
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

export function extractEndpointId(peer: string): string {
	const trimmed = peer.trim();
	if (trimmed.startsWith('{')) {
		try {
			const parsed = JSON.parse(trimmed) as { id?: unknown };
			if (typeof parsed.id === 'string' && parsed.id.trim().length > 0) {
				return parsed.id.trim();
			}
		} catch {
			// Fall back to trimmed input
		}
	}
	return trimmed;
}

/**
 * HTTP relay base URL (`PUBLIC_RELAY_HTTP_URL` when set, `/relay` in Vite dev, or `''` in production).
 */
export function getDefaultRelayHttpUrl(): string {
	const explicit = readPublicEnv('PUBLIC_RELAY_HTTP_URL').replace(/\/+$/, '');
	if (explicit) return explicit;
	if (import.meta.env.DEV) return '/relay';
	return '';
}

export function getConfiguredEndpointIds(): string[] {
	const raw = readPublicEnv('PUBLIC_RELAY_ENDPOINT_ID') || readPublicEnv('PUBLIC_RELAY_ENDPOINT_IDS');
	return parsePeerList(raw);
}

export function getConfiguredRelayUrls(): string[] {
	return parseUrlList(readPublicEnv('PUBLIC_RELAY_URLS'));
}

export function getConfiguredRootPubkey(): string {
	return readPublicEnv('PUBLIC_ROOT_PUBKEY');
}

export function loadManualRelayOverride(): ManualRelayOverride | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(MANUAL_RELAY_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<ManualRelayOverride>;
		const endpointId = typeof parsed.endpointId === 'string' ? parsed.endpointId.trim() : '';
		if (!endpointId) return null;
		const relayUrls = Array.isArray(parsed.relayUrls)
			? parsed.relayUrls.map((u) => String(u).trim()).filter(Boolean)
			: [];
		const rootPubkey = typeof parsed.rootPubkey === 'string' ? parsed.rootPubkey.trim() : '';
		return { endpointId, relayUrls, rootPubkey };
	} catch {
		return null;
	}
}

export function saveManualRelayOverride(override: ManualRelayOverride): void {
	if (!browser) return;
	const endpointId = override.endpointId.trim();
	if (!endpointId) {
		localStorage.removeItem(MANUAL_RELAY_STORAGE_KEY);
		return;
	}
	localStorage.setItem(
		MANUAL_RELAY_STORAGE_KEY,
		JSON.stringify({
			endpointId,
			relayUrls: override.relayUrls.map((u) => u.trim()).filter(Boolean),
			rootPubkey: override.rootPubkey.trim()
		})
	);
}

export function clearManualRelayOverride(): void {
	if (!browser) return;
	localStorage.removeItem(MANUAL_RELAY_STORAGE_KEY);
}

export const RELAY_BASE_URL = getDefaultRelayHttpUrl();
