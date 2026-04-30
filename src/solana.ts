import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createCloseAccountInstruction,
} from '@solana/spl-token';
import {
  Connection,
  ParsedAccountData,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export type ClosableTokenAccount = {
  address: PublicKey;
  mint: string;
  programId: PublicKey;
  lamports: number;
  tokenAmount: string;
  decimals: number;
  isNative: boolean;
};

export type CloseBuildResult = {
  transactions: Transaction[];
  accountCount: number;
  reclaimableLamports: number;
};

export const TOKEN_PROGRAM_LABELS = new Map([
  [TOKEN_PROGRAM_ID.toBase58(), 'SPL Token'],
  [TOKEN_2022_PROGRAM_ID.toBase58(), 'Token-2022'],
]);

const MAX_CLOSES_PER_TRANSACTION = 8;

export function formatSol(lamports: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(lamports / 1_000_000_000);
}

export async function getClosableTokenAccounts(
  connection: Connection,
  owner: PublicKey
): Promise<ClosableTokenAccount[]> {
  const accounts = await Promise.all([
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
  ]);

  return accounts
    .flatMap((result, index) => {
      const programId = index === 0 ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

      return result.value.map(({ pubkey, account }) => {
        const data = account.data as ParsedAccountData;
        const info = data.parsed.info;
        const amount = info.tokenAmount?.amount ?? '0';

        return {
          address: pubkey,
          mint: info.mint as string,
          programId,
          lamports: account.lamports,
          tokenAmount: amount,
          decimals: Number(info.tokenAmount?.decimals ?? 0),
          isNative: Boolean(info.isNative),
        };
      });
    })
    .filter((account) => account.tokenAmount === '0' && !account.isNative && account.lamports > 0)
    .sort((a, b) => b.lamports - a.lamports);
}

export async function buildCloseTransactions(
  connection: Connection,
  owner: PublicKey,
  accounts: ClosableTokenAccount[]
): Promise<CloseBuildResult> {
  const transactions: Transaction[] = [];
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  for (let i = 0; i < accounts.length; i += MAX_CLOSES_PER_TRANSACTION) {
    const batch = accounts.slice(i, i + MAX_CLOSES_PER_TRANSACTION);
    const instructions: TransactionInstruction[] = batch.map((account) =>
      createCloseAccountInstruction(
        account.address,
        owner,
        owner,
        [],
        account.programId
      )
    );

    const transaction = new Transaction({
      feePayer: owner,
      blockhash,
      lastValidBlockHeight,
    }).add(...instructions);

    transactions.push(transaction);
  }

  return {
    transactions,
    accountCount: accounts.length,
    reclaimableLamports: accounts.reduce((total, account) => total + account.lamports, 0),
  };
}
