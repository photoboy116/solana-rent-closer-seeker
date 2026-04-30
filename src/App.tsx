import { useMemo, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SendTransactionError } from '@solana/web3.js';
import {
  ClosableTokenAccount,
  buildCloseTransactions,
  formatSol,
  getClosableTokenAccounts,
  TOKEN_PROGRAM_LABELS,
} from './solana';

type Status = 'idle' | 'scanning' | 'closing' | 'done' | 'error';

export function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [accounts, setAccounts] = useState<ClosableTokenAccount[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Connect your wallet to scan empty token accounts.');
  const [lastSignatures, setLastSignatures] = useState<string[]>([]);

  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selected.has(account.address.toBase58())),
    [accounts, selected]
  );

  const selectedRent = selectedAccounts.reduce((total, account) => total + account.lamports, 0);
  const allSelected = accounts.length > 0 && selected.size === accounts.length;
  const busy = status === 'scanning' || status === 'closing';

  async function scan() {
    if (!wallet.publicKey) {
      setMessage('Connect a Solana wallet first.');
      return;
    }

    setStatus('scanning');
    setLastSignatures([]);
    setMessage('Scanning token accounts on Solana mainnet...');

    try {
      const closableAccounts = await getClosableTokenAccounts(connection, wallet.publicKey);
      setAccounts(closableAccounts);
      setSelected(new Set(closableAccounts.map((account) => account.address.toBase58())));
      setStatus('idle');
      setMessage(
        closableAccounts.length
          ? `Found ${closableAccounts.length} empty token accounts.`
          : 'No empty token accounts found.'
      );
    } catch (error) {
      setStatus('error');
      setMessage(readError(error));
    }
  }

  async function closeSelected() {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      setMessage('Connect a wallet that can sign transactions.');
      return;
    }

    if (selectedAccounts.length === 0) {
      setMessage('Select at least one account to close.');
      return;
    }

    setStatus('closing');
    setMessage('Preparing close account transactions...');
    setLastSignatures([]);

    try {
      const build = await buildCloseTransactions(connection, wallet.publicKey, selectedAccounts);
      const signatures: string[] = [];

      for (let i = 0; i < build.transactions.length; i += 1) {
        setMessage(`Requesting signature ${i + 1} of ${build.transactions.length}...`);
        const signature = await wallet.sendTransaction(build.transactions[i], connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
        signatures.push(signature);
        setMessage(`Confirming transaction ${i + 1} of ${build.transactions.length}...`);
        await connection.confirmTransaction(signature, 'confirmed');
      }

      setLastSignatures(signatures);
      setStatus('done');
      setMessage(`Closed ${build.accountCount} accounts and reclaimed about ${formatSol(build.reclaimableLamports)} SOL.`);
      setAccounts((current) =>
        current.filter((account) => !selected.has(account.address.toBase58()))
      );
      setSelected(new Set());
    } catch (error) {
      setStatus('error');
      setMessage(readError(error));
    }
  }

  function toggleAccount(address: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(address)) {
        next.delete(address);
      } else {
        next.add(address);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(accounts.map((account) => account.address.toBase58())));
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Solana Seeker dApp</p>
          <h1>Rent Closer</h1>
        </div>
        <WalletMultiButton />
      </section>

      <section className="summary" aria-live="polite">
        <div>
          <span className="label">Closable accounts</span>
          <strong>{accounts.length}</strong>
        </div>
        <div>
          <span className="label">Selected</span>
          <strong>{selectedAccounts.length}</strong>
        </div>
        <div>
          <span className="label">Estimated rent</span>
          <strong>{formatSol(selectedRent)} SOL</strong>
        </div>
      </section>

      <section className="actions">
        <button className="secondary" onClick={scan} disabled={!wallet.connected || busy}>
          {status === 'scanning' ? 'Scanning...' : 'Scan'}
        </button>
        <button className="primary" onClick={closeSelected} disabled={!wallet.connected || selectedAccounts.length === 0 || busy}>
          {status === 'closing' ? 'Closing...' : 'Close selected'}
        </button>
      </section>

      <p className={`message ${status}`}>{message}</p>

      {accounts.length > 0 && (
        <section className="accounts">
          <div className="accounts-header">
            <h2>Empty token accounts</h2>
            <button className="text-button" onClick={toggleAll}>
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          </div>

          <div className="account-list">
            {accounts.map((account) => {
              const address = account.address.toBase58();
              return (
                <label className="account-row" key={address}>
                  <input
                    type="checkbox"
                    checked={selected.has(address)}
                    onChange={() => toggleAccount(address)}
                  />
                  <span>
                    <strong>{shorten(address)}</strong>
                    <small>{shorten(account.mint)} · {TOKEN_PROGRAM_LABELS.get(account.programId.toBase58()) ?? 'Token'}</small>
                  </span>
                  <em>{formatSol(account.lamports)} SOL</em>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {lastSignatures.length > 0 && (
        <section className="receipts">
          <h2>Transactions</h2>
          {lastSignatures.map((signature) => (
            <a
              key={signature}
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noreferrer"
            >
              {shorten(signature)}
            </a>
          ))}
        </section>
      )}
    </main>
  );
}

function shorten(value: string) {
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function readError(error: unknown) {
  if (error instanceof SendTransactionError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong.';
}
