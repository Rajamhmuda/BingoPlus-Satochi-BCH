# Blockchain Social Casino — Full Implementation Plan

## 1. Project Definition

Build an original, parody-style casino web application inspired by the general experience of large online casino platforms, without copying BingoPlus branding, logos, artwork, proprietary games, or exact page designs.

The hackathon version is strictly:

- Bitcoin Cash Chipnet only
- Test satoshis and/or non-withdrawable demo credits only
- No real-money deposits
- No real-money cash-out
- No mainnet support
- No claim that every game action occurs on-chain

The blockchain layer will provide:

1. Chipnet wallet addresses for users.
2. Demonstrable faucet deposits.
3. Demonstrable test withdrawals.
4. Public transaction links.
5. Optional anchoring of game-round audit hashes.
6. Optional CashScript-controlled treasury for administrator demonstrations.

Game execution remains server-authoritative and off-chain for speed. Firebase Realtime Database supplies live state and UI updates.

## 2. Locked Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand for lightweight client state
- TanStack Query for backend API state and caching
- React Hook Form and Zod for forms and validation
- Firebase Web SDK
- Tailwind CSS or the existing CSS system

### Existing backend

- Node.js
- Express
- TypeScript
- Firebase Admin SDK
- CashScript
- cashc
- Bitcoin Cash Chipnet via ElectrumNetworkProvider

### Firebase

- Firebase Authentication: email/password
- Firebase Realtime Database: profiles, balances, bets, game state, leaderboards, ledger projections
- Firebase App Check: web protection after the core flow works
- Firebase Emulator Suite: local auth/database testing

## 3. Trust Boundary

The browser is untrusted.

The frontend may:

- Register and log in through Firebase Authentication.
- Read public game information.
- Read the authenticated user's public profile and balance.
- Submit game commands to the backend.
- Submit withdrawal requests.
- Display blockchain addresses and transaction links.

The frontend must never:

- Write balances directly.
- Mark a bet as won.
- calculate or choose authoritative outcomes.
- Write deposits or withdrawals.
- Read encrypted WIFs.
- Read the wallet encryption key.
- read unrevealed server seeds.
- assign itself an administrator role.
- broadcast transactions using server keys.

Only the Express backend, authenticated through Firebase Admin, performs authoritative writes.

## 4. Primary User Roles

### Player

Default account role. Can:

- Register and log in.
- Receive a Chipnet address.
- View test balance.
- Play enabled games.
- inspect provably fair information.
- Request a Chipnet test withdrawal.
- View personal bet and wallet history.
- Set voluntary play limits or self-exclude from the demo.

### Administrator

Seeded manually through a backend script. Can:

- Enable and disable games.
- View platform metrics.
- Pause betting globally.
- inspect deposits, withdrawals, bets, and errors.
- Resolve or reject stuck withdrawal requests.
- Rotate provably fair server seeds.
- Configure demo limits.

Do not expose an administrator option on public registration.

## 5. Seamless Registration and Login Architecture

### 5.1 Registration sequence

1. Player submits display name, email, password, password confirmation, and demo-age acknowledgement.
2. Frontend validates fields locally.
3. Frontend calls Firebase `createUserWithEmailAndPassword`.
4. Firebase creates the authentication identity and returns the signed-in user.
5. Frontend requests a fresh Firebase ID token.
6. Frontend calls `POST /api/v1/auth/bootstrap` with `Authorization: Bearer <id-token>`.
7. Backend verifies the token using Firebase Admin.
8. Backend runs an idempotent account-bootstrap operation.
9. Backend generates one Chipnet keypair using the existing `generateTestKeypair('bchtest')` utility.
10. Backend encrypts the WIF using AES-256-GCM and a server-only key.
11. Backend creates the user profile, public wallet record, private wallet record, starting demo balance, preferences, and audit entry.
12. Backend returns only safe account data: profile, role, public address, and balance.
13. Frontend stores safe session/profile state in a Zustand auth store, clears or refreshes relevant TanStack Query caches, and redirects to `/lobby`.

### 5.2 Self-healing login sequence

1. Player logs in using Firebase `signInWithEmailAndPassword`.
2. `onAuthStateChanged` restores the session after page refresh.
3. Frontend obtains an ID token.
4. Frontend calls `POST /api/v1/auth/bootstrap` again.
5. If account data exists, the backend returns it without generating another wallet.
6. If Firebase Auth exists but account setup previously failed, the backend completes the missing records.
7. Frontend redirects to the originally requested protected page or `/lobby`.

This removes the common failure where Firebase authentication succeeds but the database profile or wallet was never created.

### 5.3 Logout

- Call Firebase `signOut`.
- Reset all Zustand stores.
- Clear the TanStack Query cache.
- Remove active Firebase Realtime Database listeners.
- Redirect to `/login`.

### 5.4 Route protection

Use nested React Router route guards built with `<Outlet />`:

- `<RequireAuth />` for authenticated routes.
- `<GuestOnly />` for login and registration routes.
- `<RequireAdmin />` for administrator routes.

Each guard must wait for Firebase session restoration before redirecting so a page refresh does not incorrectly send an authenticated user to `/login`.

Do not trust React route guards for real authorization. They only improve navigation. Every protected backend endpoint must verify the Firebase ID token and role using Firebase Admin.

## 6. Wallet and Blockchain Model

### 6.1 User wallet

Each player receives:

- One Chipnet P2PKH address.
- One WIF generated by the backend.
- One encrypted private-wallet record inaccessible to clients.

Store public and private wallet information separately.

### 6.2 WIF storage

Use AES-256-GCM:

- `ciphertext`
- `iv`
- `authTag`
- `keyVersion`

The encryption key remains in the backend environment as `WALLET_ENCRYPTION_KEY`.

The backend must never log plaintext WIFs.

### 6.3 Deposit model

For the hackathon:

1. Player copies their `bchtest:` address.
2. Player sends Chipnet BCH from the Paytaca faucet.
3. Backend checks UTXOs for the player's address.
4. Every detected UTXO is identified by `txid:vout`.
5. The backend checks `/chain/deposits/{depositKey}` to prevent duplicate credit.
6. The backend credits the internal test balance once.
7. A ledger entry and wallet-history entry are created.
8. The UI updates through a realtime listener.

Allow a `Sync deposit` button for reliability. A background scanner may also poll active users, but the button guarantees a demo fallback.

### 6.4 Internal balance

Games use an internal authoritative balance instead of creating a blockchain transaction for every bet.

Fields:

- `availableSats`
- `lockedSats`
- `lifetimeDepositedSats`
- `lifetimeWithdrawnSats`
- `lifetimeWageredSats`
- `lifetimeWonSats`
- `updatedAt`
- `version`

All amounts are integer satoshis.

### 6.5 Withdrawal model

For the demo:

1. Player enters a valid Chipnet destination and amount.
2. Backend validates network, amount, balance, limits, and self-exclusion state.
3. Backend uses a Firebase transaction to move the amount from available to locked.
4. Backend creates a withdrawal request.
5. Backend signs and broadcasts a Chipnet transaction from the configured hot wallet or user custodial wallet.
6. On success, locked funds are consumed and a transaction ID is stored.
7. On failure, locked funds are returned.
8. UI displays the explorer link.

Do not implement mainnet.

### 6.6 CashScript usage

Do not force every game bet into a CashScript contract during the 24-hour build.

Use CashScript for one visible feature:

- Stretch option A: a 2-of-3 administrator treasury controlling large test withdrawals.
- Stretch option B: an audit vault that receives an OP_RETURN/hash-anchor transaction for completed game batches.
- Stretch option C: a jackpot vault with fixed payout conditions.

The current `AidTrancheVault.cash` may be retained as a reference, but it should not be presented as a finished casino treasury without changing its beneficiary and payout rules.

## 7. Game Engine Architecture

Create a reusable game adapter:

```ts
interface GameAdapter<TInput, TResult> {
  gameId: string;
  validateInput(input: TInput, config: GameConfig): void;
  calculateMaximumPayout(input: TInput, config: GameConfig): number;
  resolve(input: TInput, fairness: FairnessContext, config: GameConfig): TResult;
  calculatePayout(input: TInput, result: TResult, config: GameConfig): number;
  toPublicResult(result: TResult): unknown;
}
```

All games use the same authoritative pipeline:

1. Authenticate request.
2. Check global and game-specific pause flags.
3. Check responsible-play restrictions.
4. Validate wager and game input.
5. Verify idempotency key.
6. Atomically reserve wager from the player's account subtree.
7. Resolve result on the server.
8. Calculate payout using server configuration.
9. Atomically settle balance and store authoritative bet state.
10. Write denormalized public/user projections.
11. Return outcome, updated balance, fairness data, and bet ID.

## 8. Provably Fair System

### 8.1 Seed lifecycle

For every fairness epoch or round:

1. Backend generates a cryptographically random 32-byte `serverSeed`.
2. Backend computes `serverSeedHash = SHA256(serverSeed)`.
3. The hash is published before bets are accepted.
4. The plaintext seed remains server-only.
5. Each player provides or receives a `clientSeed`.
6. A nonce increments for each user/game combination.
7. Outcome bytes are derived using HMAC-SHA256.
8. When the epoch rotates, the old server seed is revealed.
9. A verification endpoint recomputes historical results.

Suggested message:

```text
HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${gameId}`)
```

### 8.2 Fairness records

Public record:

- `epochId`
- `serverSeedHash`
- `startedAt`
- `endedAt`
- `revealedServerSeed` after rotation
- `status`

Server-only record:

- encrypted/plain server seed in protected storage
- key version
- creation metadata

### 8.3 Verification page

Provide a `/fairness` page where a player can paste or select:

- Server seed
- Published hash
- Client seed
- Nonce
- Game ID
- Bet parameters

The page recomputes the result locally and compares it with the stored result.

## 9. Game Scope

### P0: Dice

Implement first because it validates the full architecture.

Inputs:

- wager
- target number
- direction: under/over
- client seed
- idempotency key

Outputs:

- roll
- win/loss
- multiplier
- payout
- fairness values

### P0: Slot-style meme game

Use original symbols and artwork.

Inputs:

- wager
- paylines or fixed simple mode
- client seed
- idempotency key

Outputs:

- reels
- matched pattern
- multiplier
- payout

Use a fixed, versioned paytable stored in server configuration.

### P1: Mines

Endpoints:

- start game
- reveal tile
- cash out
- abandon/expire

Store active state server-side. Never send mine positions before the game ends.

### P1: Bingo room

For a recognizable BingoPlus-style parody:

- Timed lobby round
- Generated 5x5 card
- Server-seed commitment before card sales close
- Deterministic number draw
- Simple line or blackout win rule
- Live number feed through Realtime Database

This is more complex than Dice and Slots, so implement only after the P0 end-to-end flow is stable.

### P2 stretch

- Crash
- jackpot pool
- social chat
- referral codes
- missions and badges
- daily free demo credits

Do not build P2 until wallet, balance, Dice, and deployment work.

## 10. Realtime Database Structure

```text
/public
  /system
    bettingEnabled
    maintenanceMessage
    activeFairnessEpochId
  /games/{gameId}
    name
    enabled
    minBetSats
    maxBetSats
    configVersion
  /fairnessEpochs/{epochId}
    serverSeedHash
    revealedServerSeed
    startedAt
    endedAt
    status
  /recentBets/{betId}
    maskedPlayerName
    gameId
    wagerSats
    payoutSats
    createdAt
  /leaderboards/{period}/{uid}
    displayName
    netWinSats
    wageredSats

/users/{uid}
  displayName
  role
  avatarUrl
  createdAt
  updatedAt
  responsibleGaming
    selfExcludedUntil
    maxBetSats
    dailyLossLimitSats
    sessionReminderMinutes

/walletsPublic/{uid}
  address
  network
  createdAt

/accounts/{uid}
  /balance
    availableSats
    lockedSats
    lifetimeDepositedSats
    lifetimeWithdrawnSats
    lifetimeWageredSats
    lifetimeWonSats
    updatedAt
    version
  /betStates/{betId}
    gameId
    status
    wagerSats
    payoutSats
    createdAt
    settledAt
  /idempotency/{idempotencyKey}
    operation
    resultId
    createdAt
  /fairnessNonces/{gameId}
    value

/userBets/{uid}/{betId}
  gameId
  status
  wagerSats
  payoutSats
  resultSummary
  fairnessEpochId
  clientSeed
  nonce
  createdAt

/userLedger/{uid}/{entryId}
  type
  amountSats
  balanceAfterSats
  referenceType
  referenceId
  createdAt
  previousHash
  entryHash

/privateWallets/{uid}
  encryptedWif
  iv
  authTag
  keyVersion
  createdAt

/serverFairnessSeeds/{epochId}
  encryptedSeed
  iv
  authTag
  keyVersion

/bets/{betId}
  uid
  gameId
  authoritativeInput
  authoritativeResult
  wagerSats
  payoutSats
  fairnessEpochId
  clientSeed
  nonce
  idempotencyKey
  createdAt
  settledAt

/chain/deposits/{txid_vout}
  uid
  address
  satoshis
  txid
  vout
  creditedAt

/chain/withdrawals/{withdrawalId}
  uid
  destination
  amountSats
  feeSats
  status
  txid
  createdAt
  completedAt

/admin/audit/{eventId}
  actorUid
  action
  targetType
  targetId
  metadata
  createdAt
```

## 11. Database Access Rules

Default deny.

### Client-readable

- `/public/**`
- own `/users/{uid}`
- own `/walletsPublic/{uid}`
- own `/accounts/{uid}/balance`
- own `/userBets/{uid}`
- own `/userLedger/{uid}`
- own withdrawal summaries

### Client-writable

Prefer no direct client writes for the MVP.

Optionally permit carefully validated writes only for:

- own display-name update
- own client seed
- own non-sensitive preferences

### Server-only

- `/privateWallets/**`
- `/serverFairnessSeeds/**`
- `/bets/**`
- `/chain/**`
- `/admin/**`
- all balances and settlement fields

Add `.indexOn` rules for query fields such as:

- `createdAt`
- `status`
- `gameId`
- `uid`
- `payoutSats`

## 12. Backend API

### Authentication

- `POST /api/v1/auth/bootstrap`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh-role`

### Profile

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `POST /api/v1/profile/self-exclude`
- `POST /api/v1/profile/play-limits`

### Wallet

- `GET /api/v1/wallet`
- `POST /api/v1/wallet/sync-deposits`
- `GET /api/v1/wallet/ledger`
- `POST /api/v1/wallet/withdrawals`
- `GET /api/v1/wallet/withdrawals/:id`

### Games

- `GET /api/v1/games`
- `GET /api/v1/games/:gameId`
- `POST /api/v1/games/dice/play`
- `POST /api/v1/games/slots/play`
- `POST /api/v1/games/mines/start`
- `POST /api/v1/games/mines/:sessionId/reveal`
- `POST /api/v1/games/mines/:sessionId/cashout`

### Bingo

- `GET /api/v1/bingo/round/current`
- `POST /api/v1/bingo/round/join`
- `GET /api/v1/bingo/round/:roundId/card`
- `GET /api/v1/bingo/round/:roundId/result`

### Fairness

- `GET /api/v1/fairness/current`
- `GET /api/v1/fairness/epochs/:epochId`
- `POST /api/v1/fairness/verify`

### Admin

- `GET /api/v1/admin/dashboard`
- `POST /api/v1/admin/system/pause`
- `POST /api/v1/admin/games/:gameId/toggle`
- `POST /api/v1/admin/fairness/rotate`
- `GET /api/v1/admin/withdrawals`
- `POST /api/v1/admin/withdrawals/:id/retry`
- `GET /api/v1/admin/audit`

## 13. Backend Modules

```text
backend/src
  /auth
    firebase-admin.ts
    require-auth.ts
    require-admin.ts
  /config
    env.ts
    game-config.ts
  /security
    encryption.ts
    hashing.ts
    idempotency.ts
    rate-limit.ts
  /repositories
    user.repository.ts
    account.repository.ts
    wallet.repository.ts
    bet.repository.ts
    ledger.repository.ts
    chain.repository.ts
  /services
    account-bootstrap.service.ts
    wallet.service.ts
    deposit-scanner.service.ts
    withdrawal.service.ts
    balance.service.ts
    fairness.service.ts
    bet-engine.service.ts
    leaderboard.service.ts
    audit.service.ts
  /games
    game-adapter.ts
    dice.game.ts
    slots.game.ts
    mines.game.ts
    bingo.game.ts
  /blockchain
    provider.ts
    addresses.ts
    transaction.service.ts
    treasury.service.ts
  /http
    app.ts
    error-handler.ts
    routes/
  /jobs
    deposit-scanner.job.ts
    round-rotation.job.ts
    stale-game-cleanup.job.ts
```

## 14. React Frontend Structure

```text
frontend/src
  /app
    App.tsx
    router.tsx
    providers.tsx
    query-client.ts
  /components
    /common
    /layout
    /feedback
  /features
    /auth
      api.ts
      auth.store.ts
      auth.schemas.ts
      RequireAuth.tsx
      GuestOnly.tsx
      RequireAdmin.tsx
    /wallet
    /games
      /dice
      /slots
      /mines
      /bingo
    /fairness
    /admin
  /hooks
    useFirebaseAuth.ts
    useRealtimeValue.ts
    useAuthenticatedApi.ts
  /lib
    firebase.ts
    api-client.ts
    query-keys.ts
    format-satoshis.ts
  /pages
  /stores
    auth.store.ts
    ui.store.ts
  /types
  main.tsx
```

Use feature-based modules so the hackathon team can remove or add games without disturbing authentication, wallet, or fairness code.

`providers.tsx` should compose:

- React Router
- TanStack Query provider
- Firebase authentication listener
- Toast/notification provider
- Error boundary

Avoid putting the entire application into one global context because every realtime balance or game update could trigger unnecessary rerenders.

## 15. Frontend Pages

### Public

- Landing page
- Login
- Register
- Forgot password
- Demo-only/legal notice
- Provably fair explainer

### Authenticated player

- Lobby
- Dice
- Slots
- Mines
- Bingo room
- Wallet
- Deposit modal
- Withdrawal modal
- Bet history
- Ledger history
- Fairness verifier
- Profile and play limits

### Administrator

- Overview dashboard
- Live bets
- Users
- Deposits
- Withdrawals
- Game configuration
- Fairness seed rotation
- System pause control
- Audit log

## 16. Frontend State and Data Management

Use Zustand only for lightweight client state that must survive across unrelated components. Use TanStack Query for backend API data, mutation state, retries, cache invalidation, and request deduplication. Use direct Firebase listeners for live Realtime Database projections and unsubscribe during cleanup.

### Zustand `authStore`

- Firebase user summary
- profile
- role
- authentication restoration status
- account-bootstrap status
- login/register/logout actions

Do not store Firebase ID tokens permanently. Retrieve a current token before protected API calls.

### Zustand `uiStore`

- modal state
- selected game
- sidebar/mobile-navigation state
- non-authoritative interface preferences

### TanStack Query resources

- wallet and balances
- ledger and withdrawal history
- game catalogue and configuration
- bet history
- fairness epochs and verification results
- administrator dashboard data

### Game-specific React state

Keep short-lived game interaction state close to each feature using hooks or reducers:

- `useDiceGame`
- `useSlotsGame`
- `useMinesSession`
- `useBingoRound`

Authoritative game state must always come from the backend response or trusted realtime projection, never only from local React state.

## 17. Atomic Balance and Idempotency Strategy

Use Firebase transactions on `/accounts/{uid}` for operations that change a balance.

### Bet reservation transaction

Validate inside transaction:

- account exists
- not self-excluded
- sufficient available balance
- idempotency key unused
- wager within account and game limits

Then:

- subtract wager from available
- add wager to locked
- create pending bet state
- reserve idempotency key
- increment fairness nonce

### Bet settlement transaction

Validate pending bet exists and is unsettled.

Then:

- subtract wager from locked
- add payout to available
- update lifetime totals
- mark bet settled

This protects against double clicks and concurrent requests.

## 18. Security Requirements

P0:

- Firebase ID-token verification on every protected endpoint
- default-deny Realtime Database rules
- server-only balance writes
- AES-256-GCM WIF encryption
- input validation with Zod or equivalent
- idempotency keys for bets, withdrawals, and deposit credits
- CORS allowlist
- HTTP security headers
- request rate limiting
- maximum body size
- no secrets in logs
- sanitized error responses
- global betting pause

P1:

- Firebase App Check
- IP/device abuse scoring
- login and betting cooldowns
- withdrawal velocity limits
- suspicious-event audit records
- seed rotation and verification tooling

## 19. Environment Variables

### Frontend

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_CHECK_SITE_KEY=
```

### Backend

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_URL=

BCH_NETWORK=chipnet
EXPLORER_ADDRESS_BASE=https://chipnet.bchexplorer.info/address/
EXPLORER_TX_BASE=https://chipnet.bchexplorer.info/tx/

WALLET_ENCRYPTION_KEY=
WALLET_ENCRYPTION_KEY_VERSION=1
HOUSE_WIF=

DEMO_STARTING_SATS=50000
MIN_BET_SATS=100
MAX_BET_SATS=5000
DEFAULT_HOUSE_EDGE_BPS=200
MIN_WITHDRAWAL_SATS=1000
DEFAULT_TX_FEE_SATS=1000
DEPOSIT_SCAN_ENABLED=true
```

Do not place service-account credentials, WIFs, or encryption keys in the frontend environment.

## 20. Scripts

Replace the current wallet-generating `.env` script as the primary setup method.

Keep or add:

- `npm run firebase:emulators`
- `npm run seed:admin`
- `npm run seed:demo`
- `npm run generate:house-wallet`
- `npm run compile:contract`
- `npm run test:unit`
- `npm run test:integration`
- `npm run typecheck`
- `npm run lint`

`generate-env.ts` may still generate a Chipnet house wallet for local development, but registered user wallets must be created dynamically by `account-bootstrap.service.ts`.

## 21. Implementation Phases

### Phase 0 — Repository preparation

- Preserve the existing CashScript demo in a branch.
- Rename project metadata.
- Add React Router, Zustand, TanStack Query, React Hook Form, Firebase SDK, Firebase Admin, validation, security, and test dependencies.
- Create `.env.example` files.
- Add Firebase emulator configuration.
- Confirm both projects build before feature work.

Exit criteria: the React frontend and backend start with no TypeScript errors, React Router loads protected routes correctly, and the Firebase auth-restoration loading state prevents redirect flicker.

### Phase 1 — Authentication boilerplate

- Firebase project initialization.
- Register, login, logout, reset password.
- Auth store and session restoration.
- Protected and guest routes.
- Firebase Admin token verification.
- Idempotent `/auth/bootstrap`.
- Profile creation.
- Dynamic Chipnet wallet creation.
- Encrypted WIF storage.

Exit criteria: a new user registers once, refreshes, logs out, logs back in, and retains the same wallet address.

### Phase 2 — Balance and wallet UI

- Account balance record.
- Wallet page.
- Copy address and QR code.
- Explorer button.
- Deposit sync endpoint.
- Duplicate UTXO protection.
- Realtime balance listener.
- Ledger display.

Exit criteria: faucet funds sent to a user's address are detected and credited exactly once.

### Phase 3 — Provably fair core

- Seed generation.
- Hash commitment publication.
- User client seed.
- Nonce management.
- HMAC result derivation.
- Seed rotation.
- Verification endpoint/page.

Exit criteria: a revealed seed reproduces an old test result exactly.

### Phase 4 — Dice end-to-end

- Dice UI.
- Bet validation.
- Atomic wager reservation.
- Server-side outcome.
- Atomic settlement.
- Bet history.
- Recent public bets.
- Idempotent double-click handling.

Exit criteria: concurrent requests cannot produce a negative balance or settle one wager twice.

### Phase 5 — Slot game and lobby polish

- Original symbols.
- Versioned paytable.
- Animated reels.
- Shared bet controls.
- Game cards and categories.
- Mobile responsive layout.

Exit criteria: both Dice and Slots share the same balance, ledger, fairness, and history systems.

### Phase 6 — Withdrawal demonstration

- Destination validation.
- Locked withdrawal balance.
- Chipnet broadcast.
- Success/refund handling.
- Explorer link.

Exit criteria: a player can receive test BCH at another Chipnet address and the internal balance updates exactly once.

### Phase 7 — Admin and safety controls

- Seed admin account.
- Admin custom claim.
- Global pause.
- Game toggles.
- withdrawal queue.
- Audit log.
- Self-exclusion and limit controls.

Exit criteria: a normal player cannot call admin endpoints or modify rules through the client.

### Phase 8 — Bingo or Mines

Choose one, not both, until everything above is stable.

Exit criteria: the selected game uses the shared wallet, balance, ledger, and fairness architecture.

### Phase 9 — Blockchain showcase

Implement only after the complete demo flow works:

- CashScript treasury or jackpot vault.
- Hash anchor transaction.
- Public blockchain audit page.

Exit criteria: judges can inspect at least one meaningful contract or audit transaction in the Chipnet explorer.

## 22. Testing Plan

### Unit tests

- WIF encryption/decryption
- address validation
- payout calculations
- HMAC deterministic output
- seed hash verification
- paytable calculations
- responsible-play limit checks
- canonical ledger hashing

### Integration tests

- token verification
- bootstrap idempotency
- duplicate wallet prevention
- concurrent bet requests
- insufficient balance
- duplicate idempotency key
- duplicate deposit UTXO
- withdrawal broadcast failure and refund
- administrator authorization

### End-to-end tests

1. Register.
2. Receive persistent wallet address.
3. Fund with Chipnet faucet.
4. Sync deposit.
5. Play Dice.
6. Verify the bet.
7. View ledger.
8. Withdraw test sats.
9. Open explorer transaction.
10. Log out and log back in without losing state.

## 23. 24-Hour Priority Order

### Must work

1. Register/login/session restoration.
2. Persistent per-user wallet.
3. Firebase balance and ledger.
4. Deposit sync.
5. Provably fair Dice.
6. One test withdrawal.
7. Explorer links.
8. Mobile-friendly lobby.

### Should work

1. Slots.
2. Admin pause and game toggle.
3. Bet history.
4. Fairness verification page.
5. Recent bets and leaderboard.

### Stretch

1. Bingo or Mines.
2. CashScript treasury.
3. On-chain audit anchoring.
4. Chat, missions, referrals, and animations.

## 24. Demo Script

1. Register a new player.
2. Show that the app automatically creates a Chipnet address.
3. Copy the address and fund it from the faucet.
4. Press Sync Deposit and show realtime balance credit.
5. Open Dice and show the precommitted server-seed hash.
6. Place a bet.
7. Show the result, balance update, ledger entry, and nonce.
8. Rotate/reveal the seed and verify the result.
9. Request a small Chipnet withdrawal.
10. Open the transaction in the explorer.
11. Show the admin dashboard and emergency pause.
12. Explain that blockchain handles custody/audit while realtime game execution remains fast off-chain.

## 25. Acceptance Criteria

The hackathon build is complete when:

- Registration and login are seamless.
- A user never receives multiple wallets from retries.
- Sessions survive refresh.
- All protected backend endpoints verify Firebase tokens.
- User wallets remain persistent.
- WIFs are never returned to the frontend.
- Faucet deposits are credited exactly once.
- Balances cannot be directly edited by clients.
- At least one game is server-authoritative and provably fair.
- Duplicate bets do not double-charge or double-pay.
- A revealed server seed verifies an earlier result.
- A test withdrawal produces a Chipnet transaction ID.
- The app clearly states Chipnet/test-only status.
- Normal users cannot access administrator operations.
- React frontend and backend pass build/type checks.

## 26. Sole-Agent Instructions for the Coding Agent

You are the sole planning and implementation agent for this repository. Gemini 3.6 Flash should use high thinking for architecture, security-sensitive code, blockchain integration, and debugging; medium thinking is acceptable for routine UI work. You must both plan and implement the system described in this document.

Operating rules:

1. Inspect the existing repository before changing files.
2. Preserve and reuse working address, CashScript, amount, and error utilities where appropriate.
3. Create `TASKS.md` containing file-level tasks mapped to the phases in this plan.
4. Implement one phase at a time.
5. After every phase, run frontend and backend type checks, tests, and builds.
6. Fix all new errors before proceeding.
7. Do not merely scaffold TODO files; implement working vertical slices.
8. Do not expose WIFs, Firebase service-account credentials, encryption keys, or unrevealed server seeds.
9. Never allow clients to directly write balances, outcomes, deposits, withdrawals, authoritative bets, or admin state.
10. Use Firebase transactions and idempotency keys for balance-changing operations.
11. Maintain the existing Chipnet-only restriction.
12. Do not add mainnet support.
13. Do not copy BingoPlus assets or branding; use original parody branding.
14. Prefer the simplest architecture that satisfies the acceptance criteria.
15. Do not implement stretch features until the complete P0 demo flow passes.
16. Update `TASKS.md` after each completed phase with changed files, commands run, results, and unresolved risks.
17. At the end, create `DEMO_RUNBOOK.md` with exact setup, seed, faucet, play, verification, and withdrawal steps.

Begin with repository inspection and Phase 0. Do not rewrite the entire codebase without first identifying reusable modules.
