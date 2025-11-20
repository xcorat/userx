# Introduction to QnA App

## What is it?
A lightweight, single-user social platform built on a shared application layer where **the user is the sole owner of their data**. It powers multiple experiences, including a core Q&A application and companion apps like "Memeball" (a meme voting game). The platform emphasizes modularity, allowing different front-end features ("perspectives") to consume shared services and data, while the user retains full control over access permissions.

## Key Features
*   **Social Q&A:** Post short questions, provide public or private answers, and view aggregate statistics.
*   **Direct Messaging:** Send private questions and maintain 1:1 conversations via a secure DM inbox.
*   **User Profiles:** Public profiles displaying answers and engagement stats.
*   **Companion Apps:** Extensible architecture supporting additional apps like Memeball (swipe-based meme voting).
*   **Ed25519 Identity:** Secure, key-based user identification using Ed25519 public keys.

## Security & Privacy
*   **Client-Side Sovereignty:** User private keys and passwords **never leave the client**. This ensures that even in the event of a server-side data breach, private data remains cryptographically unreadable.
*   **Protected Data (Roadmap):** Post-prototype development will focus on granular access controls, enabling users to share specific data subsets only with authorized apps or individuals.

## Long-term Vision
The fundamental goal is to use this platform as a foundation to collaboratively build a **fully decentralized, peer-to-peer (P2P) graph database** that acts as public infrastructure. Drawing from our feasibility analysis of Rust-based P2P systems, we aim to create a censorship-resistant, offline-first network where users maintain absolute sovereignty over their digital footprint.

## Architecture
*   **Framework:** SvelteKit (Svelte 5 + TypeScript).
*   **Design Pattern:** Layered architecture with strict separation of concerns (UI, Stores, Services, Repositories).
*   **Dependency Injection:** Centralized DI container (`lib/config/di-container.ts`) for managing service and repository dependencies.
*   **State Management:** Powered by Svelte 5 Runes (`$state`, `$derived`) within `.svelte.ts` store files.
*   **Server Boundary:** Strict isolation of server-side code (database adapters) from client-side bundles.

## Data & Storage
*   **Flexible Storage:** The app dynamically selects storage adapters based on the environment:
    *   **Development:** SQLite (local `better-sqlite3`) or Mock data.
    *   **Production:** Cloudflare D1 via server API routes.
*   **API Layer:** Client-side apps communicate via a unified REST API, allowing multiple front-ends (web, mobile) to share the same backend logic.

## Getting Started
1.  **Feed:** Visit `/` to browse and filter public questions.
2.  **Interact:** Click any question to answer. Choose `PUBLIC` for visibility or `PRIVATE` for personal tracking.
3.  **Profile:** Manage your identity and view your activity at `/profile`.
4.  **DMs:** Access your private inbox at `/dm` to exchange direct questions.
