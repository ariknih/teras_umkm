# Community Feature Roadmap — Phase 6 (not started)

Phases 0–5 of the Community-feature improvement roadmap are complete (money hotfix,
honesty pass, decorative-tab/dead-code cleanup, schema hygiene, real payment
collection via a vendor-agnostic gateway, audit/notification gaps). A full
adversarial re-review pass was also done across all of it, with fixes applied.

Full history/context lives in the plan file this roadmap was written from:
`~/.claude/plans/can-you-do-an-streamed-conway.md` (on this machine).

Phase 6 was explicitly scoped as **deferred, not started, and not to be picked
up without explicit user instruction**. When asked to proceed, start a new
session in this repo and say "continue with Phase 6" (or similar) — this file
is the entry point.

## Phase 6 — Deferred items

- **Real loan disbursement.** `LoanStatus.DISBURSED` is dead code today —
  approved cooperative loans just sit there forever with no wallet credit
  anywhere in the feature.
- **Real SHU auto-transfer to wallet.** Phase 1 already corrected the UI copy
  to stop claiming this happens automatically; this item is building the
  thing for real instead of just not lying about it.
- **Tier billing.** `upgradeCommunityTierAction` is free/instant with no
  `Subscription`/`Invoice` model anywhere in the schema, yet paywalls are
  marketed throughout the UI and unenforced server-side. A cheap interim step
  worth doing sooner than full billing: add the missing server-side
  `coopTier` checks and recompute `disabledModules` on upgrade, so the
  existing free upgrade is at least internally coherent while real billing
  waits.
- **Coin/wallet/kas conceptual unification.** Four different pools
  (`Community.coinBalance`, `User.coinBalance`, `Wallet.balance`,
  `referralBudget`/`communityProfitShare`) are casually called "kas
  komunitas" or "coin" interchangeably in UI copy; `coinBalance` alone
  currently gates both loan eligibility and recruitment-locking, coupling
  unrelated features through one counter.
- **Legacy `CommunityGroup` deprecation.** Confirmed during Phase 3 that the
  `CommunityGroup`/`GroupMember` model tree and its DataStore methods/actions
  are fully live and Prisma-backed, but have zero UI entry points anywhere in
  the app — a complete, working, but entirely orphaned feature. Decide
  whether to build a UI for it or remove it.
- **Unifying the ~5 separate referral/commission systems** (`UserReferral`,
  `MerchantInvite`, the multi-tier cascade the rest of this roadmap centers
  on, the mock-only coin referral removed in Phase 3, and `createOrder`'s
  hardcoded 60/10/10/20 affiliate split). Document the map first; full
  unification is separate, larger work.
- **Carry-over, pre-existing, still unfixed**: `submitKycAction`
  (`src/app/actions/community.ts`) approves KYC from client-supplied URLs
  with only a magic-string check (`ktpUrl`/`selfieUrl` containing
  "fail"/"tolak"/"invalid") and no real verification — flagged in a code
  comment, gates loan applications and KYC-required community joins. Not
  currently wired to any live UI (the real path is `updateKycStatusAction`,
  admin-approval-based), but the insecure function itself is still reachable
  as a server action.

## Also noted during the Phase 1–5 review, not yet acted on

- `DataStore.getCommunityById` (`src/lib/data-store.ts`) silently **creates a
  real Community row** (with an arbitrary existing user auto-assigned as
  ketua) when given an id that matches nothing — a pre-existing landmine
  used in ~13 places across the app. Phase 4's new payment routes were
  patched to use a new side-effect-free `getCommunityByIdStrict` instead, but
  the other call sites still carry this risk. Worth its own dedicated,
  careful pass — not something to rush.
- `withMutationFallback`'s "keep the mock store in sync" shadow-replay could
  theoretically double-pay a real transaction if a mock-seed id ever
  collided with a real DB id. Unlikely, but structurally worth closing for
  money-path functions specifically.
