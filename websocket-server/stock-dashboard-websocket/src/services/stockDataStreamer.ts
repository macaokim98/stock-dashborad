import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { YFinanceService } from './yfinanceService';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export class StockDataStreamer extends EventEmitter {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private marketDataInterval?: NodeJS.Timeout;
  private isRunning = false;
  private yfinanceService: YFinanceService;

  constructor() {
    super();
    this.setMaxListeners(100); // Increase listener limit
    this.yfinanceService = new YFinanceService();
  }

  start() {
    if (this.isRunning) {
      logger.warn('Stock data streamer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting stock data streamer');

    // Start market data streaming
    this.startMarketDataStream();
    
    // Start streaming for any pre-subscribed symbols
    this.subscribedSymbols.forEach(symbol => {
      this.startSymbolStream(symbol);
    });
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info('Stopping stock data streamer');

    // Clear all intervals
    this.intervals.forEach((interval, symbol) => {
      clearInterval(interval);
      logger.debug(`Stopped streaming for ${symbol}`);
    });
    this.intervals.clear();

    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = undefined;
    }

    this.removeAllListeners();
  }

  subscribeToSymbol(symbol: string) {
    if (this.subscribedSymbols.has(symbol)) {
      logger.debug(`Already subscribed to ${symbol}`);
      return;
    }

    this.subscribedSymbols.add(symbol);
    
    if (this.isRunning) {
      this.startSymbolStream(symbol);
    }
    
    logger.info(`Subscribed to ${symbol}`);
  }

  unsubscribeFromSymbol(symbol: string) {
    if (!this.subscribedSymbols.has(symbol)) {
      return;
    }

    this.subscribedSymbols.delete(symbol);
    
    const interval = this.intervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(symbol);
    }
    
    logger.info(`Unsubscribed from ${symbol}`);
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  private startMarketDataStream() {
    const updateMarketData = async () => {
      try {
        const marketData = await this.fetchMarketOverview();
        this.emit('market_data', marketData);
      } catch (error) {
        logger.error('Error fetching market data:', error);
      }
    };

    // Initial fetch
    updateMarketData();

    // Set up interval
    const interval = parseInt(process.env.MARKET_DATA_INTERVAL || '5000');
    this.marketDataInterval = setInterval(updateMarketData, interval);
    
    logger.info(`Market data streaming started (${interval}ms interval)`);
  }

  private startSymbolStream(symbol: string) {
    if (this.intervals.has(symbol)) {
      logger.debug(`Stream already exists for ${symbol}`);
      return;
    }

    const updateStockData = async () => {
      try {
        const quote = await this.fetchStockQuote(symbol);
        if (quote) {
          this.emit('stock_update', quote);
        }
      } catch (error) {
        logger.error(`Error fetching data for ${symbol}:`, error);
      }
    };

    // Initial fetch
    updateStockData();

    // Set up interval
    const intervalMs = parseInt(process.env.STOCK_QUOTES_INTERVAL || '2000');
    const interval = setInterval(updateStockData, intervalMs);
    this.intervals.set(symbol, interval);
    
    logger.info(`Started streaming for ${symbol} (${intervalMs}ms interval)`);
  }

  private async fetchMarketOverview(): Promise<MarketIndex[]> {
    try {
      logger.debug('Fetching market overview from YFinance');
      
      const indicesData = await this.yfinanceService.getMarketIndices();
      
      const indexMapping = [
        { symbol: '^GSPC', name: 'S&P 500' },
        { symbol: '^IXIC', name: 'NASDAQ' },
        { symbol: '^DJI', name: 'Dow Jones' }
      ];

      const indices: MarketIndex[] = indexMapping.map(({ symbol, name }) => {
        const data = indicesData.get(symbol);
        
        if (data) {
          return {
            name,
            symbol: symbol.replace('^', ''),
            value: data.regularMarketPrice,
            change: data.regularMarketChange,
            changePercent: data.regularMarketChangePercent,
            timestamp: new Date().toISOString()
          };
        } else {
          logger.warn(`No market data available for ${symbol}`);
          return {
            name,
            symbol: symbol.replace('^', ''),
            value: 0,
            change: 0,
            changePercent: 0,
            timestamp: new Date().toISOString()
          };
        }
      });

      return indices.filter(index => index.value > 0); // Filter out failed requests
    } catch (error) {
      logger.error('Error in fetchMarketOverview:', error);
      throw error;
    }
  }

  private async fetchStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      logger.debug(`Fetching real-time quote for ${symbol}`);
      
      const yfinanceData = await this.yfinanceService.getQuote(symbol);
      
      if (!yfinanceData) {
        logger.warn(`No real-time data found for ${symbol}`);
        return null;
      }

      return {
        symbol: yfinanceData.symbol,
        price: yfinanceData.regularMarketPrice,
        change: yfinanceData.regularMarketChange,
        changePercent: yfinanceData.regularMarketChangePercent,
        volume: yfinanceData.regularMarketVolume,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error fetching real-time quote for ${symbol}:`, error);
      return null;
    }
  }
}