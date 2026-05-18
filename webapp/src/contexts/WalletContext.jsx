import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTelegram } from '../hooks/useTelegram';

const WALLETS_KEY = 'nearpulse_wallets';
const ACTIVE_KEY  = 'nearpulse_active_wallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { address: tgAddress } = useTelegram();

  const [wallets, setWallets] = useState(() => {
    try {
      const raw = localStorage.getItem(WALLETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [];
  });

  const [activeIndex, setActiveIndex] = useState(() => {
    const v = parseInt(localStorage.getItem(ACTIVE_KEY) ?? '0', 10);
    return isNaN(v) ? 0 : v;
  });

  // Seed initial wallet from Telegram startParam once
  useEffect(() => {
    if (!tgAddress) return;
    setWallets(prev => {
      if (prev.some(w => w.address === tgAddress)) return prev;
      return [{ address: tgAddress, name: '', addedAt: Date.now() }, ...prev];
    });
  }, [tgAddress]);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, String(activeIndex));
  }, [activeIndex]);

  const safeIndex = Math.min(activeIndex, Math.max(wallets.length - 1, 0));
  const activeAddress = wallets[safeIndex]?.address || tgAddress || 'root.near';

  const addWallet = useCallback((address, name = '') => {
    if (!address) return;
    setWallets(prev => {
      if (prev.some(w => w.address === address)) return prev;
      const next = [...prev, { address, name, addedAt: Date.now() }];
      setActiveIndex(next.length - 1);
      return next;
    });
  }, []);

  const removeWallet = useCallback((index) => {
    setWallets(prev => {
      const next = prev.filter((_, i) => i !== index);
      setActiveIndex(ai => {
        if (ai >= next.length) return Math.max(next.length - 1, 0);
        if (ai > index) return ai - 1;
        return ai;
      });
      return next;
    });
  }, []);

  const renameWallet = useCallback((index, name) => {
    setWallets(prev => prev.map((w, i) => i === index ? { ...w, name } : w));
  }, []);

  return (
    <WalletContext.Provider value={{
      wallets,
      activeIndex: safeIndex,
      activeAddress,
      setActiveWallet: setActiveIndex,
      addWallet,
      removeWallet,
      renameWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
