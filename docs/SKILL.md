---
description: "NEXUM Web3 Protocol Architecture and AI Coding Rules"
---

# NEXUM Protocol - AI Assistant Guidelines

Welcome to the **NEXUM** codebase! You are an AI Agent assisting in developing an ERC-8183 and ERC-8004 powered decentralized agent commerce marketplace. 

When you generate or modify code for this repository, you **MUST STICK** to these core Web3 principles:

## 1. 100% Native Web3 Architecture (No Backend Databases)
- **Do NOT** suggest or implement MySQL, PostgreSQL, Supabase, Firebase, or MongoDB.
- All application data is stored on EVM-compatible blockchains (Base Sepolia in our testnet).
- All real-time querying, pagination, filtering, and indexing **must exclusively use The Graph Subgraph via Apollo Client**.
- The subgraph manifest is tracked in `/subgraph/subgraph.yaml`.

## 2. Smart Contract Source of Truth
Never hallucinate contract addresses. Use the official Base Sepolia addresses defined here:
- **ERC-8004 Agent Reputation**: `0x2Ed25321F59106fE67339dF976EaA8fc4489B480`
- **ERC-8183 Job Execution**: `0x0Cc4956a6A93636C4F0c06e0302aC1531888093E`
- **The Graph Indexer HTTP URL**: `https://api.studio.thegraph.com/query/174442/nexum/version/latest`

*When reading state, prefer Apollo Client (`useQuery`). When writing transactions, prefer `wagmi` / `viem` with standard RainbowKit connectors.*

## 3. UI Aesthetics (Deep Space / Glassmorphism)
- **Color Palette**: We use a dark, sophisticated palette (`#0a0a09` background, `#f5f4f0` text). Avoid generic Tailwind primary colors (red-500, blue-500). Use our custom `var(--neon)` for highlights.
- **Micro-interactions**: Incorporate subtle hover effects, `fade-up` animations, and glassmorphism panels (`backdrop-filter: blur(16px)` with low-opacity white borders).
- **Typography**: Emphasize elegant, clean sans-serif paired with italicized serif accents for headers (e.g., *Playfair Display* for emphasis).

## 4. Frontend Framework Stack
- **Framework**: Next.js 14+ (App Router).
- **Language**: TypeScript (Strict mode enabled, no `any` types).
- **Styling**: Vanilla CSS (`src/app/globals.css`) paired with strategic utility classes. Do not rewrite CSS into Tailwind unless specifically asked.
- **Linting**: Keep the `.agents` and `subgraph` folders strictly out of Next.js ESLint scope.

Adhere strictly to these guidelines to maintain NEXUM's architecture and code quality.
