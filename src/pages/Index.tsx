import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Signal {
  pair: string;
  direction: 'CALL' | 'PUT';
  probability: number;
  volatility: number;
  expiration: string;
  price: number;
  trend: 'up' | 'down';
  timestamp: Date;
}

interface Trade {
  id: string;
  pair: string;
  direction: 'CALL' | 'PUT';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  profit?: number;
  status: 'active' | 'won' | 'lost';
  timestamp: Date;
  expiration: string;
}

interface PricePoint {
  time: number;
  price: number;
}

const generateMockSignals = (): Signal[] => {
  const pairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD',
    'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY',
    'BTC/USD', 'ETH/USD', 'XRP/USD', 'LTC/USD'
  ];
  
  return pairs.map(pair => {
    const probability = Math.floor(Math.random() * 30) + 60;
    const direction = Math.random() > 0.5 ? 'CALL' : 'PUT';
    return {
      pair,
      direction,
      probability,
      volatility: Math.floor(Math.random() * 40) + 30,
      expiration: ['1m', '5m', '15m', '30m', '1h'][Math.floor(Math.random() * 5)],
      price: parseFloat((Math.random() * 100 + 1).toFixed(5)),
      trend: direction === 'CALL' ? 'up' : 'down',
      timestamp: new Date()
    };
  });
};

const Index = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<Signal[]>([]);
  const [minProbability, setMinProbability] = useState([70]);
  const [minVolatility, setMinVolatility] = useState([0]);
  const [selectedExpiration, setSelectedExpiration] = useState('all');
  const [activeTab, setActiveTab] = useState('signals');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});
  const [selectedPair, setSelectedPair] = useState<string>('EUR/USD');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastNotifiedSignals = useRef<Set<string>>(new Set());

  useEffect(() => {
    const initialSignals = generateMockSignals();
    setSignals(initialSignals);
    setFilteredSignals(initialSignals);

    const interval = setInterval(() => {
      const newSignals = generateMockSignals();
      setSignals(newSignals);
      
      if (notificationsEnabled) {
        newSignals.forEach(signal => {
          if (signal.probability >= 85) {
            const signalKey = `${signal.pair}-${signal.direction}-${signal.probability}`;
            if (!lastNotifiedSignals.current.has(signalKey)) {
              toast.success(`Сильный сигнал!`, {
                description: `${signal.pair} ${signal.direction} - ${signal.probability}% вероятность`
              });
              lastNotifiedSignals.current.add(signalKey);
              setTimeout(() => lastNotifiedSignals.current.delete(signalKey), 60000);
            }
          }
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const newHistory = { ...prev };
        signals.forEach(signal => {
          if (!newHistory[signal.pair]) {
            newHistory[signal.pair] = [];
          }
          const currentTime = Date.now();
          const newPrice = signal.price + (Math.random() - 0.5) * 0.01;
          newHistory[signal.pair].push({ time: currentTime, price: newPrice });
          if (newHistory[signal.pair].length > 50) {
            newHistory[signal.pair].shift();
          }
        });
        return newHistory;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [signals]);

  useEffect(() => {
    if (!canvasRef.current || !priceHistory[selectedPair]) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const data = priceHistory[selectedPair];
    if (data.length < 2) return;

    const minPrice = Math.min(...data.map(p => p.price));
    const maxPrice = Math.max(...data.map(p => p.price));
    const priceRange = maxPrice - minPrice || 1;
    const padding = 40;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = padding + (i / (data.length - 1)) * (rect.width - padding * 2);
      const y = rect.height - padding - ((point.price - minPrice) / priceRange) * (rect.height - padding * 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.fillText(maxPrice.toFixed(5), 5, padding);
    ctx.fillText(minPrice.toFixed(5), 5, rect.height - padding + 15);

  }, [priceHistory, selectedPair]);

  const openTrade = (signal: Signal) => {
    const newTrade: Trade = {
      id: Date.now().toString(),
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.price,
      amount: 100,
      status: 'active',
      timestamp: new Date(),
      expiration: signal.expiration
    };
    setTrades(prev => [newTrade, ...prev]);
    toast.success('Сделка открыта', {
      description: `${signal.pair} ${signal.direction} на $100`
    });

    const expirationMs = parseInt(signal.expiration) * 60 * 1000;
    setTimeout(() => {
      setTrades(prev => prev.map(t => {
        if (t.id === newTrade.id && t.status === 'active') {
          const exitPrice = signal.price + (Math.random() - 0.5) * 0.1;
          const won = (signal.direction === 'CALL' && exitPrice > t.entryPrice) || 
                     (signal.direction === 'PUT' && exitPrice < t.entryPrice);
          const profit = won ? t.amount * 0.8 : -t.amount;
          return { ...t, exitPrice, profit, status: won ? 'won' : 'lost' };
        }
        return t;
      }));
    }, expirationMs);
  };

  useEffect(() => {
    const filtered = signals.filter(s => 
      s.probability >= minProbability[0] && 
      s.volatility >= minVolatility[0] &&
      (selectedExpiration === 'all' || s.expiration === selectedExpiration)
    );
    
    filtered.sort((a, b) => b.probability - a.probability);
    setFilteredSignals(filtered);
  }, [signals, minProbability, minVolatility, selectedExpiration]);

  const topSignals = filteredSignals.slice(0, 3);
  const stats = {
    totalSignals: signals.length,
    highProbability: signals.filter(s => s.probability >= 75).length,
    avgVolatility: Math.round(signals.reduce((acc, s) => acc + s.volatility, 0) / signals.length),
    callSignals: signals.filter(s => s.direction === 'CALL').length
  };

  const totalProfit = trades.reduce((acc, t) => acc + (t.profit || 0), 0);
  const winRate = trades.length > 0 
    ? Math.round((trades.filter(t => t.status === 'won').length / trades.filter(t => t.status !== 'active').length) * 100) || 0
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Icon name="TrendingUp" className="text-blue-400" size={32} />
              Pocket Option Pro
            </h1>
            <p className="text-slate-400 mt-1">Анализ рынков в реальном времени</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse-signal"></div>
            <span className="text-sm text-slate-400">Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Всего сигналов</p>
                <p className="text-2xl font-bold mt-1">{stats.totalSignals}</p>
              </div>
              <Icon name="Activity" className="text-blue-400" size={32} />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Сильные сигналы</p>
                <p className="text-2xl font-bold mt-1">{stats.highProbability}</p>
              </div>
              <Icon name="Zap" className="text-yellow-400" size={32} />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Ср. волатильность</p>
                <p className="text-2xl font-bold mt-1">{stats.avgVolatility}%</p>
              </div>
              <Icon name="BarChart3" className="text-purple-400" size={32} />
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">CALL сигналы</p>
                <p className="text-2xl font-bold mt-1">{stats.callSignals}</p>
              </div>
              <Icon name="TrendingUp" className="text-green-400" size={32} />
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
            <TabsTrigger value="signals">Сигналы</TabsTrigger>
            <TabsTrigger value="chart">График</TabsTrigger>
            <TabsTrigger value="portfolio">Портфель</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="space-y-6 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon name="Star" className="text-yellow-400" size={20} />
                Топ-3 сигнала
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topSignals.map((signal, idx) => (
                  <Card 
                    key={idx} 
                    className={`relative overflow-hidden ${
                      signal.direction === 'CALL' 
                        ? 'bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-500/30' 
                        : 'bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-500/30'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16"></div>
                    <div className="p-5 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold">{signal.pair}</h3>
                          <p className="text-xs text-slate-400 mt-1">Экспирация: {signal.expiration}</p>
                        </div>
                        <Badge className={signal.direction === 'CALL' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {signal.direction}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Вероятность</span>
                          <span className="text-lg font-bold text-green-400">{signal.probability}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${signal.probability >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${signal.probability}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm text-slate-400">Волатильность: {signal.volatility}%</span>
                          <Icon 
                            name={signal.direction === 'CALL' ? 'ArrowUp' : 'ArrowDown'} 
                            className={signal.direction === 'CALL' ? 'text-green-400' : 'text-red-400'} 
                            size={20} 
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={() => openTrade(signal)}
                        className={`w-full mt-4 ${
                          signal.direction === 'CALL' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        Открыть сделку
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Icon name="List" size={20} />
                Все сигналы ({filteredSignals.length})
              </h2>
              <Card className="bg-slate-800/50 border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-700">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Пара</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Направление</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Вероятность</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Волатильность</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Экспирация</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSignals.map((signal, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="p-4 font-semibold">{signal.pair}</td>
                          <td className="p-4">
                            <Badge className={signal.direction === 'CALL' ? 'bg-green-500' : 'bg-red-500'}>
                              {signal.direction}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-400">{signal.probability}%</span>
                              <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                <div 
                                  className={signal.probability >= 80 ? 'bg-green-500 h-1.5 rounded-full' : 'bg-yellow-500 h-1.5 rounded-full'}
                                  style={{ width: `${signal.probability}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{signal.volatility}%</td>
                          <td className="p-4">{signal.expiration}</td>
                          <td className="p-4">
                            <Button 
                              onClick={() => openTrade(signal)}
                              size="sm" 
                              className={signal.direction === 'CALL' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                              Войти
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Icon name="LineChart" size={20} />
                  График цены в реальном времени
                </h2>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger className="w-48 bg-slate-900 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {signals.map(s => (
                      <SelectItem key={s.pair} value={s.pair}>{s.pair}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <canvas ref={canvasRef} className="w-full h-80" style={{ width: '100%', height: '320px' }}></canvas>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Текущая цена</p>
                  <p className="text-xl font-bold text-blue-400">
                    {priceHistory[selectedPair]?.[priceHistory[selectedPair]?.length - 1]?.price.toFixed(5) || '---'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Изменение</p>
                  <p className={`text-xl font-bold ${
                    priceHistory[selectedPair]?.length > 1 &&
                    priceHistory[selectedPair][priceHistory[selectedPair].length - 1].price >
                    priceHistory[selectedPair][0].price ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {priceHistory[selectedPair]?.length > 1
                      ? ((priceHistory[selectedPair][priceHistory[selectedPair].length - 1].price -
                          priceHistory[selectedPair][0].price) / priceHistory[selectedPair][0].price * 100).toFixed(2)
                      : '0.00'}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Точек данных</p>
                  <p className="text-xl font-bold">{priceHistory[selectedPair]?.length || 0}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Общая прибыль</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${totalProfit.toFixed(2)}
                    </p>
                  </div>
                  <Icon name="DollarSign" className="text-green-400" size={32} />
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Всего сделок</p>
                    <p className="text-2xl font-bold mt-1">{trades.length}</p>
                  </div>
                  <Icon name="TrendingUp" className="text-blue-400" size={32} />
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Процент побед</p>
                    <p className="text-2xl font-bold mt-1 text-yellow-400">{winRate}%</p>
                  </div>
                  <Icon name="Target" className="text-yellow-400" size={32} />
                </div>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Icon name="History" size={20} />
                  История сделок
                </h2>
                {trades.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Icon name="Inbox" className="mx-auto mb-4" size={48} />
                    <p>Нет активных сделок</p>
                    <p className="text-sm mt-2">Откройте первую сделку во вкладке "Сигналы"</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-700">
                        <tr>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Пара</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Направление</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Вход</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Выход</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Сумма</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Прибыль</th>
                          <th className="text-left p-4 text-sm font-semibold text-slate-400">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trades.map(trade => (
                          <tr key={trade.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="p-4 font-semibold">{trade.pair}</td>
                            <td className="p-4">
                              <Badge className={trade.direction === 'CALL' ? 'bg-green-500' : 'bg-red-500'}>
                                {trade.direction}
                              </Badge>
                            </td>
                            <td className="p-4">${trade.entryPrice.toFixed(5)}</td>
                            <td className="p-4">{trade.exitPrice ? `$${trade.exitPrice.toFixed(5)}` : '---'}</td>
                            <td className="p-4">${trade.amount}</td>
                            <td className="p-4">
                              <span className={`font-bold ${
                                !trade.profit ? 'text-slate-400' :
                                trade.profit > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {trade.profit ? `$${trade.profit.toFixed(2)}` : '---'}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge className={{
                                active: 'bg-blue-500',
                                won: 'bg-green-500',
                                lost: 'bg-red-500'
                              }[trade.status]}>
                                {trade.status === 'active' ? 'Активна' : trade.status === 'won' ? 'Выигрыш' : 'Проигрыш'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Icon name="Settings" size={20} />
                Фильтры сигналов
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Минимальная вероятность: {minProbability[0]}%
                  </label>
                  <Slider
                    value={minProbability}
                    onValueChange={setMinProbability}
                    min={60}
                    max={95}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Минимальная волатильность: {minVolatility[0]}%
                  </label>
                  <Slider
                    value={minVolatility}
                    onValueChange={setMinVolatility}
                    min={0}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Время экспирации
                  </label>
                  <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Выберите время" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="1m">1 минута</SelectItem>
                      <SelectItem value="5m">5 минут</SelectItem>
                      <SelectItem value="15m">15 минут</SelectItem>
                      <SelectItem value="30m">30 минут</SelectItem>
                      <SelectItem value="1h">1 час</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Применить фильтры
                </Button>
              </div>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Icon name="Bell" size={20} />
                Уведомления
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push-уведомления</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Получать уведомления о сигналах с вероятностью 85%+
                    </p>
                  </div>
                  <Button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={notificationsEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'}
                  >
                    {notificationsEnabled ? 'Включено' : 'Выключено'}
                  </Button>
                </div>

                {notificationsEnabled && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-green-400 flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} />
                      Уведомления активны. Вы получите алерт при появлении сильных сигналов.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="PieChart" size={20} />
                  Распределение по направлениям
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CALL сигналы</span>
                      <span className="text-sm font-bold text-green-400">{stats.callSignals}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(stats.callSignals / stats.totalSignals) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">PUT сигналы</span>
                      <span className="text-sm font-bold text-red-400">{stats.totalSignals - stats.callSignals}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-red-500 h-3 rounded-full"
                        style={{ width: `${((stats.totalSignals - stats.callSignals) / stats.totalSignals) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Icon name="Target" size={20} />
                  Качество сигналов
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Высокая вероятность (75%+)</span>
                      <span className="text-sm font-bold text-green-400">{stats.highProbability}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full"
                        style={{ width: `${(stats.highProbability / stats.totalSignals) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Средняя вероятность (60-75%)</span>
                      <span className="text-sm font-bold text-yellow-400">
                        {stats.totalSignals - stats.highProbability}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div 
                        className="bg-yellow-500 h-3 rounded-full"
                        style={{ width: `${((stats.totalSignals - stats.highProbability) / stats.totalSignals) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;