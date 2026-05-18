import { useState, useRef, useEffect } from 'react';
import { fetchAnalytics, sendAiMessage } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const ANALYST_PROMPTS = [
  'Оцени мою активность в DeFi',
  'Сколько я трачу на газ?',
  'Как оптимизировать мои транзакции?',
  'Какие протоколы использую чаще всего?',
];

function AiAnalystPanel({ analyticsData, walletContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (expanded && messages.length === 0) {
      // Первое сообщение — автоматический анализ
      const autoMsg = {
        role: 'user',
        content: `Проанализируй мою активность на основе данных:\n- Всего транзакций: ${analyticsData?.totalTxs || 0}\n- Gas потрачено: ${analyticsData?.gasSpent?.toFixed(4) || 0} NEAR ($${analyticsData?.gasUSD || 0})\n- Самый активный протокол: ${analyticsData?.mostActive || 'N/A'}`,
      };
      setMessages([autoMsg]);
      handleSend(autoMsg.content, []);
    }
  }, [expanded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text, history) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const newHistory = history ?? messages.map((m) => ({ role: m.role, content: m.content }));
    if (!history) {
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
    }
    setLoading(true);

    try {
      // Объединяем контекст аналитики с контекстом кошелька
      const enrichedContext = {
        ...walletContext,
        analyticsData: analyticsData
          ? {
              totalTxs: analyticsData.totalTxs,
              gasSpent: analyticsData.gasSpent,
              gasUSD: analyticsData.gasUSD,
              mostActive: analyticsData.mostActive,
              breakdown: analyticsData.breakdown,
            }
          : null,
      };
      const { reply } = await sendAiMessage(trimmed, newHistory, enrichedContext);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Ошибка соединения с AI. Попробуй позже.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            🤖
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">AI Аналитик</div>
            <div className="text-xs text-gray-500">Персональные инсайты по транзакциям</div>
          </div>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform"
          style={{
            background: '#f5f3ff',
            color: '#6366f1',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* Chat Body */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          {/* Quick prompts */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pt-3 pb-2 flex flex-wrap gap-2">
              {ANALYST_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="px-3 py-1 rounded-lg text-xs font-medium border active:scale-95 transition-all"
                  style={{ background: '#f5f3ff', color: '#6366f1', borderColor: '#e0d9ff' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="px-4 pb-2 space-y-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 mr-2 flex items-center justify-center text-xs mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                    🤖
                  </div>
                )}
                <div
                  className="max-w-[82%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === 'user'
                      ? { background: '#6366f1', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#f5f5f5', color: '#1a1a1a', borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>🤖</div>
                <div className="px-3 py-2 rounded-xl bg-gray-100">
                  <span className="inline-flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 flex gap-2" style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Задай вопрос по аналитике..."
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#f5f5f5', border: '1.5px solid #e8e8e8', color: '#1a1a1a' }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#e8e8e8')}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AnalyticsScreen ───────────────────────────────────────────────────────
export default function AnalyticsScreen({ address, selectedPeriod, balanceData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const displayAddress = address || 'root.near';

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const analytics = await fetchAnalytics(displayAddress, selectedPeriod);
        setData(analytics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [displayAddress, selectedPeriod, retryCount]);

  const categoryLabels = {
    gaming: '🎮 Gaming',
    defi: '💰 DeFi',
    transfers: '📤 Переводы',
    nft: '🎨 NFT',
    other: '📝 Прочее',
  };

  if (loading) return <div className="space-y-4"><LoadingSpinner /></div>;

  if (error) {
    return (
      <div className="space-y-4">
        <div className="glass-card rounded-xl p-4 text-center border-red-500/30">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-primary font-medium mb-1">Ошибка загрузки аналитики</div>
          <div className="text-secondary text-sm">{error}</div>
          <button
            onClick={() => setRetryCount(c => c + 1)}
            style={{
              marginTop: 14, padding: '8px 24px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--accent-gradient)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
            }}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.totalTxs === 0) {
    return (
      <div className="space-y-4">
        <AiAnalystPanel analyticsData={null} walletContext={balanceData} />
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-primary font-medium mb-1">Нет транзакций</div>
          <div className="text-secondary text-sm">За выбранный период транзакций не найдено</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Analyst Panel — вверху, основная фича */}
      <AiAnalystPanel analyticsData={data} walletContext={balanceData} />

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">💡 Инсайты</h3>
          <div className="space-y-2">
            {data.insights.map((ins, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg text-sm"
                style={{
                  background: ins.type === 'warning' ? '#fff7ed' : ins.type === 'success' ? '#f0fdf4' : '#f0f4ff',
                  color: ins.type === 'warning' ? '#c2410c' : ins.type === 'success' ? '#166534' : '#3730a3',
                }}
              >
                <span>{ins.icon}</span>
                <span>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gas Analytics */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">⛽ Gas аналитика</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Всего потрачено</div>
            <div className="text-xl font-bold text-gray-900">{data.gasSpent.toFixed(4)} N</div>
            <div className="text-xs text-gray-500 mt-1">${data.gasUSD}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Средний gas/tx</div>
            <div className="text-xl font-bold text-gray-900">
              {data.totalTxs > 0 ? (data.gasSpent / data.totalTxs).toFixed(5) : '0.0000'} N
            </div>
            <div className="text-xs text-gray-500 mt-1">за транзакцию</div>
          </div>
        </div>

        {/* Top Contracts */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 mb-2">Gas по протоколам:</div>
          {data.topContracts && data.topContracts.length > 0 ? (
            data.topContracts.map((contract, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm flex-1">
                  <span className="text-base">{contract.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-xs">{contract.name}</div>
                    {/* BUGFIX: contract.percent теперь существует */}
                    <div className="text-xs text-gray-500">{contract.percent ?? 0}% от общего gas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{contract.gas.toFixed(5)} N</div>
                  <div className="text-xs text-gray-500">{contract.txs} txs</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-2">Нет данных</div>
          )}
        </div>
      </div>

      {/* Activity by Category */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">📊 Активность по категориям</h3>
        {Object.entries(data.breakdown).map(([key, val]) => {
          if (val.count === 0) return null;
          return (
            <div key={key} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{categoryLabels[key] || key}</div>
                <div className="text-sm font-semibold">{val.count} транзакций</div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${val.percent}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">Доля</div>
                  <div className="font-semibold mt-1">{val.percent}%</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">Объем</div>
                  <div className="font-semibold mt-1">${val.usd.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500">Среднее</div>
                  <div className="font-semibold mt-1">
                    ${val.count > 0 ? (val.usd / val.count).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity by Day */}
      {data.activityByDay && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 text-sm">📅 Активность по дням</h3>
          <div className="flex items-end justify-between gap-1" style={{ height: 64 }}>
            {data.activityByDay.map((d) => {
              const maxTxs = Math.max(...data.activityByDay.map((x) => x.txs), 1);
              const heightPct = maxTxs > 0 ? (d.txs / maxTxs) * 100 : 0;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: 48 }}>
                    <div
                      className="w-full rounded-t-sm"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background: heightPct > 60 ? 'linear-gradient(180deg, #6366f1, #8b5cf6)' : '#e8e4ff',
                        minHeight: 4,
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
