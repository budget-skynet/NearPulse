import { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { fetchUserBalance } from './services/api';
import Header from './components/Header';
import OverviewScreen from './components/OverviewScreen';
import TransactionsScreen from './components/TransactionsScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import GalleryScreenStable from './components/GalleryScreenStable';
import MarketScreen from './components/MarketScreen';
import LoadingSpinner from './components/LoadingSpinner';
import AiChatWidget from './components/AiChatWidget';

function AppInner() {
  const { tg } = useTelegram();
  const { activeAddress } = useWallet();
  const [currentScreen, setCurrentScreen] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const displayAddress = activeAddress;

  useEffect(() => {
    try {
      tg.ready();
      tg.expand();
    } catch {
      // Not in Telegram environment
    }
  }, []);

  useEffect(() => {
    async function loadBalance() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUserBalance(displayAddress);
        setBalanceData(data);
        setLastUpdated(Date.now());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBalance();
  }, [displayAddress, retryCount]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen bg-primary">
        <Header address={displayAddress} currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
        <div className="p-4 pb-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen bg-primary">
        <Header address={displayAddress} currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
        <div className="p-4 pb-6">
          <div className="glass-card rounded-xl p-4 text-center border-red-500/30">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-primary font-medium mb-1">Ошибка загрузки данных</div>
            <div className="text-secondary text-sm">{error}</div>
            <div className="text-xs text-tertiary mt-2">Сервер мог уснуть — попробуйте ещё раз</div>
            <button
              onClick={() => setRetryCount(c => c + 1)}
              style={{
                marginTop: 14,
                padding: '8px 24px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--accent-gradient)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Повторить
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-primary">
      <Header address={displayAddress} currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      <div className="p-4 pb-24 bg-secondary">
        {currentScreen === 'overview' && (
          <OverviewScreen
            address={displayAddress}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            balanceData={balanceData}
            lastUpdated={lastUpdated}
          />
        )}
        {currentScreen === 'transactions' && <TransactionsScreen address={displayAddress} />}
        {currentScreen === 'analytics' && (
          <AnalyticsScreen
            address={displayAddress}
            selectedPeriod={selectedPeriod}
            balanceData={balanceData}
          />
        )}
        {currentScreen === 'market' && <MarketScreen />}
        {currentScreen === 'gallery' && <GalleryScreenStable address={displayAddress} />}
      </div>

      {/* AI Chat Widget — плавающая кнопка на главном экране */}
      {currentScreen === 'overview' && (
        <AiChatWidget walletContext={balanceData} />
      )}

      <div style={{
        textAlign: 'center',
        padding: '8px 16px 20px',
        fontSize: 10,
        color: 'var(--text-tertiary)',
        opacity: 0.5,
      }}>
        NearPulse — informational purposes only. Not financial advice.
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppInner />
    </WalletProvider>
  );
}
