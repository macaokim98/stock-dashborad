import axios from 'axios';
import { logger } from '../utils/logger';

export interface AlphaVantageQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
}

export interface AlphaVantageTimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  constructor() {
    this.apiKey = process.env.ALPHAVANTAGE_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('AlphaVantage API key not found in environment variables');
    }
  }

  private getCacheKey(func: string, symbol: string, params?: any): string {
    return `${func}_${symbol}_${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getQuote(symbol: string): Promise<AlphaVantageQuote | null> {
    try {
      if (!this.apiKey) {
        throw new Error('AlphaVantage API key not configured');
      }

      const cacheKey = this.getCacheKey('GLOBAL_QUOTE', symbol);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Using cached AlphaVantage quote for ${symbol}`);
        return cached;
      }

      logger.info(`Fetching quote for ${symbol} from AlphaVantage`);

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        logger.warn(`No quote data found for ${symbol} from AlphaVantage`);
        return null;
      }

      const result: AlphaVantageQuote = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open'])
      };

      this.setCache(cacheKey, result);
      logger.info(`Successfully fetched AlphaVantage quote for ${symbol}: $${result.price}`);
      
      return result;
    } catch (error) {
      logger.error(`Error fetching quote from AlphaVantage for ${symbol}:`, error);
      return null;
    }
  }

  async getTimeSeries(symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<AlphaVantageTimeSeriesData[]> {
    try {
      if (!this.apiKey) {
        throw new Error('AlphaVantage API key not configured');
      }

      const functionMap = {
        daily: 'TIME_SERIES_DAILY',
        weekly: 'TIME_SERIES_WEEKLY',
        monthly: 'TIME_SERIES_MONTHLY'
      };

      const cacheKey = this.getCacheKey(functionMap[interval], symbol);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Using cached AlphaVantage time series for ${symbol} (${interval})`);
        return cached;
      }

      logger.info(`Fetching ${interval} time series for ${symbol} from AlphaVantage`);

      const response = await axios.get(this.baseUrl, {
        params: {
          function: functionMap[interval],
          symbol: symbol,
          apikey: this.apiKey,
          outputsize: 'compact' // Last 100 data points
        },
        timeout: 15000
      });

      const timeSeriesKey = interval === 'daily' ? 'Time Series (Daily)' :
                           interval === 'weekly' ? 'Weekly Time Series' :
                           'Monthly Time Series';

      const timeSeries = response.data[timeSeriesKey];
      if (!timeSeries) {
        logger.warn(`No time series data found for ${symbol} from AlphaVantage`);
        return [];
      }

      const result: AlphaVantageTimeSeriesData[] = Object.entries(timeSeries)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.setCache(cacheKey, result);
      logger.info(`Successfully fetched AlphaVantage time series for ${symbol}: ${result.length} points`);
      
      return result;
    } catch (error) {
      logger.error(`Error fetching time series from AlphaVantage for ${symbol}:`, error);
      return [];
    }
  }

  async getIntradayData(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'): Promise<AlphaVantageTimeSeriesData[]> {
    try {
      if (!this.apiKey) {
        throw new Error('AlphaVantage API key not configured');
      }

      const cacheKey = this.getCacheKey('TIME_SERIES_INTRADAY', symbol, { interval });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.info(`Using cached AlphaVantage intraday data for ${symbol} (${interval})`);
        return cached;
      }

      logger.info(`Fetching ${interval} intraday data for ${symbol} from AlphaVantage`);

      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol,
          interval: interval,
          apikey: this.apiKey,
          outputsize: 'compact'
        },
        timeout: 15000
      });

      const timeSeries = response.data[`Time Series (${interval})`];
      if (!timeSeries) {
        logger.warn(`No intraday data found for ${symbol} from AlphaVantage`);
        return [];
      }

      const result: AlphaVantageTimeSeriesData[] = Object.entries(timeSeries)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.setCache(cacheKey, result);
      logger.info(`Successfully fetched AlphaVantage intraday data for ${symbol}: ${result.length} points`);
      
      return result;
    } catch (error) {
      logger.error(`Error fetching intraday data from AlphaVantage for ${symbol}:`, error);
      return [];
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache() {
    this.cache.clear();
    logger.info('AlphaVantage cache cleared');
  }
}