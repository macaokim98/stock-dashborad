import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  name: string;
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

interface PortfolioData {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
}

export const useStockData = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mockStockData: StockData[] = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.43,
      change: 4.02,
      changePercent: 2.1
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 421.89,
      change: 7.45,
      changePercent: 1.8
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 2834.56,
      change: -14.17,
      changePercent: -0.5
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 248.50,
      change: 12.30,
      changePercent: 5.2
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 3342.88,
      change: -8.44,
      changePercent: -0.3
    }
  ];

  const mockMarketIndices: MarketIndex[] = [
    {
      name: 'S&P 500',
      symbol: 'SPX',
      value: 4856.84,
      change: 57.68,
      changePercent: 1.2
    },
    {
      name: 'NASDAQ',
      symbol: 'NDX',
      value: 15234.67,
      change: 120.45,
      changePercent: 0.8
    },
    {
      name: 'Dow Jones',
      symbol: 'DJI',
      value: 36745.31,
      change: -110.23,
      changePercent: -0.3
    }
  ];

  const mockPortfolioData: PortfolioData = {
    totalValue: 124567.89,
    dayChange: 2890.45,
    dayChangePercent: 2.4,
    totalGain: 24567.89,
    totalGainPercent: 24.5
  };

  const refreshData = () => {
    fetchStockDataCallback();
  };

  const fetchStockDataCallback = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend API
      const [marketRes, stocksRes, portfolioRes] = await Promise.all([
        axios.get('/api/stocks/market-overview'),
        axios.get('/api/stocks/top-gainers').then(res => res.data.data.slice(0, 5)),
        axios.get('/api/portfolio/overview')
      ]);

      // Transform market data
      const marketData = marketRes.data.data.map((item: any) => ({
        name: item.name,
        symbol: item.symbol,
        value: item.value,
        change: item.change,
        changePercent: item.changePercent
      }));

      // Transform stocks data  
      const stocksData = stocksRes.map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.changePercent
      }));

      // Use portfolio data or fallback to mock
      const portfolioData = portfolioRes.data.success ? portfolioRes.data.data : mockPortfolioData;

      setMarketIndices(marketData);
      setStocks(stocksData);
      setPortfolioData(portfolioData);
      setError(null);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      // Fallback to mock data on error
      setStocks(mockStockData);
      setMarketIndices(mockMarketIndices);
      setPortfolioData(mockPortfolioData);
      setError('Using demo data - API unavailable');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStockDataCallback();
    
    // Set up real-time updates every 5 minutes (300 seconds) to avoid rate limiting
    const interval = setInterval(() => {
      console.log('Refreshing stock data...');
      fetchStockDataCallback();
    }, 300000); // 5 minutes instead of frequent updates

    return () => clearInterval(interval);
  }, [fetchStockDataCallback]);

  return {
    stocks,
    marketIndices,
    portfolioData,
    loading,
    error,
    refreshData
  };
};