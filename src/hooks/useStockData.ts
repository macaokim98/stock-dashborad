import { useState, useEffect } from 'react';

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

  const fetchStockData = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use mock data
      // In production, replace with actual API calls
      setStocks(mockStockData);
      setMarketIndices(mockMarketIndices);
      setPortfolioData(mockPortfolioData);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchStockData();
  };

  useEffect(() => {
    fetchStockData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      // Update mock data with small random changes
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const randomChange = (Math.random() - 0.5) * 10;
          const newPrice = Math.max(0.01, stock.price + randomChange);
          const change = newPrice - stock.price;
          const changePercent = (change / stock.price) * 100;
          
          return {
            ...stock,
            price: Number(newPrice.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2))
          };
        })
      );
      
      setMarketIndices(prevIndices =>
        prevIndices.map(index => {
          const randomChange = (Math.random() - 0.5) * 50;
          const newValue = Math.max(0.01, index.value + randomChange);
          const change = newValue - index.value;
          const changePercent = (change / index.value) * 100;
          
          return {
            ...index,
            value: Number(newValue.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2))
          };
        })
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    stocks,
    marketIndices,
    portfolioData,
    loading,
    error,
    refreshData
  };
};