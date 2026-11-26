let wasm;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export3(addHeapObject(e));
    }
}

let heap = new Array(128).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        try {
            return f(state.a, state.b, ...args);
        } finally {
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

function __wasm_bindgen_func_elem_16174(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_16174(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_16115(arg0, arg1) {
    wasm.__wasm_bindgen_func_elem_16115(arg0, arg1);
}

function __wasm_bindgen_func_elem_8806(arg0, arg1) {
    wasm.__wasm_bindgen_func_elem_8806(arg0, arg1);
}

function __wasm_bindgen_func_elem_4437(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_4437(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_7641(arg0, arg1) {
    wasm.__wasm_bindgen_func_elem_7641(arg0, arg1);
}

function __wasm_bindgen_func_elem_9534(arg0, arg1, arg2) {
    wasm.__wasm_bindgen_func_elem_9534(arg0, arg1, addHeapObject(arg2));
}

function __wasm_bindgen_func_elem_8756(arg0, arg1) {
    wasm.__wasm_bindgen_func_elem_8756(arg0, arg1);
}

function __wasm_bindgen_func_elem_19226(arg0, arg1, arg2, arg3) {
    wasm.__wasm_bindgen_func_elem_19226(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const __wbindgen_enum_BinaryType = ["blob", "arraybuffer"];

const __wbindgen_enum_ReadableStreamType = ["bytes"];

const __wbindgen_enum_RequestCache = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const AraliyaWasmAppFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_araliyawasmapp_free(ptr >>> 0, 1));

const IntoUnderlyingByteSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingbytesource_free(ptr >>> 0, 1));

const IntoUnderlyingSinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsink_free(ptr >>> 0, 1));

const IntoUnderlyingSourceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_intounderlyingsource_free(ptr >>> 0, 1));

const WasmEventPollerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmeventpoller_free(ptr >>> 0, 1));

/**
 * Browser WASM application handle separating long-lived Iroh transport from `unlock`/`lock` auth.
 */
export class AraliyaWasmApp {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AraliyaWasmApp.prototype);
        obj.__wbg_ptr = ptr;
        AraliyaWasmAppFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AraliyaWasmAppFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_araliyawasmapp_free(ptr, 0);
    }
    /**
     * @param {number} limit
     * @param {string | null} [cursor]
     * @returns {Promise<any>}
     */
    listUsers(limit, cursor) {
        var ptr0 = isLikeNone(cursor) ? 0 : passStringToWasm0(cursor, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_listUsers(this.__wbg_ptr, limit, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Return current Iroh connection-pool metrics (`{ hits, misses, activeConnections }`).
     * @returns {Promise<any>}
     */
    poolStats() {
        const ret = wasm.araliyawasmapp_poolStats(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {number} since_seq
     * @param {any} topics
     * @param {number} limit
     * @returns {Promise<any>}
     */
    pollEvents(since_seq, topics, limit) {
        const ret = wasm.araliyawasmapp_pollEvents(this.__wbg_ptr, since_seq, addHeapObject(topics), limit);
        return takeObject(ret);
    }
    /**
     * @param {string} namespace_id
     * @returns {Promise<any>}
     */
    createGroup(namespace_id) {
        const ptr0 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_createGroup(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @returns {Promise<any>}
     */
    listVouches(subject_pubkey) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_listVouches(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @param {string} role
     * @param {number | null} [expires_at_ms]
     * @returns {Promise<any>}
     */
    submitVouch(subject_pubkey, role, expires_at_ms) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_submitVouch(this.__wbg_ptr, ptr0, len0, ptr1, len1, !isLikeNone(expires_at_ms), isLikeNone(expires_at_ms) ? 0 : expires_at_ms);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} doc_namespace
     * @param {Uint8Array} key
     * @returns {Promise<any>}
     */
    getGroupDoc(group_pubkey, namespace_id, doc_namespace, key) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(doc_namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getGroupDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} doc_namespace
     * @param {Uint8Array} key
     * @param {Uint8Array} value
     * @returns {Promise<any>}
     */
    putGroupDoc(group_pubkey, namespace_id, doc_namespace, key, value) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(doc_namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(value, wasm.__wbindgen_export);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putGroupDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        return takeObject(ret);
    }
    /**
     * @param {string} username
     * @param {string} display_name
     * @returns {Promise<any>}
     */
    registerUser(username, display_name) {
        const ptr0 = passStringToWasm0(username, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(display_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_registerUser(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * Incrementally sync `user_keychain` and return entry counts (`KeychainSummaryJs`).
     * @returns {Promise<any>}
     */
    syncKeychain() {
        const ret = wasm.araliyawasmapp_syncKeychain(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} root_pubkey
     * @param {number} since_seq
     * @param {string} expected_prev_hash_hex
     * @param {number} limit
     * @returns {Promise<any>}
     */
    syncRootLog(root_pubkey, since_seq, expected_prev_hash_hex, limit) {
        const ptr0 = passStringToWasm0(root_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(expected_prev_hash_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_syncRootLog(this.__wbg_ptr, ptr0, len0, since_seq, ptr1, len1, limit);
        return takeObject(ret);
    }
    /**
     * @param {any} topics
     * @returns {Promise<any>}
     */
    eventHeadSeq(topics) {
        const ret = wasm.araliyawasmapp_eventHeadSeq(this.__wbg_ptr, addHeapObject(topics));
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    getGroupBlob(group_pubkey, namespace_id, cid_hex) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getGroupBlob(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return takeObject(ret);
    }
    /**
     * @param {string} namespace
     * @param {Uint8Array} key
     * @returns {Promise<any>}
     */
    getPublicDoc(namespace, key) {
        const ptr0 = passStringToWasm0(namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPublicDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    listMyGroups() {
        const ret = wasm.araliyawasmapp_listMyGroups(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {Uint8Array} bytes
     * @returns {Promise<any>}
     */
    putGroupBlob(group_pubkey, namespace_id, bytes) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putGroupBlob(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} crdt_namespace
     * @param {string} key
     * @param {Uint8Array} value_bytes
     * @returns {Promise<any>}
     */
    putGroupCrdt(group_pubkey, namespace_id, crdt_namespace, key, value_bytes) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(crdt_namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArray8ToWasm0(value_bytes, wasm.__wbindgen_export);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putGroupCrdt(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        return takeObject(ret);
    }
    /**
     * @param {string} namespace
     * @param {Uint8Array} key
     * @param {Uint8Array} value
     * @returns {Promise<any>}
     */
    putPublicDoc(namespace, key, value) {
        const ptr0 = passStringToWasm0(namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(value, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putPublicDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return takeObject(ret);
    }
    /**
     * @param {string} username
     * @param {string} display_name
     * @returns {Promise<any>}
     */
    updateProfile(username, display_name) {
        const ptr0 = passStringToWasm0(username, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(display_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_updateProfile(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} namespace
     * @param {Uint8Array} key
     * @returns {Promise<any>}
     */
    getPrivateDoc(namespace, key) {
        const ptr0 = passStringToWasm0(namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPrivateDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    getPublicBlob(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPublicBlob(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} namespace
     * @param {Uint8Array} key
     * @param {Uint8Array} value
     * @returns {Promise<any>}
     */
    putPrivateDoc(namespace, key, value) {
        const ptr0 = passStringToWasm0(namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(key, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(value, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putPrivateDoc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return takeObject(ret);
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {Promise<any>}
     */
    putPublicBlob(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putPublicBlob(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaGetResults(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaGetResults(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} crdt_namespace
     * @param {number} since_seq
     * @returns {Promise<any>}
     */
    syncGroupCrdt(group_pubkey, namespace_id, crdt_namespace, since_seq) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(crdt_namespace, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_syncGroupCrdt(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, since_seq);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    getPrivateBlob(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPrivateBlob(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @param {string} role
     * @param {string | null} [root_pubkey]
     * @param {string | null} [relay_endpoint_id]
     * @param {string | null} [relay_peer_address]
     * @param {number | null} [expires_at_ms]
     * @returns {Promise<any>}
     */
    issueVouchCard(subject_pubkey, role, root_pubkey, relay_endpoint_id, relay_peer_address, expires_at_ms) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(root_pubkey) ? 0 : passStringToWasm0(root_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(relay_endpoint_id) ? 0 : passStringToWasm0(relay_endpoint_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len3 = WASM_VECTOR_LEN;
        var ptr4 = isLikeNone(relay_peer_address) ? 0 : passStringToWasm0(relay_peer_address, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len4 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_issueVouchCard(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, !isLikeNone(expires_at_ms), isLikeNone(expires_at_ms) ? 0 : expires_at_ms);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @param {string} role
     * @param {number | null} [expires_at_ms]
     * @returns {Promise<any>}
     */
    issueVouchCert(subject_pubkey, role, expires_at_ms) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_issueVouchCert(this.__wbg_ptr, ptr0, len0, ptr1, len1, !isLikeNone(expires_at_ms), isLikeNone(expires_at_ms) ? 0 : expires_at_ms);
        return takeObject(ret);
    }
    /**
     * @param {Uint8Array} bytes
     * @returns {Promise<any>}
     */
    putPrivateBlob(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putPrivateBlob(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaGetQuestion(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaGetQuestion(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @param {any} selected_leaf_hexes
     * @returns {Promise<any>}
     */
    qnaPutResponse(cid_hex, selected_leaf_hexes) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaPutResponse(this.__wbg_ptr, ptr0, len0, addHeapObject(selected_leaf_hexes));
        return takeObject(ret);
    }
    /**
     * @param {string} plaintext_json
     * @returns {Promise<any>}
     */
    sealLocalDraft(plaintext_json) {
        const ptr0 = passStringToWasm0(plaintext_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_sealLocalDraft(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    listHiddenItems() {
        const ret = wasm.araliyawasmapp_listHiddenItems(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @param {number | null} [limit]
     * @param {string | null} [cursor]
     * @returns {Promise<any>}
     */
    qnaListComments(cid_hex, limit, cursor) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(cursor) ? 0 : passStringToWasm0(cursor, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaListComments(this.__wbg_ptr, ptr0, len0, isLikeNone(limit) ? 0x100000001 : (limit) >>> 0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} field_key
     * @param {string} value_json
     * @param {boolean} is_public
     * @returns {Promise<any>}
     */
    setProfileField(field_key, value_json, is_public) {
        const ptr0 = passStringToWasm0(field_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(value_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_setProfileField(this.__wbg_ptr, ptr0, len0, ptr1, len1, is_public);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @param {string} role
     * @param {string | null} [root_pubkey]
     * @param {string | null} [relay_endpoint_id]
     * @param {string | null} [relay_peer_address]
     * @param {number | null} [expires_at_ms]
     * @returns {Promise<any>}
     */
    submitVouchCard(subject_pubkey, role, root_pubkey, relay_endpoint_id, relay_peer_address, expires_at_ms) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(role, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(root_pubkey) ? 0 : passStringToWasm0(root_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(relay_endpoint_id) ? 0 : passStringToWasm0(relay_endpoint_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len3 = WASM_VECTOR_LEN;
        var ptr4 = isLikeNone(relay_peer_address) ? 0 : passStringToWasm0(relay_peer_address, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len4 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_submitVouchCard(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, !isLikeNone(expires_at_ms), isLikeNone(expires_at_ms) ? 0 : expires_at_ms);
        return takeObject(ret);
    }
    /**
     * Unlock an [`EncryptedKeyVault`] JSON string with `password` and install into memory.
     * @param {string} vault_json
     * @param {string} password
     * @returns {Promise<any>}
     */
    unlockWithVault(vault_json, password) {
        const ptr0 = passStringToWasm0(vault_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(password, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_unlockWithVault(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} pubkey
     * @returns {Promise<any>}
     */
    getUserByPubkey(pubkey) {
        const ptr0 = passStringToWasm0(pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getUserByPubkey(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} member_pubkey
     * @param {string} member_x25519_pubkey
     * @param {string} role
     * @returns {Promise<any>}
     */
    grantGroupMember(group_pubkey, namespace_id, member_pubkey, member_x25519_pubkey, role) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(member_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(member_x25519_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passStringToWasm0(role, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len4 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_grantGroupMember(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @param {string} body
     * @returns {Promise<any>}
     */
    qnaCreateComment(cid_hex, body) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(body, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaCreateComment(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} comment_id
     * @returns {Promise<any>}
     */
    qnaDeleteComment(comment_id) {
        const ptr0 = passStringToWasm0(comment_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaDeleteComment(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {any} filter
     * @returns {Promise<any>}
     */
    qnaListQuestions(filter) {
        const ret = wasm.araliyawasmapp_qnaListQuestions(this.__wbg_ptr, addHeapObject(filter));
        return takeObject(ret);
    }
    /**
     * @param {any} topics
     * @param {number | null | undefined} interval_ms
     * @param {Function} on_batch
     * @param {Function | null} [on_error]
     * @returns {Promise<any>}
     */
    startEventPoller(topics, interval_ms, on_batch, on_error) {
        const ret = wasm.araliyawasmapp_startEventPoller(this.__wbg_ptr, addHeapObject(topics), isLikeNone(interval_ms) ? 0x100000001 : (interval_ms) >>> 0, addHeapObject(on_batch), isLikeNone(on_error) ? 0 : addHeapObject(on_error));
        return takeObject(ret);
    }
    /**
     * @param {string} table_name
     * @returns {Promise<any>}
     */
    syncPrivateTable(table_name) {
        const ptr0 = passStringToWasm0(table_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_syncPrivateTable(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} sealed_b64
     * @returns {Promise<any>}
     */
    unsealLocalDraft(sealed_b64) {
        const ptr0 = passStringToWasm0(sealed_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_unsealLocalDraft(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    checkInitialVouch() {
        const ret = wasm.araliyawasmapp_checkInitialVouch(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} user_pubkey
     * @returns {Promise<any>}
     */
    getPublicManifest(user_pubkey) {
        const ptr0 = passStringToWasm0(user_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPublicManifest(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {any} input
     * @returns {Promise<any>}
     */
    qnaCreateQuestion(input) {
        const ret = wasm.araliyawasmapp_qnaCreateQuestion(this.__wbg_ptr, addHeapObject(input));
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaGetMyResponse(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaGetMyResponse(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaRedactQuestion(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaRedactQuestion(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} group_pubkey
     * @param {string} namespace_id
     * @param {string} revoked_pubkey
     * @param {string} remaining_members_json
     * @returns {Promise<any>}
     */
    revokeGroupMember(group_pubkey, namespace_id, revoked_pubkey, remaining_members_json) {
        const ptr0 = passStringToWasm0(group_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespace_id, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(revoked_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(remaining_members_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_revokeGroupMember(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return takeObject(ret);
    }
    /**
     * @param {string} pref_key
     * @param {string} value_json
     * @returns {Promise<any>}
     */
    setUserPreference(pref_key, value_json) {
        const ptr0 = passStringToWasm0(pref_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(value_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_setUserPreference(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} user_pubkey
     * @returns {Promise<any>}
     */
    getEndpointBinding(user_pubkey) {
        const ptr0 = passStringToWasm0(user_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getEndpointBinding(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    getOnboardingState() {
        const ret = wasm.araliyawasmapp_getOnboardingState(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} username
     * @returns {Promise<any>}
     */
    getUserByUsername(username) {
        const ptr0 = passStringToWasm0(username, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getUserByUsername(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    getUserPreferences() {
        const ret = wasm.araliyawasmapp_getUserPreferences(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} endpoints_json
     * @param {number} seq
     * @returns {Promise<any>}
     */
    putEndpointBinding(endpoints_json, seq) {
        const ptr0 = passStringToWasm0(endpoints_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_putEndpointBinding(this.__wbg_ptr, ptr0, len0, seq);
        return takeObject(ret);
    }
    /**
     * @param {string} voucher_pubkey
     * @param {string | null | undefined} requested_handle
     * @param {number} expires_at_ms
     * @returns {Promise<any>}
     */
    submitVouchRequest(voucher_pubkey, requested_handle, expires_at_ms) {
        const ptr0 = passStringToWasm0(voucher_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(requested_handle) ? 0 : passStringToWasm0(requested_handle, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_submitVouchRequest(this.__wbg_ptr, ptr0, len0, ptr1, len1, expires_at_ms);
        return takeObject(ret);
    }
    /**
     * @param {string} subject_pubkey
     * @returns {Promise<any>}
     */
    dismissVouchRequest(subject_pubkey) {
        const ptr0 = passStringToWasm0(subject_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_dismissVouchRequest(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} table_name
     * @returns {Promise<any>}
     */
    getPrivateTableRows(table_name) {
        const ptr0 = passStringToWasm0(table_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPrivateTableRows(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    listMyVouchRequests() {
        const ret = wasm.araliyawasmapp_listMyVouchRequests(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaDeleteMyResponse(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaDeleteMyResponse(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Unlock a user identity from a base64 Ed25519 secret key over the existing transport.
     * @param {string} secret_key_b64
     * @returns {Promise<any>}
     */
    unlockWithSecretKey(secret_key_b64) {
        const ptr0 = passStringToWasm0(secret_key_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_unlockWithSecretKey(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * Export recovery key & base64 secret key from the unlocked in-memory `UserSession`.
     * @returns {Promise<any>}
     */
    exportRecoveryPayload() {
        const ret = wasm.araliyawasmapp_exportRecoveryPayload(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} profile_json
     * @param {string} namespaces_json
     * @returns {Promise<any>}
     */
    publishPublicManifest(profile_json, namespaces_json) {
        const ptr0 = passStringToWasm0(profile_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(namespaces_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_publishPublicManifest(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * @param {string} step_cursor
     * @param {string | null | undefined} completed_item_cid_hex
     * @param {boolean} completed
     * @returns {Promise<any>}
     */
    completeOnboardingStep(step_cursor, completed_item_cid_hex, completed) {
        const ptr0 = passStringToWasm0(step_cursor, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(completed_item_cid_hex) ? 0 : passStringToWasm0(completed_item_cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_completeOnboardingStep(this.__wbg_ptr, ptr0, len0, ptr1, len1, completed);
        return takeObject(ret);
    }
    /**
     * @param {string} username
     * @param {string} display_name
     * @param {string} vouch_token_or_json
     * @returns {Promise<any>}
     */
    registerWithVouchCard(username, display_name, vouch_token_or_json) {
        const ptr0 = passStringToWasm0(username, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(display_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(vouch_token_or_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_registerWithVouchCard(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return takeObject(ret);
    }
    /**
     * @param {string} user_pubkey
     * @returns {Promise<any>}
     */
    getPublicProfileFields(user_pubkey) {
        const ptr0 = passStringToWasm0(user_pubkey, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_getPublicProfileFields(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @param {any} selected_leaf_hexes
     * @param {boolean} is_public
     * @returns {Promise<any>}
     */
    qnaSetAnswerVisibility(cid_hex, selected_leaf_hexes, is_public) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaSetAnswerVisibility(this.__wbg_ptr, ptr0, len0, addHeapObject(selected_leaf_hexes), is_public);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    getPrivateProfileFields() {
        const ret = wasm.araliyawasmapp_getPrivateProfileFields(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} cid_hex
     * @returns {Promise<any>}
     */
    qnaGetMyPrivateResponse(cid_hex) {
        const ptr0 = passStringToWasm0(cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_qnaGetMyPrivateResponse(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    listIncomingVouchRequests() {
        const ret = wasm.araliyawasmapp_listIncomingVouchRequests(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Unlock a user identity from raw 32-byte Ed25519 secret bytes (for session quick-unlock).
     * @param {Uint8Array} secret_key_bytes
     * @returns {Promise<any>}
     */
    unlockWithSecretKeyBytes(secret_key_bytes) {
        const ptr0 = passArray8ToWasm0(secret_key_bytes, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_unlockWithSecretKeyBytes(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    qnaListMyPrivateResponses() {
        const ret = wasm.araliyawasmapp_qnaListMyPrivateResponses(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * @param {string} username
     * @param {string} display_name
     * @returns {Promise<any>}
     */
    registerWithSubmittedVouch(username, display_name) {
        const ptr0 = passStringToWasm0(username, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(display_name, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_registerWithSubmittedVouch(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
     * Drop active `UserSession`, wipe decrypted caches & group sessions, and stay connected anonymously.
     * @returns {Promise<any>}
     */
    lock() {
        const ret = wasm.araliyawasmapp_lock(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Alias for [`lock`](Self::lock).
     * @returns {Promise<any>}
     */
    logout() {
        const ret = wasm.araliyawasmapp_lock(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Connect once to the relay Iroh endpoint (anonymous read-only until `unlock*` is called).
     * @param {any} config
     * @returns {Promise<any>}
     */
    static connect(config) {
        const ret = wasm.araliyawasmapp_connect(addHeapObject(config));
        return takeObject(ret);
    }
    /**
     * Return `{ userPubkey, x25519Pubkey, transportPeerId } | null`.
     * @returns {any}
     */
    identity() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.araliyawasmapp_identity(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return takeObject(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {string} item_cid_hex
     * @param {string | null} [reason]
     * @returns {Promise<any>}
     */
    hideItem(item_cid_hex, reason) {
        const ptr0 = passStringToWasm0(item_cid_hex, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(reason) ? 0 : passStringToWasm0(reason, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.araliyawasmapp_hideItem(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
}
if (Symbol.dispose) AraliyaWasmApp.prototype[Symbol.dispose] = AraliyaWasmApp.prototype.free;

export class IntoUnderlyingByteSource {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingByteSourceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingbytesource_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get autoAllocateChunkSize() {
        const ret = wasm.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {ReadableByteStreamController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingbytesource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    /**
     * @param {ReadableByteStreamController} controller
     */
    start(controller) {
        wasm.intounderlyingbytesource_start(this.__wbg_ptr, addHeapObject(controller));
    }
    /**
     * @returns {ReadableStreamType}
     */
    get type() {
        const ret = wasm.intounderlyingbytesource_type(this.__wbg_ptr);
        return __wbindgen_enum_ReadableStreamType[ret];
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingbytesource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingByteSource.prototype[Symbol.dispose] = IntoUnderlyingByteSource.prototype.free;

export class IntoUnderlyingSink {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSinkFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsink_free(ptr, 0);
    }
    /**
     * @param {any} reason
     * @returns {Promise<any>}
     */
    abort(reason) {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_abort(ptr, addHeapObject(reason));
        return takeObject(ret);
    }
    /**
     * @returns {Promise<any>}
     */
    close() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.intounderlyingsink_close(ptr);
        return takeObject(ret);
    }
    /**
     * @param {any} chunk
     * @returns {Promise<any>}
     */
    write(chunk) {
        const ret = wasm.intounderlyingsink_write(this.__wbg_ptr, addHeapObject(chunk));
        return takeObject(ret);
    }
}
if (Symbol.dispose) IntoUnderlyingSink.prototype[Symbol.dispose] = IntoUnderlyingSink.prototype.free;

export class IntoUnderlyingSource {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        IntoUnderlyingSourceFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_intounderlyingsource_free(ptr, 0);
    }
    /**
     * @param {ReadableStreamDefaultController} controller
     * @returns {Promise<any>}
     */
    pull(controller) {
        const ret = wasm.intounderlyingsource_pull(this.__wbg_ptr, addHeapObject(controller));
        return takeObject(ret);
    }
    cancel() {
        const ptr = this.__destroy_into_raw();
        wasm.intounderlyingsource_cancel(ptr);
    }
}
if (Symbol.dispose) IntoUnderlyingSource.prototype[Symbol.dispose] = IntoUnderlyingSource.prototype.free;

/**
 * Background event poller handle returned by [`AraliyaWasmApp::start_event_poller`].
 */
export class WasmEventPoller {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmEventPoller.prototype);
        obj.__wbg_ptr = ptr;
        WasmEventPollerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmEventPollerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmeventpoller_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    isRunning() {
        const ret = wasm.wasmeventpoller_isRunning(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {any} topics
     */
    updateTopics(topics) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmeventpoller_updateTopics(retptr, this.__wbg_ptr, addHeapObject(topics));
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    stop() {
        wasm.wasmeventpoller_stop(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    cursor() {
        const ret = wasm.wasmeventpoller_cursor(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) WasmEventPoller.prototype[Symbol.dispose] = WasmEventPoller.prototype.free;

/**
 * Compute the canonical `qa-cid/v1` hex leaf hash for an answer string.
 * @param {string} answer_text
 * @returns {string}
 */
export function answerLeafHex(answer_text) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(answer_text, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.answerLeafHex(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Wrap a base64 Ed25519 secret key in a versioned password-encrypted [`EncryptedKeyVault`].
 * @param {string} secret_key_b64
 * @param {string} password
 * @returns {any}
 */
export function createKeyVault(secret_key_b64, password) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(secret_key_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(password, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.createKeyVault(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Decode an `araliya-vouch-card:v1:...` token, `VouchCard` JSON, or `VouchCert` JSON and inspect validity.
 * @param {string} vouch_token_or_json
 * @returns {any}
 */
export function decodeVouchCard(vouch_token_or_json) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(vouch_token_or_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.decodeVouchCard(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Decrypt a password-encrypted secret key blob back into base64 secret key.
 * @param {string} encrypted_blob
 * @param {string} password
 * @returns {string}
 */
export function decryptSecretKey(encrypted_blob, password) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(encrypted_blob, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(password, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.decryptSecretKey(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr3 = r0;
        var len3 = r1;
        if (r3) {
            ptr3 = 0; len3 = 0;
            throw takeObject(r2);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Derive the canonical base64url public key from a base64 secret key.
 * @param {string} secret_key_b64
 * @returns {string}
 */
export function derivePublicKey(secret_key_b64) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(secret_key_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.derivePublicKey(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Encrypt a base64 Ed25519 secret key with `password` (`PBKDF2-HMAC-SHA256` + `AES-256-GCM`).
 * @param {string} secret_key_b64
 * @param {string} password
 * @returns {string}
 */
export function encryptSecretKey(secret_key_b64, password) {
    let deferred4_0;
    let deferred4_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(secret_key_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(password, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.encryptSecretKey(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr3 = r0;
        var len3 = r1;
        if (r3) {
            ptr3 = 0; len3 = 0;
            throw takeObject(r2);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Export a checksummed `araliya-recovery:v1:...` token from a base64 secret key.
 * @param {string} secret_key_b64
 * @returns {string}
 */
export function exportRecoveryKey(secret_key_b64) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(secret_key_b64, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.exportRecoveryKey(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
        var ptr2 = r0;
        var len2 = r1;
        if (r3) {
            ptr2 = 0; len2 = 0;
            throw takeObject(r2);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Generate a fresh Ed25519 identity keypair `{ secretKey, publicKey, x25519Pubkey }`.
 * @returns {any}
 */
export function generateKeypair() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.generateKeypair(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Generate a random 32-byte Ed25519 secret key as standard base64 (helper).
 * @returns {string}
 */
export function generateSecretKey() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.generateSecretKey(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export4(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Import a checksummed `araliya-recovery:v1:...` token and return `{ secretKey, publicKey, x25519Pubkey }`.
 * @param {string} recovery_key
 * @returns {any}
 */
export function importRecoveryKey(recovery_key) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(recovery_key, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        wasm.importRecoveryKey(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

export function init_panic_hook() {
    wasm.init_panic_hook();
}

/**
 * Unlock an [`EncryptedKeyVault`] JSON string and return `{ secretKey, publicKey, x25519Pubkey }`.
 * @param {string} vault_json
 * @param {string} password
 * @returns {any}
 */
export function unlockKeyVault(vault_json, password) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(vault_json, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(password, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        wasm.unlockKeyVault(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
        if (r2) {
            throw takeObject(r1);
        }
        return takeObject(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_Error_52673b7de5a0ca89 = function(arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_Number_2d1dcfcf4ec51736 = function(arg0) {
        const ret = Number(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
        const ret = String(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_bigint_get_as_i64_6e32f5e6aff02e1d = function(arg0, arg1) {
        const v = getObject(arg1);
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_boolean_get_dea25b33882b895b = function(arg0) {
        const v = getObject(arg0);
        const ret = typeof(v) === 'boolean' ? v : undefined;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg___wbindgen_debug_string_adfb662ae34724b6 = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_in_0d3e1e8f0c669317 = function(arg0, arg1) {
        const ret = getObject(arg0) in getObject(arg1);
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_bigint_0e1a2e3f55cfae27 = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'bigint';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_function_8d400b8b1af978cd = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_null_dfda7d66506c95b5 = function(arg0) {
        const ret = getObject(arg0) === null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_object_ce774f3490692386 = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_string_704ef9c8fc131030 = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_undefined_f6b95eab589e0269 = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_eq_b6101cc9cef1fe36 = function(arg0, arg1) {
        const ret = getObject(arg0) === getObject(arg1);
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_loose_eq_766057600fdd1b0d = function(arg0, arg1) {
        const ret = getObject(arg0) == getObject(arg1);
        return ret;
    };
    imports.wbg.__wbg___wbindgen_number_get_9619185a74197f95 = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_string_get_a2a31e16edf96e42 = function(arg0, arg1) {
        const obj = getObject(arg1);
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg__wbg_cb_unref_87dfb5aaa0cbcea7 = function(arg0) {
        getObject(arg0)._wbg_cb_unref();
    };
    imports.wbg.__wbg_abort_07646c894ebbf2bd = function(arg0) {
        getObject(arg0).abort();
    };
    imports.wbg.__wbg_abort_399ecbcfd6ef3c8e = function(arg0, arg1) {
        getObject(arg0).abort(getObject(arg1));
    };
    imports.wbg.__wbg_addEventListener_e792423147a80626 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    }, arguments) };
    imports.wbg.__wbg_append_c5cbdf46455cc776 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_araliyawasmapp_new = function(arg0) {
        const ret = AraliyaWasmApp.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_arrayBuffer_c04af4fce566092d = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).arrayBuffer();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_body_947b901c33f7fe32 = function(arg0) {
        const ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_6cb2fecb1f253d71 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_byobRequest_f8e3517f5f8ad284 = function(arg0) {
        const ret = getObject(arg0).byobRequest;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_byteLength_faa9938885bdeee6 = function(arg0) {
        const ret = getObject(arg0).byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_3868b6a19ba01dea = function(arg0) {
        const ret = getObject(arg0).byteOffset;
        return ret;
    };
    imports.wbg.__wbg_call_3020136f7a2d6e44 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_abb4ff46ce38be40 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_cancel_a65cf45dca50ba4c = function(arg0) {
        const ret = getObject(arg0).cancel();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_catch_b9db41d97d42bd02 = function(arg0, arg1) {
        const ret = getObject(arg0).catch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_clearTimeout_3b5c565a5ec539dd = function(arg0) {
        const ret = clearTimeout(takeObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_clearTimeout_5a54f8841c30079a = function(arg0) {
        const ret = clearTimeout(takeObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_clearTimeout_5e42188b495715bb = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).clearTimeout(takeObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_close_0af5661bf3d335f2 = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_close_1db3952de1b5b1cf = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_close_3ec111e7b23d94d8 = function() { return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments) };
    imports.wbg.__wbg_code_85a811fe6ca962be = function(arg0) {
        const ret = getObject(arg0).code;
        return ret;
    };
    imports.wbg.__wbg_code_c2a85f2863ec11b3 = function(arg0) {
        const ret = getObject(arg0).code;
        return ret;
    };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_data_8bf4ae669a78a688 = function(arg0) {
        const ret = getObject(arg0).data;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_document_5b745e82ba551ca5 = function(arg0) {
        const ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_done_62ea16af4ce34b24 = function(arg0) {
        const ret = getObject(arg0).done;
        return ret;
    };
    imports.wbg.__wbg_enqueue_a7e6b1ee87963aad = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).enqueue(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_entries_13da0847a5239578 = function(arg0) {
        const ret = getObject(arg0).entries();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_entries_83c79938054e065f = function(arg0) {
        const ret = Object.entries(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_export4(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_fetch_16dcf1cfbbc66b3c = function(arg0) {
        const ret = fetch(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_90447c28cc0b095e = function(arg0, arg1) {
        const ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_from_29a8414a7a7cd19d = function(arg0) {
        const ret = Array.from(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_getRandomValues_38a1ff1ea09f6cc7 = function() { return handleError(function (arg0, arg1) {
        globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_a8ddca022803a145 = function() { return handleError(function (arg0, arg1) {
        globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_getReader_48e00749fe3f6089 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).getReader();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_6b7bd52aca3f9671 = function(arg0, arg1) {
        const ret = getObject(arg0)[arg1 >>> 0];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_af9dab7e9603ea93 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_get_done_f98a6e62c4e18fb9 = function(arg0) {
        const ret = getObject(arg0).done;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_value_63e39884ef11812e = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_get_with_ref_key_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = getObject(arg0)[getObject(arg1)];
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_has_0e670569d65d3a45 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(getObject(arg0), getObject(arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_headers_654c30e1bcccc552 = function(arg0) {
        const ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_hidden_63c9db3ea5c1e10a = function(arg0) {
        const ret = getObject(arg0).hidden;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_f3320d2419cd0355 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Blob_e9c51ce33a4b6181 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Blob;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_084be8da74364158 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Response_cd74d1c2ac92cb0b = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Response;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_da54ccc9d3e09434 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_b5cf7783caa68180 = function(arg0) {
        let result;
        try {
            result = getObject(arg0) instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_isArray_51fd9e6422c0a395 = function(arg0) {
        const ret = Array.isArray(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_ae7d3f054d55fa16 = function(arg0) {
        const ret = Number.isSafeInteger(getObject(arg0));
        return ret;
    };
    imports.wbg.__wbg_iterator_27b7c8b35ab3e86b = function() {
        const ret = Symbol.iterator;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_length_22ac23eaec9d8053 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_length_d45040a40c570362 = function(arg0) {
        const ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_message_a4e9a39ee8f92b17 = function(arg0, arg1) {
        const ret = getObject(arg1).message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_1ba21ce319a06297 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_25f239778d6112b9 = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_3c79b3bb1b32b7d3 = function() { return handleError(function () {
        const ret = new Headers();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_6421f6084cc5bc5a = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_7c30d1f874652e62 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_881a222c65f168fc = function() { return handleError(function () {
        const ret = new AbortController();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_b546ae120718850e = function() {
        const ret = new Map();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_df1173567d5ff028 = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_ff12d2b041fb48f1 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wasm_bindgen_func_elem_19226(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_from_slice_f9c22b9153b26992 = function(arg0, arg1) {
        const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_no_args_cb138f77cf6151ee = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_d85c3da1fd8df149 = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_length_aa5eaf41d35235e5 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_with_str_and_init_c5748f76f5108934 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_with_str_sequence_073466a4a5387941 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_next_138a17bbf04e926c = function(arg0) {
        const ret = getObject(arg0).next;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_next_3cfe5c0fe2a4cc53 = function() { return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_now_2c95c9de01293173 = function(arg0) {
        const ret = getObject(arg0).now();
        return ret;
    };
    imports.wbg.__wbg_now_69d776cd24f5215b = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_performance_7a3ffd0b17f663ad = function(arg0) {
        const ret = getObject(arg0).performance;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_protocol_a74f36816d507cab = function(arg0, arg1) {
        const ret = getObject(arg1).protocol;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_prototypesetcall_dfe9b766cdc1f1fd = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
    };
    imports.wbg.__wbg_push_7d9be8f38fc13975 = function(arg0, arg1) {
        const ret = getObject(arg0).push(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_9b549dfce8865860 = function(arg0) {
        const ret = getObject(arg0).queueMicrotask;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_queueMicrotask_fca69f5bfad613a5 = function(arg0) {
        queueMicrotask(getObject(arg0));
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_read_39c4b35efcd03c25 = function(arg0) {
        const ret = getObject(arg0).read();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_readyState_9d0976dcad561aa9 = function(arg0) {
        const ret = getObject(arg0).readyState;
        return ret;
    };
    imports.wbg.__wbg_reason_d4eb9e40592438c2 = function(arg0, arg1) {
        const ret = getObject(arg1).reason;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_releaseLock_a5912f590b185180 = function(arg0) {
        getObject(arg0).releaseLock();
    };
    imports.wbg.__wbg_removeEventListener_54bf92f4a849bd7d = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    }, arguments) };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_resolve_fd5bfbaa4ce36e1e = function(arg0) {
        const ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_respond_9f7fc54636c4a3af = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).respond(arg1 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_send_7cc36bb628044281 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_send_ea59e150ab5ebe08 = function() { return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_setTimeout_2b111259203a2623 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).setTimeout(takeObject(arg1), arg2);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setTimeout_cb2a856ba8315e7a = function(arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setTimeout_db2dbaeefb6f39c7 = function() { return handleError(function (arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1);
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_set_169e13b608078b7b = function(arg0, arg1, arg2) {
        getObject(arg0).set(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_7df433eea03a5c14 = function(arg0, arg1, arg2) {
        getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
    };
    imports.wbg.__wbg_set_binaryType_73e8c75df97825f8 = function(arg0, arg1) {
        getObject(arg0).binaryType = __wbindgen_enum_BinaryType[arg1];
    };
    imports.wbg.__wbg_set_body_8e743242d6076a4f = function(arg0, arg1) {
        getObject(arg0).body = getObject(arg1);
    };
    imports.wbg.__wbg_set_cache_0e437c7c8e838b9b = function(arg0, arg1) {
        getObject(arg0).cache = __wbindgen_enum_RequestCache[arg1];
    };
    imports.wbg.__wbg_set_credentials_55ae7c3c106fd5be = function(arg0, arg1) {
        getObject(arg0).credentials = __wbindgen_enum_RequestCredentials[arg1];
    };
    imports.wbg.__wbg_set_efaaf145b9377369 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_handle_event_14baa3949ef6909d = function(arg0, arg1) {
        getObject(arg0).handleEvent = getObject(arg1);
    };
    imports.wbg.__wbg_set_headers_5671cf088e114d2b = function(arg0, arg1) {
        getObject(arg0).headers = getObject(arg1);
    };
    imports.wbg.__wbg_set_method_76c69e41b3570627 = function(arg0, arg1, arg2) {
        getObject(arg0).method = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_mode_611016a6818fc690 = function(arg0, arg1) {
        getObject(arg0).mode = __wbindgen_enum_RequestMode[arg1];
    };
    imports.wbg.__wbg_set_onclose_032729b3d7ed7a9e = function(arg0, arg1) {
        getObject(arg0).onclose = getObject(arg1);
    };
    imports.wbg.__wbg_set_onerror_7819daa6af176ddb = function(arg0, arg1) {
        getObject(arg0).onerror = getObject(arg1);
    };
    imports.wbg.__wbg_set_onmessage_71321d0bed69856c = function(arg0, arg1) {
        getObject(arg0).onmessage = getObject(arg1);
    };
    imports.wbg.__wbg_set_onopen_6d4abedb27ba5656 = function(arg0, arg1) {
        getObject(arg0).onopen = getObject(arg1);
    };
    imports.wbg.__wbg_set_signal_e89be862d0091009 = function(arg0, arg1) {
        getObject(arg0).signal = getObject(arg1);
    };
    imports.wbg.__wbg_signal_3c14fbdc89694b39 = function(arg0) {
        const ret = getObject(arg0).signal;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_769e6b65d6557335 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_60cf02db4de8e1c1 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_08f5a74c69739274 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_a8924b26aa92d024 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_status_9bfc680efca4bdfd = function(arg0) {
        const ret = getObject(arg0).status;
        return ret;
    };
    imports.wbg.__wbg_subarray_845f2f5bce7d061a = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_429f7caf1026411d = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_4f95312d68691235 = function(arg0, arg1) {
        const ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_url_b6d11838a4f95198 = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_url_df28eef824b04410 = function(arg0, arg1) {
        const ret = getObject(arg1).url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_value_57b7b035e117f7ee = function(arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_view_788aaf149deefd2f = function(arg0) {
        const ret = getObject(arg0).view;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_wasClean_4154a2d59fdb4dd7 = function(arg0) {
        const ret = getObject(arg0).wasClean;
        return ret;
    };
    imports.wbg.__wbg_wasmeventpoller_new = function(arg0) {
        const ret = WasmEventPoller.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_03a215c9724df050 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 2103, function: Function { arguments: [], shim_idx: 2104, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_8739, __wasm_bindgen_func_elem_8756);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_3ae16e8695bc3be2 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 3461, function: Function { arguments: [], shim_idx: 3462, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_16097, __wasm_bindgen_func_elem_16115);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_3e91152505ef6a1d = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 712, function: Function { arguments: [NamedExternref("CloseEvent")], shim_idx: 713, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_3895, __wasm_bindgen_func_elem_4437);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_7883ec8aa8ff100a = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 1923, function: Function { arguments: [], shim_idx: 1924, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_7631, __wasm_bindgen_func_elem_7641);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_877969b1e4e627b5 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 2109, function: Function { arguments: [], shim_idx: 2110, ret: Unit, inner_ret: Some(Unit) }, mutable: false }) -> Externref`.
        const ret = makeClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_8775, __wasm_bindgen_func_elem_8806);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_8b2d17ece3f3341c = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 3469, function: Function { arguments: [Externref], shim_idx: 3470, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_16158, __wasm_bindgen_func_elem_16174);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
        // Cast intrinsic for `I64 -> Externref`.
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_b99017ed67301f6b = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 2375, function: Function { arguments: [NamedExternref("MessageEvent")], shim_idx: 2376, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.__wasm_bindgen_func_elem_9489, __wasm_bindgen_func_elem_9534);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('araliya_net_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
