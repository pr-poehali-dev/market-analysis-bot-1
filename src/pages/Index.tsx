import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  useEffect(() => {
    const initialSignals = generateMockSignals();
    setSignals(initialSignals);
    setFilteredSignals(initialSignals);

    const interval = setInterval(() => {
      const newSignals = generateMockSignals();
      setSignals(newSignals);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="signals">Сигналы</TabsTrigger>
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
