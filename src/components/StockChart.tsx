import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import DateRangePicker from './DateRangePicker';
import './DateRangePicker.css';
import './StockChart.css';

interface ChartDataPoint {
  timestamp: string;
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  height?: number;
}

const StockChart: React.FC<StockChartProps> = ({ symbol, height = 400 }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('1d');
  const [interval, setChartInterval] = useState('5m');
  const [chartType, setChartType] = useState<'line' | 'candle' | 'volume'>('line');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [useCustomRange, setUseCustomRange] = useState(false);

  const periods = [
    { label: '1일', value: '1d' },
    { label: '5일', value: '5d' },
    { label: '1개월', value: '1mo' },
    { label: '3개월', value: '3mo' },
    { label: '6개월', value: '6mo' },
    { label: '1년', value: '1y' }
  ];

  const intervals = [
    { label: '1분', value: '1m' },
    { label: '5분', value: '5m' },
    { label: '15분', value: '15m' },
    { label: '30분', value: '30m' },
    { label: '1시간', value: '1h' },
    { label: '1일', value: '1d' },
    { label: '1주', value: '1w' },
    { label: '1월', value: '1M' }
  ];

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching chart data for ${symbol}, period: ${period}, interval: ${interval}`);
      
      const params: any = { interval };
      
      if (useCustomRange && startDate && endDate) {
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
        console.log(`Using custom date range: ${params.startDate} to ${params.endDate}`);
      } else {
        params.period = period;
      }
      
      const response = await axios.get(`/api/stocks/chart/${symbol}`, {
        params,
        timeout: 10000 // 10 second timeout
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const data = response.data.data.map((point: ChartDataPoint) => ({
          ...point,
          date: new Date(point.datetime).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: period === '1d' ? 'numeric' : undefined,
            minute: period === '1d' ? '2-digit' : undefined
          })
        }));
        setChartData(data);
        console.log(`Chart data loaded: ${data.length} points`);
      } else {
        setError('차트 데이터가 없습니다');
      }
    } catch (err: any) {
      console.error('Error fetching chart data:', err);
      if (err.code === 'ECONNABORTED') {
        setError('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
      } else if (err.response?.status === 429) {
        setError('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('차트 데이터를 불러오는데 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, period, interval, useCustomRange, startDate, endDate]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    
    if (start && end) {
      setUseCustomRange(true);
      // 사용자 정의 날짜 범위 사용 시 적절한 간격 설정
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        setChartInterval('1h');
      } else if (daysDiff <= 30) {
        setChartInterval('1d');
      } else {
        setChartInterval('1w');
      }
    } else {
      setUseCustomRange(false);
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {chartType === 'volume' ? (
            <div className="tooltip-content">
              <p className="tooltip-volume">거래량: {formatVolume(data.volume)}</p>
            </div>
          ) : (
            <div className="tooltip-content">
              <p className="tooltip-open">시가: {formatPrice(data.open)}</p>
              <p className="tooltip-high">고가: {formatPrice(data.high)}</p>
              <p className="tooltip-low">저가: {formatPrice(data.low)}</p>
              <p className="tooltip-close">종가: {formatPrice(data.close)}</p>
              <p className="tooltip-volume">거래량: {formatVolume(data.volume)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>차트 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="chart-error">
          <p>{error}</p>
          <button onClick={fetchChartData} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <div className="chart-type-selector">
          <button 
            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            선형
          </button>
          <button 
            className={`chart-type-btn ${chartType === 'volume' ? 'active' : ''}`}
            onClick={() => setChartType('volume')}
          >
            거래량
          </button>
        </div>

        <div className="date-range-section">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
            className="chart-date-picker"
          />
        </div>
        
        {!useCustomRange && (
          <div className="period-selector">
            {periods.map(p => (
              <button
                key={p.value}
                className={`period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => {
                  setPeriod(p.value);
                  setUseCustomRange(false);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="interval-selector">
          <select 
            value={interval} 
            onChange={(e) => setChartInterval(e.target.value)}
            className="interval-select"
          >
            {intervals.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-content" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'volume' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatVolume}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="volume" 
                fill="#8884d8" 
                opacity={0.8}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={formatPrice}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#2563eb' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;