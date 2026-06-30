# Stellar Soroban Smart Contract Deployment Guide

This guide details the end-to-end workflow for compiling, optimizing, deploying, and seeding the Decentralized Quiz App smart contract on the **Stellar Testnet**.

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
- **Rust & Cargo** (v1.75+)
- **wasm32-unknown-unknown** target: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI** (v21.0.0+): Install via `curl -sSfL https://release.stellar.org/stellar-cli/install.sh | sh`
- A Stellar account funded with Testnet XLM (use the Friendbot faucet).

---

## 🛠️ Step 1: Compiling the Smart Contract

To compile the smart contract to WebAssembly (`.wasm`), run the following command from the workspace root or inside the `contracts/quiz-contract/` folder:

```bash
cargo build --target wasm32-unknown-unknown --release
```

This compiles the contract and saves the raw WASM file to:
`./target/wasm32-unknown-unknown/release/quiz_contract.wasm`

---

## ⚡ Step 2: Optimizing the WASM File

Before deploying, you **must** optimize the WASM binary to minimize contract size and CPU/Memory resource consumption on-chain:

```bash
stellar contract optimize --wasm ./target/wasm32-unknown-unknown/release/quiz_contract.wasm
```

This saves the optimized binary to:
`./target/wasm32-unknown-unknown/release/quiz_contract.optimized.wasm`

---

## 🚀 Step 3: Deploying to Stellar Testnet

Run the following command using Stellar CLI to deploy the contract and acquire the **Contract ID**:

```bash
stellar contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/quiz_contract.optimized.wasm \
  --source-account <YOUR_STELLAR_SECRET_OR_IDENTITY_NAME> \
  --network testnet
```

**Output:**
```text
CARMZTNTQ3FQT2B3DTKB47P4LA4H3435NTO5FX26DSW24DSF2BU7X73A
```

Copy the generated **Contract ID** and update it in:
- `src/services/soroban.ts` on line 32 (`export const CONTRACT_ID = '...'`)

---

## 🌱 Step 4: Seeding Initial Quiz Questions

Once the contract is deployed, initialize it with questions.
Run the project's seeding scripts:

```bash
node deploy-now.js
```
or run `initializeContract` directly from the Admin Panel in the frontend.
This executes the `create_quiz_batch` call on-chain, storing the 15 default questions in the contract storage.

---

## 🧪 Verification

To verify that the contract is running and active on-chain, search its Contract ID on [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/).
