<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { encryptPrivateKey, decryptPrivateKey } from '$lib/utils/encryption';
	import { generateEd25519KeyPair, signChallenge, verifySignature } from '$lib/utils/keypair';
	import { toast } from 'svelte-sonner';

	// Form inputs
	let username = $state('');
	let publicKey = $state('');
	let password = $state('');
	let encryptedPrivateKey = $state('');

	// Results
	let generatedPublicKey = $state('');
	let generatedEncryptedKey = $state('');
	let decryptedPrivateKey = $state('');
	let isPrivateKeyEditable = $state(false);
	let validationResult = $state<boolean | null>(null);
	let testChallenge = $state('test-challenge-' + Date.now());
	let signature = $state('');
	let verificationResult = $state<boolean | null>(null);
	let error = $state('');

	// Database users
	let dbUsers = $state<Array<{ username: string; displayName: string; publicKey: string; encryptedPrivateKey: string }>>([]);
	let isLoadingDbUsers = $state(false);

	// Test with existing credentials
	function loadTestUser(testUsername: string) {
		const testUsers: Record<string, { publicKey: string; encryptedPrivateKey: string }> = {
			alicejohnson: {
				publicKey: 'MCowBQYDK2VwAyEAo1JWLV32u8pMM9WVqPEgDUVzUxCLuGPhlaWOhUBBw4Q=',
				encryptedPrivateKey: '+g0GC4s8riyOCQpHde1yHPkcBoM3ZQQ3dQw6to7V39fqKxiefwnnvNmDSsjnQJCamazoKzGPpHXM4j7kFHEp+s1jGyB7uusYZX1xF0S9AEiQ7tQwPDrwJWMm0d6NTsaj1yLlV0iFgd39jSfG'
			},
			bobsmith: {
				publicKey: 'MCowBQYDK2VwAyEAbRcpufoPRdM/0jV92BAnf5DXYJR1PG6z9dp4SJxC9Jo=',
				encryptedPrivateKey: '/NNHG8seCEpl5pMWGmuH2fsc0/zB9w7/7gmNF9r3Ms1njQKGVmsLssETtH/Q0ZK9+ttZzpUwA/u9uLJqisQ0HPVwnBPBnn+fpZkpbPuLiLLwVoquN5V+Q2nUhof+folVPj8ojLBsQm2aJa4S'
			},
			caroldavis: {
				publicKey: 'MCowBQYDK2VwAyEAG7iuGQoEyuHkwFYMuL5XSNvmig1OVOV5nYj5i7NLORo=',
				encryptedPrivateKey: '4RFWtI9obYXxVUQ6/yFVtyl2gjLQPd+X3tVvzx0tKeerbf6zknB9Fo87U/S9FsCyk16GBeAD1pN/eXVqnfPBeJK3tG0rN6T/IY1WBWPsBSxG0p2gGG1JAn668emPRbyBb8SFk422gHiTbVz6'
			},
			davidwilson: {
				publicKey: 'MCowBQYDK2VwAyEA6YMts8mLVQl9C7jpvhoJxgkOwRBW2dEmkEQdVXuz3mc=',
				encryptedPrivateKey: 'FX54Yc0rR6wnqS5QzlwOQgav7g/Gx6IKipoPSgRmufkfMSLMG7JrFwcngvkqHujjtH+nJJYVdThWlem/RZOyRdue0afkmky+MuJkotSjiOWeJPyM/0fiJFwBvhbPQNT/nIoPJvnpbDaL+ghs'
			},
			emmabrown: {
				publicKey: 'MCowBQYDK2VwAyEA78FPjIq8Z2tzyH8sqhWckDEsPrhkVhWJY8A/5BsmxU0=',
				encryptedPrivateKey: 'Yp/nu3h/q667MD2ubPaLQNhcBoXSN7H4K5360VRJRqqKGILNX/QRoW3nkvgdrG/H89Y87YGMqmaSjnTydKCCodifplC262kpdnUJTE0cwFfwh8hbip3/uZQRzBqcI0+TpHE6/fdDv4SoA28w'
			}
		};

		const user = testUsers[testUsername];
		if (user) {
			username = testUsername;
			publicKey = user.publicKey;
			encryptedPrivateKey = user.encryptedPrivateKey;
			password = 'password'; // Test password
			toast.success(`Loaded ${testUsername}`);
		}
	}

	async function loadDbUsers() {
		isLoadingDbUsers = true;
		error = '';
		try {
			const response = await fetch('/api/users');
			if (!response.ok) {
				throw new Error('Failed to fetch users from database');
			}
			const data: any = await response.json();
			dbUsers = data.users || [];
			toast.success(`Loaded ${dbUsers.length} users from database`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load database users';
			toast.error('Failed to load users from database');
		} finally {
			isLoadingDbUsers = false;
		}
	}

	function loadDbUser(user: typeof dbUsers[0]) {
		username = user.username;
		publicKey = user.publicKey;
		encryptedPrivateKey = user.encryptedPrivateKey;
		password = 'password'; // Default test password
		toast.success(`Loaded ${user.displayName} from database`);
	}

	async function handleGenerateKeypair() {
		error = '';
		if (!password.trim()) {
			error = 'Password is required';
			return;
		}

		try {
			const { publicKey: pubKey, privateKey: privKey } = await generateEd25519KeyPair();
			generatedPublicKey = pubKey;
			
			const encrypted = await encryptPrivateKey(privKey, password);
			generatedEncryptedKey = encrypted;
			
			toast.success('Keypair generated and encrypted!');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate keypair';
		}
	}

	async function handleDecrypt() {
		error = '';
		decryptedPrivateKey = '';
		
		if (!encryptedPrivateKey.trim() || !password.trim()) {
			error = 'Encrypted private key and password are required';
			return;
		}

		try {
			const decrypted = await decryptPrivateKey(encryptedPrivateKey, password);
			decryptedPrivateKey = decrypted;
			toast.success('Private key decrypted successfully!');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to decrypt private key';
			toast.error('Decryption failed - wrong password?');
		}
	}

	async function handleSign() {
		error = '';
		signature = '';
		
		if (!decryptedPrivateKey.trim() || !testChallenge.trim()) {
			error = 'Decrypted private key and challenge are required';
			return;
		}

    

    

		try {
			const sig = await signChallenge(testChallenge, decryptedPrivateKey);
			signature = sig;
			toast.success('Challenge signed!');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to sign challenge';
		}
	}

	async function handleValidatePrivateKey() {
		error = '';
		validationResult = null;

		if (!decryptedPrivateKey.trim() || !publicKey.trim()) {
			error = 'Decrypted private key and public key are required for validation';
			return;
		}

		try {
			// Sign a short challenge and verify with the provided public key
			const challenge = testChallenge || ('validate-' + Date.now());
			const sig = await signChallenge(challenge, decryptedPrivateKey);
			const isValid = await verifySignature(challenge, sig, publicKey);
			validationResult = isValid;
			if (isValid) {
				toast.success('Private key validated against public key');
			} else {
				toast.error('Private key validation failed');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to validate private key';
			validationResult = false;
			toast.error('Validation failed');
		}
	}

	async function handleVerify() {
		error = '';
		verificationResult = null;
		
		if (!publicKey.trim() || !testChallenge.trim() || !signature.trim()) {
			error = 'Public key, challenge, and signature are required';
			return;
		}

		try {
			const isValid = await verifySignature(testChallenge, signature, publicKey);
			verificationResult = isValid;
			
			if (isValid) {
				toast.success('Signature verified! ✓');
			} else {
				toast.error('Signature verification failed! ✗');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to verify signature';
			verificationResult = false;
		}
	}

	function clearAll() {
		username = '';
		publicKey = '';
		password = '';
		encryptedPrivateKey = '';
		generatedPublicKey = '';
		generatedEncryptedKey = '';
		decryptedPrivateKey = '';
		signature = '';
		verificationResult = null;
		error = '';
		testChallenge = 'test-challenge-' + Date.now();
	}
</script>

<svelte:head>
	<title>Ed25519 Credentials Tester</title>
</svelte:head>

<div class="container max-w-6xl mx-auto py-8 space-y-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold">Ed25519 Credentials Tester</h1>
		<p class="text-muted-foreground">
			Test keypair generation, encryption, decryption, signing, and verification
		</p>
	</div>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	<!-- Quick Load Test Users -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Load Test User</CardTitle>
			<CardDescription>Load credentials for testing (password: "password")</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<h3 class="text-sm font-semibold mb-2">Hardcoded Test Data:</h3>
				<div class="flex flex-wrap gap-2">
					<Button variant="outline" size="sm" onclick={() => loadTestUser('alicejohnson')}>
						Alice Johnson
					</Button>
					<Button variant="outline" size="sm" onclick={() => loadTestUser('bobsmith')}>
						Bob Smith
					</Button>
					<Button variant="outline" size="sm" onclick={() => loadTestUser('caroldavis')}>
						Carol Davis
					</Button>
					<Button variant="outline" size="sm" onclick={() => loadTestUser('davidwilson')}>
						David Wilson
					</Button>
					<Button variant="outline" size="sm" onclick={() => loadTestUser('emmabrown')}>
						Emma Brown
					</Button>
				</div>
			</div>

			<div class="border-t pt-4">
				<div class="flex items-center justify-between mb-2">
					<h3 class="text-sm font-semibold">Database (API) Users:</h3>
					<Button 
						variant="outline" 
						size="sm" 
						onclick={loadDbUsers}
						disabled={isLoadingDbUsers}
					>
						{isLoadingDbUsers ? 'Loading...' : 'Load from DB'}
					</Button>
				</div>
				{#if dbUsers.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each dbUsers as user}
							<Button 
								variant="secondary" 
								size="sm" 
								onclick={() => loadDbUser(user)}
							>
								{user.displayName}
								<span class="ml-1 text-xs opacity-60">(@{user.username})</span>
							</Button>
						{/each}
					</div>
				{:else if !isLoadingDbUsers}
					<p class="text-sm text-muted-foreground italic">
						Click "Load from DB" to fetch users from the database
					</p>
				{/if}
			</div>

			<div class="border-t pt-4">
				<Button variant="destructive" size="sm" onclick={clearAll} class="w-full">
					Clear All Fields
				</Button>
			</div>
		</CardContent>
	</Card>

	<div class="grid md:grid-cols-2 gap-6">
		<!-- Left Column: Generation & Input -->
		<div class="space-y-6">
			<!-- Generate New Keypair -->
			<Card>
				<CardHeader>
					<CardTitle>1. Generate New Keypair</CardTitle>
					<CardDescription>Generate a new Ed25519 keypair and encrypt it</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="gen-password">Password for Encryption</Label>
						<Input
							id="gen-password"
							type="password"
							bind:value={password}
							placeholder="Enter password"
						/>
					</div>
					<Button onclick={handleGenerateKeypair} class="w-full">
						Generate Keypair
					</Button>
					
					{#if generatedPublicKey}
						<div class="space-y-2">
							<Label>Generated Public Key</Label>
							<Textarea readonly value={generatedPublicKey} rows={2} class="font-mono text-xs" />
						</div>
					{/if}
					
					{#if generatedEncryptedKey}
						<div class="space-y-2">
							<Label>Generated Encrypted Private Key</Label>
							<Textarea readonly value={generatedEncryptedKey} rows={3} class="font-mono text-xs" />
							<Button 
								variant="outline" 
								size="sm"
								onclick={() => {
									encryptedPrivateKey = generatedEncryptedKey;
									publicKey = generatedPublicKey;
								}}
							>
								Use These Credentials →
							</Button>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Manual Input -->
			<Card>
				<CardHeader>
					<CardTitle>2. Enter Credentials</CardTitle>
					<CardDescription>Or manually enter existing credentials</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="username">Username (optional)</Label>
						<Input
							id="username"
							type="text"
							bind:value={username}
							placeholder="alicejohnson"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="publicKey">Public Key</Label>
						<Textarea
							id="publicKey"
							bind:value={publicKey}
							placeholder="MCowBQYDK2VwAyEA..."
							rows={2}
							class="font-mono text-xs"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="password-input">Password</Label>
						<Input
							id="password-input"
							type="password"
							bind:value={password}
							placeholder="password"
						/>
					</div>
					
					<div class="space-y-2">
						<Label for="encryptedKey">Encrypted Private Key</Label>
						<Textarea
							id="encryptedKey"
							bind:value={encryptedPrivateKey}
							placeholder="+g0GC4s8riyO..."
							rows={3}
							class="font-mono text-xs"
						/>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Right Column: Operations -->
		<div class="space-y-6">
			<!-- Decrypt -->
			<Card>
				<CardHeader>
					<CardTitle>3. Decrypt Private Key</CardTitle>
					<CardDescription>Decrypt the private key using the password</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button onclick={handleDecrypt} class="w-full">
						Decrypt Private Key
					</Button>
					
					{#if decryptedPrivateKey}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<Label>Decrypted Private Key</Label>
									<div class="flex items-center gap-2">
										<button class="text-sm text-slate-500" onclick={() => isPrivateKeyEditable = !isPrivateKeyEditable}>
											{isPrivateKeyEditable ? 'Lock' : 'Edit'}
										</button>
											<button class="text-sm text-slate-500" onclick={() => { decryptedPrivateKey = ''; validationResult = null; }}>
											Clear
										</button>
									</div>
								</div>
								<Textarea 
									bind:value={decryptedPrivateKey}
									rows={3} 
									class="font-mono text-xs bg-green-50 dark:bg-green-950"
									readonly={!isPrivateKeyEditable}
								/>
								<p class="text-xs text-muted-foreground">
									✓ Successfully decrypted! Private key is now available for signing.
								</p>

								<div class="flex gap-2">
									<Button onclick={handleValidatePrivateKey} variant="outline" size="sm">
										Validate Private Key
									</Button>
									<Button onclick={() => { testChallenge = 'validate-' + Date.now(); } } size="sm" variant="ghost">
										New Challenge
									</Button>
								</div>

								{#if validationResult !== null}
									<div class={`mt-2 p-2 rounded-md ${validationResult ? 'bg-green-100' : 'bg-red-100'}`}>
										<p class={`text-sm font-semibold ${validationResult ? 'text-green-800' : 'text-red-800'}`}>
											{validationResult ? '✓ Private key VALID for provided public key' : '✗ Private key INVALID for provided public key'}
										</p>
									</div>
								{/if}
							</div>
						{/if}
				</CardContent>
			</Card>

			<!-- Sign -->
			<Card>
				<CardHeader>
					<CardTitle>4. Sign Challenge</CardTitle>
					<CardDescription>Sign a challenge string with the private key</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-2">
						<Label for="challenge">Challenge String</Label>
						<Input
							id="challenge"
							type="text"
							bind:value={testChallenge}
							placeholder="test-challenge-123456"
						/>
					</div>
					
					<Button onclick={handleSign} class="w-full" disabled={!decryptedPrivateKey}>
						Sign Challenge
					</Button>
					
					{#if signature}
						<div class="space-y-2">
							<Label>Signature</Label>
							<Textarea 
								readonly 
								value={signature} 
								rows={3} 
								class="font-mono text-xs bg-blue-50 dark:bg-blue-950"
							/>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Verify -->
			<Card>
				<CardHeader>
					<CardTitle>5. Verify Signature</CardTitle>
					<CardDescription>Verify the signature using the public key</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button 
						onclick={handleVerify} 
						class="w-full"
						disabled={!signature || !publicKey}
					>
						Verify Signature
					</Button>
					
					{#if verificationResult !== null}
						<div class="space-y-2">
							<div class={`p-4 rounded-md ${verificationResult ? 'bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-800' : 'bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800'}`}>
								<p class={`font-semibold ${verificationResult ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
									{verificationResult ? '✓ Signature is VALID' : '✗ Signature is INVALID'}
								</p>
								<p class={`text-sm mt-1 ${verificationResult ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
									{verificationResult 
										? 'The signature was created by the holder of the private key corresponding to the provided public key.'
										: 'The signature does not match the public key or challenge string.'}
								</p>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Summary -->
	<Card>
		<CardHeader>
			<CardTitle>Flow Summary</CardTitle>
		</CardHeader>
		<CardContent>
			<ol class="list-decimal list-inside space-y-2 text-sm">
				<li><strong>Generate Keypair:</strong> Creates Ed25519 public/private keypair</li>
				<li><strong>Encrypt:</strong> Private key is encrypted with password using PBKDF2 + AES-256-GCM</li>
				<li><strong>Store:</strong> Encrypted private key is stored (public key is the user ID)</li>
				<li><strong>Decrypt:</strong> User enters password to decrypt their private key client-side</li>
				<li><strong>Sign:</strong> Decrypted private key signs challenge strings for authentication</li>
				<li><strong>Verify:</strong> Server verifies signatures using the public key (user ID)</li>
			</ol>
			
			<div class="mt-4 p-3 bg-muted rounded-md text-xs">
				<p class="font-semibold mb-1">Security Notes:</p>
				<ul class="list-disc list-inside space-y-1">
					<li>Private keys are <strong>never</strong> sent to the server</li>
					<li>Password is <strong>only</strong> used client-side for encryption/decryption</li>
					<li>Server only stores: public key (ID) + encrypted private key</li>
					<li>Authentication uses challenge-response with Ed25519 signatures</li>
				</ul>
			</div>
		</CardContent>
	</Card>
</div>
