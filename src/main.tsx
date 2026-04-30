import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createDefaultAuthorizationCache,
  createDefaultChainSelector,
  createDefaultWalletNotFoundHandler,
  registerMwa,
} from '@solana-mobile/wallet-standard-mobile';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { App } from './App';
import './styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(WalletAdapterNetwork.Mainnet);

registerMwa({
  appIdentity: {
    name: 'Rent Closer',
    uri: window.location.origin,
    icon: '/icons/icon.svg',
  },
  authorizationCache: createDefaultAuthorizationCache(),
  chains: ['solana:mainnet'],
  chainSelector: createDefaultChainSelector(),
  onWalletNotFound: createDefaultWalletNotFoundHandler(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);
