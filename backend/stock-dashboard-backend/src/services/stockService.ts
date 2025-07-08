import { logger } from '../utils/logger';
import { YFinanceService, YFinanceQuote } from './yfinanceService';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface StockHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class StockService {
  private yfinanceService: YFinanceService;

  constructor() {
    this.yfinanceService = new YFinanceService();
  }

  async getMarketOverview(): Promise<MarketIndex[]> {
    try {
      logger.info('Fetching market overview from YFinance');
      
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
            changePercent: data.regularMarketChangePercent
          };
        } else {
          logger.warn(`No data available for ${symbol}, using fallback`);
          return {
            name,
            symbol: symbol.replace('^', ''),
            value: 0,
            change: 0,
            changePercent: 0
          };
        }
      });

      logger.info(`Successfully fetched market overview: ${indices.length} indices`);
      return indices;
    } catch (error) {
      logger.error('Error fetching market overview:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      logger.info(`Fetching quote for ${symbol} from YFinance`);
      
      const yfinanceData = await this.yfinanceService.getQuote(symbol);
      
      if (!yfinanceData) {
        logger.warn(`No data found for ${symbol}`);
        return null;
      }

      const stockQuote: StockQuote = {
        symbol: yfinanceData.symbol,
        name: yfinanceData.shortName || yfinanceData.longName || yfinanceData.symbol,
        price: yfinanceData.regularMarketPrice,
        change: yfinanceData.regularMarketChange,
        changePercent: yfinanceData.regularMarketChangePercent,
        volume: yfinanceData.regularMarketVolume,
        marketCap: yfinanceData.marketCap,
        peRatio: yfinanceData.trailingPE,
        high52Week: yfinanceData.fiftyTwoWeekHigh,
        low52Week: yfinanceData.fiftyTwoWeekLow
      };

      logger.info(`Successfully fetched quote for ${symbol}: $${stockQuote.price}`);
      return stockQuote;
    } catch (error) {
      logger.error(`Error fetching quote for ${symbol}:`, error);
      throw new Error('Failed to fetch stock quote');
    }
  }

  async getStockHistory(symbol: string, interval: string, range: string): Promise<StockHistoryPoint[]> {
    try {
      logger.info(`Fetching historical data for ${symbol} (${range}, ${interval})`);
      
      // Map frontend range to YFinance period
      const periodMapping: { [key: string]: string } = {
        '1day': '1d',
        '1week': '5d',
        '1month': '1mo',
        '3months': '3mo',
        '6months': '6mo',
        '1year': '1y'
      };

      // Map frontend interval to YFinance interval
      const intervalMapping: { [key: string]: string } = {
        '1minute': '1m',
        '5minutes': '5m',
        '15minutes': '15m',
        '1hour': '1h',
        '1day': '1d'
      };

      const yfinancePeriod = periodMapping[range] || '1mo';
      const yfinanceInterval = intervalMapping[interval] || '1d';

      const historicalData = await this.yfinanceService.getHistoricalData(
        symbol, 
        yfinancePeriod, 
        yfinanceInterval
      );

      const history: StockHistoryPoint[] = historicalData.map(data => ({
        date: data.date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume
      }));

      logger.info(`Successfully fetched historical data for ${symbol}: ${history.length} points`);
      return history;
    } catch (error) {
      logger.error(`Error fetching history for ${symbol}:`, error);
      throw new Error('Failed to fetch stock history');
    }
  }

  async searchStocks(query: string): Promise<StockQuote[]> {
    try {
      logger.info(`Searching stocks for query: ${query}`);
      
      const searchResults = await this.yfinanceService.searchSymbols(query);
      
      if (searchResults.length === 0) {
        logger.info(`No search results found for: ${query}`);
        return [];
      }

      // Get quotes for search results (limit to 5 to avoid rate limiting)
      const symbols = searchResults.slice(0, 5).map(result => result.symbol);
      const quotes: StockQuote[] = [];

      for (const symbol of symbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          if (quote) {
            quotes.push(quote);
          }
          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          logger.warn(`Failed to get quote for ${symbol} during search`);
        }
      }

      logger.info(`Search completed for ${query}: ${quotes.length} results`);
      return quotes;
    } catch (error) {
      logger.error('Error searching stocks:', error);
      throw new Error('Failed to search stocks');
    }
  }

  async getTopGainers(): Promise<StockQuote[]> {
    try {
      logger.info('Fetching top gainers');
      
      // Popular tech stocks that often move significantly
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN'];
      const quotes: StockQuote[] = [];

      for (const symbol of symbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          if (quote) {
            quotes.push(quote);
          }
          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          logger.warn(`Failed to get quote for ${symbol} in top gainers`);
        }
      }
      
      const gainers = quotes
        .filter(stock => stock.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

      logger.info(`Top gainers fetched: ${gainers.length} stocks`);
      return gainers;
    } catch (error) {
      logger.error('Error fetching top gainers:', error);
      throw new Error('Failed to fetch top gainers');
    }
  }

  async getTopLosers(): Promise<StockQuote[]> {
    try {
      logger.info('Fetching top losers');
      
      // Same pool of stocks but filtered for losers
      const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN'];
      const quotes: StockQuote[] = [];

      for (const symbol of symbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          if (quote) {
            quotes.push(quote);
          }
          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          logger.warn(`Failed to get quote for ${symbol} in top losers`);
        }
      }
      
      const losers = quotes
        .filter(stock => stock.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5);

      logger.info(`Top losers fetched: ${losers.length} stocks`);
      return losers;
    } catch (error) {
      logger.error('Error fetching top losers:', error);
      throw new Error('Failed to fetch top losers');
    }
  }

  getCacheStats() {
    return this.yfinanceService.getCacheStats();
  }

  clearCache() {
    this.yfinanceService.clearCache();
  }
}