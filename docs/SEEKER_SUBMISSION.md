# Solana Seeker dApp Store Submission

This project follows the web dApp route: PWA first, then Android APK through Bubblewrap/TWA.

## Build checklist

1. Deploy the app to an HTTPS domain.
2. Confirm `/manifest.webmanifest` loads from the deployed domain.
3. Install Bubblewrap:

```bash
npm i -g @bubblewrap/cli
```

4. Initialize the TWA project:

```bash
bubblewrap init --manifest https://YOUR_DOMAIN/manifest.webmanifest
```

5. Build a release APK:

```bash
bubblewrap build
```

6. Publish the generated `assetlinks.json` on your domain at:

```text
https://YOUR_DOMAIN/.well-known/assetlinks.json
```

7. Install and test the APK on Android or a Seeker device.
8. Upload the release-ready signed APK in the Publisher Portal.

## Publisher Portal checklist

- Publisher account at `https://publish.solanamobile.com/`
- KYC/KYB completed
- Publisher wallet connected and backed up
- About `0.2 SOL` available for publishing fees/storage transactions
- dApp name: `Rent Closer`
- Short description: `Close empty Solana token accounts and reclaim rent.`
- Category: finance or utilities, depending on available Portal categories
- Icon: `public/icons/icon.svg` or exported PNG variants
- Screenshots from mobile viewport
- Release APK signed with release key

## Important notes

- Submit an APK, not source code and not only a website URL.
- Do not lose the publisher wallet. It is required for future app updates.
- The app uses mainnet by default because rent reclaiming is a real mainnet operation.
- Test with a small wallet first before submitting for review.
