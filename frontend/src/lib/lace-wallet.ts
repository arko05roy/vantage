import '@midnight-ntwrk/dapp-connector-api';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export const LACE_NETWORK_ID = 'preprod';
export const LACE_INSTALL_URL =
  'https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk';

export interface LaceConnection {
  api: ConnectedAPI;
  walletName: string;
  apiVersion: string;
  shieldedAddress: string;
  unshieldedAddress: string | null;
  dustAddress: string | null;
  networkId: string;
}

export const getLaceApi = (): InitialAPI | null =>
  typeof window !== 'undefined' ? window.midnight?.mnLace ?? null : null;

export const isLaceInstalled = (): boolean => getLaceApi() !== null;

const safe = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

/** Prompts Lace for authorization and returns the live connection. */
export async function connectLaceWallet(): Promise<LaceConnection> {
  const wallet = getLaceApi();
  if (!wallet) {
    throw new Error('Lace wallet not detected');
  }
  const api = await wallet.connect(LACE_NETWORK_ID);

  const [shielded, unshielded, dust, status] = await Promise.all([
    api.getShieldedAddresses(),
    safe(() => api.getUnshieldedAddress()),
    safe(() => api.getDustAddress()),
    safe(() => api.getConnectionStatus()),
  ]);

  return {
    api,
    walletName: wallet.name ?? 'Lace',
    apiVersion: wallet.apiVersion ?? '',
    shieldedAddress: shielded.shieldedAddress,
    unshieldedAddress: unshielded?.unshieldedAddress ?? null,
    dustAddress: dust?.dustAddress ?? null,
    networkId: status?.status === 'connected' ? status.networkId : LACE_NETWORK_ID,
  };
}
