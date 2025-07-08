import axios from 'axios';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

export interface YFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap?: number;
  trailingPE?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  shortName?: string;
  longName?: string;
}

export interface YFinanceHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class YFinanceService {
  private cache: NodeCache;
  private baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  private quoteSummaryUrl = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';
  private searchUrl = 'https://query1.finance.yahoo.com/v1/finance/search';
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 250; // 250ms between requests to avoid rate limiting

  constructor() {
    // Cache quotes for 60 seconds, historical data for 5 minutes to reduce API calls
    this.cache = new NodeCache({ 
      stdTTL: 60,
      checkperiod: 120,
      useClones: false
    });
  }

  private async throttleRequest<T>(request: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`Throttling request, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    return request();
  }

  async getQuote(symbol: string): Promise<YFinanceQuote | null> {
    try {
      const cacheKey = `quote_${symbol.toUpperCase()}`;
      const cached = this.cache.get<YFinanceQuote>(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit for ${symbol}`);
        return cached;
      }

      logger.debug(`Fetching fresh data for ${symbol}`);
      
      const response = await this.throttleRequest(() => 
        axios.get(`${this.baseUrl}/${symbol}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
      );

      const data = response.data;
      
      if (!data.chart?.result?.[0]) {
        logger.warn(`No data found for symbol: ${symbol}`);
        return null;
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];

      if (!meta || !quote) {
        logger.warn(`Invalid data structure for symbol: ${symbol}`);
        return null;
      }

      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      const yfinanceQuote: YFinanceQuote = {
        symbol: symbol.toUpperCase(),
        regularMarketPrice: Number(currentPrice?.toFixed(2)) || 0,
        regularMarketChange: Number(change?.toFixed(2)) || 0,
        regularMarketChangePercent: Number(changePercent?.toFixed(2)) || 0,
        regularMarketVolume: meta.regularMarketVolume || 0,
        marketCap: meta.marketCap,
        trailingPE: meta.trailingPE,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        shortName: meta.shortName,
        longName: meta.longName
      };

      // Cache the result
      this.cache.set(cacheKey, yfinanceQuote);
      
      logger.debug(`Successfully fetched ${symbol}: $${yfinanceQuote.regularMarketPrice}`);
      return yfinanceQuote;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`YFinance API error for ${symbol}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message
        });
      } else {
        logger.error(`Error fetching quote for ${symbol}:`, error);
      }
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Map<string, YFinanceQuote>> {
    const quotes = new Map<string, YFinanceQuote>();
    
    // Process symbols in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        const quote = await this.getQuote(symbol);
        if (quote) {
          quotes.set(symbol.toUpperCase(), quote);
        }
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await Promise.all(batchPromises);
    }

    return quotes;
  }

  async getHistoricalData(
    symbol: string, 
    period: string = '1mo',
    interval: string = '1d'
  ): Promise<YFinanceHistoricalData[]> {
    try {
      const cacheKey = `history_${symbol}_${period}_${interval}`;
      const cached = this.cache.get<YFinanceHistoricalData[]>(cacheKey);
      
      if (cached) {
        logger.debug(`Cache hit for historical ${symbol}`);
        return cached;
      }

      const response = await axios.get(`${this.baseUrl}/${symbol}`, {
        params: {
          period1: this.getPeriodTimestamp(period),
          period2: Math.floor(Date.now() / 1000),
          interval: interval,
          includePrePost: false,
          events: 'div,splits'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      if (!data.chart?.result?.[0]) {
        logger.warn(`No historical data found for symbol: ${symbol}`);
        return [];
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators?.quote?.[0];

      if (!timestamps || !quotes) {
        logger.warn(`Invalid historical data structure for symbol: ${symbol}`);
        return [];
      }

      const historicalData: YFinanceHistoricalData[] = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: Number((quotes.open[index] || 0).toFixed(2)),
        high: Number((quotes.high[index] || 0).toFixed(2)),
        low: Number((quotes.low[index] || 0).toFixed(2)),
        close: Number((quotes.close[index] || 0).toFixed(2)),
        volume: quotes.volume[index] || 0
      })).filter((item: YFinanceHistoricalData) => item.close > 0); // Filter out invalid data points

      // Cache with longer TTL for historical data
      this.cache.set(cacheKey, historicalData, 300); // 5 minutes
      
      logger.debug(`Successfully fetched historical data for ${symbol}: ${historicalData.length} points`);
      return historicalData;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`YFinance historical API error for ${symbol}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message
        });
      } else {
        logger.error(`Error fetching historical data for ${symbol}:`, error);
      }
      return [];
    }
  }

  async searchSymbols(query: string): Promise<Array<{symbol: string, name: string, type: string}>> {
    try {
      const response = await axios.get(this.searchUrl, {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      if (!data.quotes) {
        return [];
      }

      return data.quotes
        .filter((quote: any) => quote.isYahooFinance)
        .map((quote: any) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          type: quote.quoteType || 'EQUITY'
        }))
        .slice(0, 10);

    } catch (error) {
      logger.error('Error searching symbols:', error);
      return [];
    }
  }

  async getMarketIndices(): Promise<Map<string, YFinanceQuote>> {
    const indices = ['^GSPC', '^IXIC', '^DJI']; // S&P 500, NASDAQ, Dow Jones
    return this.getMultipleQuotes(indices);
  }

  private getPeriodTimestamp(period: string): number {
    const now = Math.floor(Date.now() / 1000);
    const periodsInSeconds: { [key: string]: number } = {
      '1d': 24 * 60 * 60,
      '5d': 5 * 24 * 60 * 60,
      '1mo': 30 * 24 * 60 * 60,
      '3mo': 90 * 24 * 60 * 60,
      '6mo': 180 * 24 * 60 * 60,
      '1y': 365 * 24 * 60 * 60,
      '2y': 2 * 365 * 24 * 60 * 60,
      '5y': 5 * 365 * 24 * 60 * 60,
      '10y': 10 * 365 * 24 * 60 * 60,
      'ytd': this.getYearStartTimestamp(),
      'max': 0
    };

    const secondsAgo = periodsInSeconds[period] || periodsInSeconds['1mo'];
    return secondsAgo === 0 ? 0 : now - secondsAgo;
  }

  private getYearStartTimestamp(): number {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return Math.floor(yearStart.getTime() / 1000);
  }

  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats()
    };
  }

  clearCache() {
    this.cache.flushAll();
    logger.info('YFinance cache cleared');
  }
}