import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useWallet } from '../contexts/WalletContext';

const THEME_GLOW = {
  ocean:   'rgba(0, 102, 255, 0.3)',
  purple:  'rgba(123, 47, 190, 0.35)',
  emerald: 'rgba(0, 176, 155, 0.25)',
};

const TABS = [
  { key: 'overview',      label: 'Обзор',       icon: '⊙' },
  { key: 'transactions',  label: 'Транзакции',   icon: '↕' },
  { key: 'analytics',     label: 'Аналитика',    icon: '📊' },
  { key: 'market',        label: 'Рынок',        icon: '📈' },
  { key: 'gallery',       label: 'NFT',          icon: '🖼' },
];

function shorten(addr) {
  if (!addr) return '';
  if (addr.length <= 20) return addr;
  return addr.slice(0, 8) + '…' + addr.slice(-6);
}

function WalletModal({ onClose }) {
  const { wallets, activeIndex, setActiveWallet, addWallet, removeWallet } = useWallet();
  const [input, setInput] = useState('');
  const [inputName, setInputName] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (addMode) inputRef.current?.focus();
  }, [addMode]);

  function handleAdd() {
    const addr = input.trim();
    if (!addr) { setErr('Введи адрес'); return; }
    if (wallets.some(w => w.address === addr)) { setErr('Уже добавлен'); return; }
    addWallet(addr, inputName.trim());
    setInput('');
    setInputName('');
    setAddMode(false);
    setErr('');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 51,
        background: 'var(--bg-card)',
        borderRadius: '20px 20px 0 0',
        border: '1px solid var(--border-primary)',
        padding: '16px 16px 32px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border-primary)',
          margin: '0 auto 16px',
        }} />

        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 14 }}>
          Мои кошельки
        </div>

        {/* Wallet list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {wallets.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
              Нет добавленных кошельков
            </div>
          )}
          {wallets.map((w, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={w.address}
                onClick={() => { setActiveWallet(i); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: active ? 'var(--bg-card-hover)' : 'transparent',
                  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, flexShrink: 0,
                }}>◎</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {w.name && (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {w.name}
                    </div>
                  )}
                  <div style={{
                    fontSize: 12,
                    color: w.name ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {w.address}
                  </div>
                </div>

                {active && (
                  <span style={{ fontSize: 11, color: 'var(--color-positive)' }}>●</span>
                )}

                {wallets.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); removeWallet(i); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 16, color: 'var(--text-tertiary)',
                      padding: '2px 4px', lineHeight: 1, flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add wallet section */}
        {addMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); setErr(''); }}
              placeholder="NEAR адрес (напр. alice.near)"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${err ? 'var(--color-negative)' : 'var(--border-primary)'}`,
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <input
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              placeholder="Имя (необязательно)"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            {err && <div style={{ fontSize: 12, color: 'var(--color-negative)' }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1, padding: '10px 0',
                  background: 'var(--accent-gradient)', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Добавить
              </button>
              <button
                onClick={() => { setAddMode(false); setErr(''); setInput(''); setInputName(''); }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 10, fontSize: 13,
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddMode(true)}
            style={{
              width: '100%', padding: '10px 0',
              background: 'transparent',
              border: '1px dashed var(--border-primary)',
              borderRadius: 12, fontSize: 13,
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-main)',
            }}
          >
            + Добавить кошелёк
          </button>
        )}
      </div>
    </>
  );
}

export default function Header({ address, currentScreen, onScreenChange }) {
  const { theme } = useTheme();
  const { wallets, activeIndex } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const activeWallet = wallets[activeIndex];
  const displayLabel = activeWallet?.name
    ? activeWallet.name
    : shorten(address);

  return (
    <>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 300,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${THEME_GLOW[theme] || THEME_GLOW.ocean} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Top row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          position: 'relative',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
              color: '#fff',
              flexShrink: 0,
            }}>NP</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                NearPulse
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.03em' }}>
                Wallet Intelligence
              </div>
            </div>
          </div>

          {/* Theme switcher */}
          <ThemeSwitcher />
        </div>

        {/* Wallet address pill — clickable */}
        {address && (
          <div style={{ padding: '0 16px 10px' }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 100,
                padding: '5px 12px 5px 8px',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                fontFamily: 'var(--font-main)',
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
              }}>◎</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                {displayLabel}
              </span>
              {wallets.length > 1 && (
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {activeIndex + 1}/{wallets.length}
                </span>
              )}
              <span style={{ fontSize: 11, color: 'var(--color-positive)' }}>●</span>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderTop: '1px solid var(--border-primary)',
        }}>
          {TABS.map(tab => {
            const active = currentScreen === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onScreenChange(tab.key)}
                style={{
                  flex: 1,
                  padding: '10px 4px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text-accent)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-main)',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
                {active && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '20%',
                    right: '20%',
                    height: 2,
                    borderRadius: 2,
                    background: 'var(--accent-gradient)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {modalOpen && <WalletModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
