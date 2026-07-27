# 🎰 BingoPlus Satoshi (BPS)
### *Next-Generation Provably Fair Blockchain Social Casino on Bitcoin Cash Chipnet*

![Bitcoin Cash](https://img.shields.io/badge/Bitcoin_Cash-Chipnet-0ac18e?style=for-the-badge&logo=bitcoin-cash&logoColor=white)
![CashScript](https://img.shields.io/badge/CashScript-v0.10.0-fbbf24?style=for-the-badge&logo=solidity&logoColor=black)
![React](https://img.shields.io/badge/React-v18.3.1-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Node.js-Express_v4-805ad5?style=for-the-badge&logo=node.js&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_Database-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

---

## 🌟 Overview

**BingoPlus Satoshi** is a full-stack, enterprise-grade, provably fair Web3 social casino built natively for the **Bitcoin Cash Chipnet** test network. It pairs traditional casino entertainment (Dice, Slots, Mines) with transparent on-chain cryptography, CashScript 0.10 smart contracts, AES-256-GCM private key security, and real-time automated Fulcrum Electrum deposit syncing.

---

## 🎮 Casino Game Suite

### 1. 🎲 Satoshi Dice
* **Mechanics**: Classic high-frequency dice game with customizable Win Chance (0.01% to 98.00%).
* **House Edge**: Fixed 2.0% (98.0% RTP).
* **Fairness**: Outcome derived via `HMAC-SHA256(ServerSeed, ClientSeed:Nonce)` mapped to `[0.00, 99.99]`.

### 2. 🎰 Meme Slots
* **Mechanics**: 3-reel crypto meme slot machine featuring Satoshi Rockets, Diamonds, Slot Cabinets, Lightning, Lemons, and Cherries.
* **Jackpot**: **50x Multiplier** on 3 Satoshi Rockets (`🚀🚀🚀`).
* **Paytable**: Dynamic payout multipliers (50x, 25x, 10x, 5x, 3x, 2x).

### 3. 💣 Chipnet Mines
* **Mechanics**: 5x5 grid (25 tiles) minefield game allowing 1 to 24 customizable hidden mines.
* **Scaling Multipliers**: Multipliers scale exponentially after each safe gem uncovered (`RTP 97%`).
* **Cashout Control**: Real-time cashout option after uncovering any safe gem.

---

## ⚡ Real-Time On-Chain Chipnet Features

* **Automated UTXO Deposit Scanner**: Background worker connects directly to Chipnet Fulcrum Electrum nodes (`chipnet.bch.ninja:50002` & `chipnet.imaginary.cash:50002`) to scan for unspent transaction outputs (`blockchain.scripthash.listunspent`). Deposits from faucets or external wallets credit automatically within seconds.
* **Testnet Withdrawals**: Instant, audited testnet withdrawals to any `bchtest:` CashAddr.
* **Balance Ledger**: Immutable balance audit trail recording every deposit, bet win, bet loss, and withdrawal in Firebase Realtime Database.

---

## 🛡️ Cryptography & Provable Fairness Engine

* **Pre-Committed Server Seeds**: Active fairness epochs generate SHA-256 pre-committed server seeds (`ServerSeedHash = SHA256(ServerSeed)`). Players verify outcomes post-session without house manipulation.
* **Deterministic HMAC-SHA256 Derivation**: Every game round produces a unqiue HMAC hex hash derived from `(ServerSeed, ClientSeed, Nonce)`.
* **AES-256-GCM Encryption**: User keypairs generated during account registration (`generateTestKeypair()`) have WIF private keys encrypted using AES-256-GCM prior to database persistence.

---

## 📜 Smart Contracts & Blockchain Audit

* **CashScript 0.10 Vault**: Multi-signature treasury smart contract (`JackpotVault.cash`) enforcing house reserve locking and 2-of-2 multi-sig admin payouts.
* **On-Chain OP_RETURN Anchors**: Admin batch anchoring engine aggregates game hashes into `OP_RETURN` payload transactions broadcasted to Bitcoin Cash Chipnet.

---

## 🏗️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │             React 18 + Vite Frontend (SPA)              │
   │      (Zustand State, Lucide Icons, Glassmorphism CSS)    │
   └────────────────────────────┬────────────────────────────┘
                                │ HTTP / JSON API
   ┌────────────────────────────▼────────────────────────────┐
   │             Express.js + TypeScript Backend             │
   │  (Provably Fair Engine, Bet Transactions, Auth Guards)  │
   └──────────────┬──────────────────────────┬───────────────┘
                  │                          │
                  │ TCP TLS                  │ RTDB Admin SDK
   ┌──────────────▼─────────────┐   ┌────────▼──────────────┐
   │ Chipnet Fulcrum Electrum   │   │ Firebase Realtime DB  │
   │ Nodes (chipnet.bch.ninja)  │   │ & Authentication     │
   └────────────────────────────┘   └───────────────────────┘
```

| Domain | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Zustand, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js (ESM), Express.js, TypeScript, Helmet, CORS |
| **Database & Auth** | Firebase Realtime Database, Firebase Auth, Firebase Admin SDK |
| **Blockchain Client** | `bchaddrjs`, `bs58check`, `wif`, Fulcrum Electrum JSON-RPC |
| **Smart Contracts** | CashScript 0.10 (`JackpotVault.cash`), Cashc compiler |
| **Security** | AES-256-GCM encryption, WIF Key Isolation, Rate Limiting |

---

## 📁 Directory Structure

```text
BingoPlus Satoshi/
├── backend/
│   ├── secrets/
│   │   └── firebase-service-account.json   # Firebase Admin Service Account Key
│   ├── src/
│   │   ├── auth/                            # Auth token verification & Admin setup
│   │   ├── blockchain/                      # Address generation & Fulcrum Electrum scanner
│   │   ├── contracts/                       # JackpotVault.cash smart contract definition
│   │   ├── games/                           # Dice, Slots, Mines game logic adapters
│   │   ├── http/                            # Express server & API v1 route controllers
│   │   ├── security/                        # AES-256-GCM WIF encryption
│   │   └── services/                        # Bet Engine, Fairness, Account Bootstrapper
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                             # React Router 6 setup & Route Guards
│   │   ├── components/                      # UI Layouts, Modals, Navbar
│   │   ├── hooks/                           # Firebase Auth listener hook
│   │   ├── lib/                             # API Client fetch wrapper
│   │   ├── pages/                           # Lobby, Dice, Slots, Mines, Wallet, Audit, Admin
│   │   └── stores/                          # Zustand Auth & UI Stores
│   ├── package.json
│   └── vite.config.ts
├── DEMO_RUNBOOK.md                          # Demonstration & Manual Test Runbook
└── README.md                                # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Firebase Project**: Firebase Realtime Database & Auth enabled

---

### Step 1: Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Environment Configuration

Create a `.env` file inside the `backend` directory:

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

FIREBASE_PROJECT_ID=bingoplusbch
FIREBASE_DATABASE_URL=https://bingoplusbch-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json

BCH_NETWORK=chipnet
WALLET_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
DEMO_STARTING_SATS=50000
MIN_BET_SATS=100
MAX_BET_SATS=5000
DEPOSIT_SCAN_ENABLED=true
```

Create a `.env` file inside the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

### Step 3: Add Firebase Credentials

Place your downloaded Firebase service account JSON key file at:
`backend/secrets/firebase-service-account.json`

---

### Step 4: Run the Development Servers

Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend Web App):**
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🧪 Verification & Build

To test production TypeScript compilation and builds:

```bash
# Build Backend
cd backend
npm run build

# Build Frontend
cd ../frontend
npm run build
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

*Disclaimer: BingoPlus Satoshi is built solely on the Bitcoin Cash Chipnet test network for technical demonstration, educational, and audit purposes. No real currency is at risk.*
