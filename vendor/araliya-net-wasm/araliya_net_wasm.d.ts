/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

type ReadableStreamType = "bytes";

export class AraliyaWasmApp {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  listUsers(limit: number, cursor?: string | null): Promise<any>;
  /**
   * Return current Iroh connection-pool metrics (`{ hits, misses, activeConnections }`).
   */
  poolStats(): Promise<any>;
  pollEvents(since_seq: number, topics: any, limit: number): Promise<any>;
  createGroup(namespace_id: string): Promise<any>;
  listVouches(subject_pubkey: string): Promise<any>;
  submitVouch(subject_pubkey: string, role: string, expires_at_ms?: number | null): Promise<any>;
  getGroupDoc(group_pubkey: string, namespace_id: string, doc_namespace: string, key: Uint8Array): Promise<any>;
  putGroupDoc(group_pubkey: string, namespace_id: string, doc_namespace: string, key: Uint8Array, value: Uint8Array): Promise<any>;
  registerUser(username: string, display_name: string): Promise<any>;
  /**
   * Incrementally sync `user_keychain` and return entry counts (`KeychainSummaryJs`).
   */
  syncKeychain(): Promise<any>;
  syncRootLog(root_pubkey: string, since_seq: number, expected_prev_hash_hex: string, limit: number): Promise<any>;
  eventHeadSeq(topics: any): Promise<any>;
  getGroupBlob(group_pubkey: string, namespace_id: string, cid_hex: string): Promise<any>;
  getPublicDoc(namespace: string, key: Uint8Array): Promise<any>;
  listMyGroups(): Promise<any>;
  putGroupBlob(group_pubkey: string, namespace_id: string, bytes: Uint8Array): Promise<any>;
  putGroupCrdt(group_pubkey: string, namespace_id: string, crdt_namespace: string, key: string, value_bytes: Uint8Array): Promise<any>;
  putPublicDoc(namespace: string, key: Uint8Array, value: Uint8Array): Promise<any>;
  updateProfile(username: string, display_name: string): Promise<any>;
  getPrivateDoc(namespace: string, key: Uint8Array): Promise<any>;
  getPublicBlob(cid_hex: string): Promise<any>;
  putPrivateDoc(namespace: string, key: Uint8Array, value: Uint8Array): Promise<any>;
  putPublicBlob(bytes: Uint8Array): Promise<any>;
  qnaGetResults(cid_hex: string): Promise<any>;
  syncGroupCrdt(group_pubkey: string, namespace_id: string, crdt_namespace: string, since_seq: number): Promise<any>;
  getPrivateBlob(cid_hex: string): Promise<any>;
  issueVouchCard(subject_pubkey: string, role: string, root_pubkey?: string | null, relay_endpoint_id?: string | null, relay_peer_address?: string | null, expires_at_ms?: number | null): Promise<any>;
  issueVouchCert(subject_pubkey: string, role: string, expires_at_ms?: number | null): Promise<any>;
  putPrivateBlob(bytes: Uint8Array): Promise<any>;
  qnaGetQuestion(cid_hex: string): Promise<any>;
  qnaPutResponse(cid_hex: string, selected_leaf_hexes: any): Promise<any>;
  sealLocalDraft(plaintext_json: string): Promise<any>;
  listHiddenItems(): Promise<any>;
  qnaListComments(cid_hex: string, limit?: number | null, cursor?: string | null): Promise<any>;
  setProfileField(field_key: string, value_json: string, is_public: boolean): Promise<any>;
  submitVouchCard(subject_pubkey: string, role: string, root_pubkey?: string | null, relay_endpoint_id?: string | null, relay_peer_address?: string | null, expires_at_ms?: number | null): Promise<any>;
  /**
   * Unlock an [`EncryptedKeyVault`] JSON string with `password` and install into memory.
   */
  unlockWithVault(vault_json: string, password: string): Promise<any>;
  getUserByPubkey(pubkey: string): Promise<any>;
  grantGroupMember(group_pubkey: string, namespace_id: string, member_pubkey: string, member_x25519_pubkey: string, role: string): Promise<any>;
  qnaCreateComment(cid_hex: string, body: string): Promise<any>;
  qnaDeleteComment(comment_id: string): Promise<any>;
  qnaListQuestions(filter: any): Promise<any>;
  startEventPoller(topics: any, interval_ms: number | null | undefined, on_batch: Function, on_error?: Function | null): Promise<any>;
  syncPrivateTable(table_name: string): Promise<any>;
  unsealLocalDraft(sealed_b64: string): Promise<any>;
  checkInitialVouch(): Promise<any>;
  getPublicManifest(user_pubkey: string): Promise<any>;
  qnaCreateQuestion(input: any): Promise<any>;
  qnaGetMyResponse(cid_hex: string): Promise<any>;
  qnaRedactQuestion(cid_hex: string): Promise<any>;
  revokeGroupMember(group_pubkey: string, namespace_id: string, revoked_pubkey: string, remaining_members_json: string): Promise<any>;
  setUserPreference(pref_key: string, value_json: string): Promise<any>;
  getEndpointBinding(user_pubkey: string): Promise<any>;
  getOnboardingState(): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserPreferences(): Promise<any>;
  putEndpointBinding(endpoints_json: string, seq: number): Promise<any>;
  submitVouchRequest(voucher_pubkey: string, requested_handle: string | null | undefined, expires_at_ms: number): Promise<any>;
  dismissVouchRequest(subject_pubkey: string): Promise<any>;
  getPrivateTableRows(table_name: string): Promise<any>;
  listMyVouchRequests(): Promise<any>;
  qnaDeleteMyResponse(cid_hex: string): Promise<any>;
  /**
   * Unlock a user identity from a base64 Ed25519 secret key over the existing transport.
   */
  unlockWithSecretKey(secret_key_b64: string): Promise<any>;
  /**
   * Export recovery key & base64 secret key from the unlocked in-memory `UserSession`.
   */
  exportRecoveryPayload(): Promise<any>;
  publishPublicManifest(profile_json: string, namespaces_json: string): Promise<any>;
  completeOnboardingStep(step_cursor: string, completed_item_cid_hex: string | null | undefined, completed: boolean): Promise<any>;
  registerWithVouchCard(username: string, display_name: string, vouch_token_or_json: string): Promise<any>;
  getPublicProfileFields(user_pubkey: string): Promise<any>;
  qnaSetAnswerVisibility(cid_hex: string, selected_leaf_hexes: any, is_public: boolean): Promise<any>;
  getPrivateProfileFields(): Promise<any>;
  qnaGetMyPrivateResponse(cid_hex: string): Promise<any>;
  listIncomingVouchRequests(): Promise<any>;
  /**
   * Unlock a user identity from raw 32-byte Ed25519 secret bytes (for session quick-unlock).
   */
  unlockWithSecretKeyBytes(secret_key_bytes: Uint8Array): Promise<any>;
  qnaListMyPrivateResponses(): Promise<any>;
  registerWithSubmittedVouch(username: string, display_name: string): Promise<any>;
  /**
   * Drop active `UserSession`, wipe decrypted caches & group sessions, and stay connected anonymously.
   */
  lock(): Promise<any>;
  /**
   * Alias for [`lock`](Self::lock).
   */
  logout(): Promise<any>;
  /**
   * Connect once to the relay Iroh endpoint (anonymous read-only until `unlock*` is called).
   */
  static connect(config: any): Promise<any>;
  /**
   * Return `{ userPubkey, x25519Pubkey, transportPeerId } | null`.
   */
  identity(): any;
  hideItem(item_cid_hex: string, reason?: string | null): Promise<any>;
}

export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  start(controller: ReadableByteStreamController): void;
  cancel(): void;
  readonly autoAllocateChunkSize: number;
  readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  abort(reason: any): Promise<any>;
  close(): Promise<any>;
  write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}

export class WasmEventPoller {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  isRunning(): boolean;
  updateTopics(topics: any): void;
  stop(): void;
  cursor(): number;
}

/**
 * Compute the canonical `qa-cid/v1` hex leaf hash for an answer string.
 */
export function answerLeafHex(answer_text: string): string;

/**
 * Wrap a base64 Ed25519 secret key in a versioned password-encrypted [`EncryptedKeyVault`].
 */
export function createKeyVault(secret_key_b64: string, password: string): any;

/**
 * Decode an `araliya-vouch-card:v1:...` token, `VouchCard` JSON, or `VouchCert` JSON and inspect validity.
 */
export function decodeVouchCard(vouch_token_or_json: string): any;

/**
 * Decrypt a password-encrypted secret key blob back into base64 secret key.
 */
export function decryptSecretKey(encrypted_blob: string, password: string): string;

/**
 * Derive the canonical base64url public key from a base64 secret key.
 */
export function derivePublicKey(secret_key_b64: string): string;

/**
 * Encrypt a base64 Ed25519 secret key with `password` (`PBKDF2-HMAC-SHA256` + `AES-256-GCM`).
 */
export function encryptSecretKey(secret_key_b64: string, password: string): string;

/**
 * Export a checksummed `araliya-recovery:v1:...` token from a base64 secret key.
 */
export function exportRecoveryKey(secret_key_b64: string): string;

/**
 * Generate a fresh Ed25519 identity keypair `{ secretKey, publicKey, x25519Pubkey }`.
 */
export function generateKeypair(): any;

/**
 * Generate a random 32-byte Ed25519 secret key as standard base64 (helper).
 */
export function generateSecretKey(): string;

/**
 * Import a checksummed `araliya-recovery:v1:...` token and return `{ secretKey, publicKey, x25519Pubkey }`.
 */
export function importRecoveryKey(recovery_key: string): any;

export function init_panic_hook(): void;

/**
 * Unlock an [`EncryptedKeyVault`] JSON string and return `{ secretKey, publicKey, x25519Pubkey }`.
 */
export function unlockKeyVault(vault_json: string, password: string): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_araliyawasmapp_free: (a: number, b: number) => void;
  readonly __wbg_wasmeventpoller_free: (a: number, b: number) => void;
  readonly answerLeafHex: (a: number, b: number, c: number) => void;
  readonly araliyawasmapp_checkInitialVouch: (a: number) => number;
  readonly araliyawasmapp_completeOnboardingStep: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly araliyawasmapp_connect: (a: number) => number;
  readonly araliyawasmapp_createGroup: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_dismissVouchRequest: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_eventHeadSeq: (a: number, b: number) => number;
  readonly araliyawasmapp_exportRecoveryPayload: (a: number) => number;
  readonly araliyawasmapp_getEndpointBinding: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getGroupBlob: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_getGroupDoc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly araliyawasmapp_getOnboardingState: (a: number) => number;
  readonly araliyawasmapp_getPrivateBlob: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getPrivateDoc: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_getPrivateProfileFields: (a: number) => number;
  readonly araliyawasmapp_getPrivateTableRows: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getPublicBlob: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getPublicDoc: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_getPublicManifest: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getPublicProfileFields: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getUserByPubkey: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getUserByUsername: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_getUserPreferences: (a: number) => number;
  readonly araliyawasmapp_grantGroupMember: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly araliyawasmapp_hideItem: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_identity: (a: number, b: number) => void;
  readonly araliyawasmapp_issueVouchCard: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly araliyawasmapp_issueVouchCert: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_listHiddenItems: (a: number) => number;
  readonly araliyawasmapp_listIncomingVouchRequests: (a: number) => number;
  readonly araliyawasmapp_listMyGroups: (a: number) => number;
  readonly araliyawasmapp_listMyVouchRequests: (a: number) => number;
  readonly araliyawasmapp_listUsers: (a: number, b: number, c: number, d: number) => number;
  readonly araliyawasmapp_listVouches: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_lock: (a: number) => number;
  readonly araliyawasmapp_pollEvents: (a: number, b: number, c: number, d: number) => number;
  readonly araliyawasmapp_poolStats: (a: number) => number;
  readonly araliyawasmapp_publishPublicManifest: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_putEndpointBinding: (a: number, b: number, c: number, d: number) => number;
  readonly araliyawasmapp_putGroupBlob: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_putGroupCrdt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly araliyawasmapp_putGroupDoc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly araliyawasmapp_putPrivateBlob: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_putPrivateDoc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_putPublicBlob: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_putPublicDoc: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_qnaCreateComment: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_qnaCreateQuestion: (a: number, b: number) => number;
  readonly araliyawasmapp_qnaDeleteComment: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaDeleteMyResponse: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaGetMyPrivateResponse: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaGetMyResponse: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaGetQuestion: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaGetResults: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaListComments: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly araliyawasmapp_qnaListMyPrivateResponses: (a: number) => number;
  readonly araliyawasmapp_qnaListQuestions: (a: number, b: number) => number;
  readonly araliyawasmapp_qnaPutResponse: (a: number, b: number, c: number, d: number) => number;
  readonly araliyawasmapp_qnaRedactQuestion: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_qnaSetAnswerVisibility: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_registerUser: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_registerWithSubmittedVouch: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_registerWithVouchCard: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_revokeGroupMember: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly araliyawasmapp_sealLocalDraft: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_setProfileField: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly araliyawasmapp_setUserPreference: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_startEventPoller: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_submitVouch: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_submitVouchCard: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly araliyawasmapp_submitVouchRequest: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly araliyawasmapp_syncGroupCrdt: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly araliyawasmapp_syncKeychain: (a: number) => number;
  readonly araliyawasmapp_syncPrivateTable: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_syncRootLog: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly araliyawasmapp_unlockWithSecretKey: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_unlockWithSecretKeyBytes: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_unlockWithVault: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly araliyawasmapp_unsealLocalDraft: (a: number, b: number, c: number) => number;
  readonly araliyawasmapp_updateProfile: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly createKeyVault: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly decodeVouchCard: (a: number, b: number, c: number) => void;
  readonly decryptSecretKey: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly derivePublicKey: (a: number, b: number, c: number) => void;
  readonly encryptSecretKey: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly exportRecoveryKey: (a: number, b: number, c: number) => void;
  readonly generateKeypair: (a: number) => void;
  readonly generateSecretKey: (a: number) => void;
  readonly importRecoveryKey: (a: number, b: number, c: number) => void;
  readonly init_panic_hook: () => void;
  readonly unlockKeyVault: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly wasmeventpoller_cursor: (a: number) => number;
  readonly wasmeventpoller_isRunning: (a: number) => number;
  readonly wasmeventpoller_stop: (a: number) => void;
  readonly wasmeventpoller_updateTopics: (a: number, b: number, c: number) => void;
  readonly araliyawasmapp_logout: (a: number) => number;
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: number) => number;
  readonly intounderlyingbytesource_start: (a: number, b: number) => void;
  readonly intounderlyingbytesource_type: (a: number) => number;
  readonly intounderlyingsink_abort: (a: number, b: number) => number;
  readonly intounderlyingsink_close: (a: number) => number;
  readonly intounderlyingsink_write: (a: number, b: number) => number;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: number) => number;
  readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly __wasm_bindgen_func_elem_16174: (a: number, b: number, c: number) => void;
  readonly __wasm_bindgen_func_elem_16158: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_16115: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_16097: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_8806: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_8775: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_4437: (a: number, b: number, c: number) => void;
  readonly __wasm_bindgen_func_elem_3895: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_7641: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_7631: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_9534: (a: number, b: number, c: number) => void;
  readonly __wasm_bindgen_func_elem_9489: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_8756: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_8739: (a: number, b: number) => void;
  readonly __wasm_bindgen_func_elem_19226: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export3: (a: number) => void;
  readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
