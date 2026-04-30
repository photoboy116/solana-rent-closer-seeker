# Rent Closer

Rent Closer is a Solana Mobile friendly dApp for closing empty SPL Token and Token-2022 accounts to reclaim rent.

## Features

- Connects to Solana Mobile wallets through Mobile Wallet Adapter.
- Scans the connected wallet for empty token accounts on mainnet.
- Selects closable accounts and batches close-account instructions.
- Sends signed transactions through the connected wallet.
- Ships as a PWA so it can be wrapped into an Android APK for the Solana Mobile dApp Store.

## Development

```bash
npm install
npm run dev
```

Optional RPC override:

```bash
VITE_SOLANA_RPC_URL=https://your-mainnet-rpc.example npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## dApp Store route

For Seeker dApp Store submission, deploy the built PWA to an HTTPS domain, wrap it with Bubblewrap as a Trusted Web Activity, sign the release APK with your release key, then submit the APK through the Solana Mobile Publisher Portal.

See [docs/SEEKER_SUBMISSION.md](docs/SEEKER_SUBMISSION.md).
