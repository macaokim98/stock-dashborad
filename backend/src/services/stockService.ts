import { logger } from '../utils/logger';
import { YFinanceService, YFinanceQuote } from './yfinanceService';
import { AlphaVantageService, AlphaVantageQuote } from './alphaVantageService';

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

export interface ChartDataPoint {
  timestamp: string;
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class StockService {
  private yfinanceService: YFinanceService;
  private alphaVantageService: AlphaVantageService;

  constructor() {
    this.yfinanceService = new YFinanceService();
    this.alphaVantageService = new AlphaVantageService();
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
      
      // Try YFinance first
      let yfinanceData = await this.yfinanceService.getQuote(symbol);
      
      if (yfinanceData) {
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

        logger.info(`Successfully fetched quote from YFinance for ${symbol}: $${stockQuote.price}`);
        return stockQuote;
      }

      // Fallback to AlphaVantage if YFinance fails
      logger.info(`YFinance failed for ${symbol}, trying AlphaVantage as fallback`);
      const alphaVantageData = await this.alphaVantageService.getQuote(symbol);
      
      if (alphaVantageData) {
        const stockQuote: StockQuote = {
          symbol: alphaVantageData.symbol,
          name: alphaVantageData.symbol, // AlphaVantage doesn't provide company name
          price: alphaVantageData.price,
          change: alphaVantageData.change,
          changePercent: alphaVantageData.changePercent,
          volume: alphaVantageData.volume || 0,
          high52Week: alphaVantageData.high,
          low52Week: alphaVantageData.low
        };

        logger.info(`Successfully fetched quote from AlphaVantage for ${symbol}: $${stockQuote.price}`);
        return stockQuote;
      }

      logger.warn(`No data found for ${symbol} from both YFinance and AlphaVantage`);
      return null;
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

  async getChartData(
    symbol: string, 
    period: string = '1d', 
    interval: string = '1m',
    startDate?: string,
    endDate?: string
  ): Promise<ChartDataPoint[]> {
    try {
      const logMsg = startDate && endDate 
        ? `Fetching chart data for ${symbol}, custom range: ${startDate} to ${endDate}, interval: ${interval}`
        : `Fetching chart data for ${symbol}, period: ${period}, interval: ${interval}`;
      logger.info(logMsg);
      
      // Map frontend intervals to yfinance intervals
      const intervalMapping: { [key: string]: string } = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '1d': '1d',
        '1w': '1wk',
        '1M': '1mo'
      };

      // Map frontend periods to yfinance periods
      const periodMapping: { [key: string]: string } = {
        '1d': '1d',
        '5d': '5d',
        '1mo': '1mo',
        '3mo': '3mo',
        '6mo': '6mo',
        '1y': '1y',
        '2y': '2y',
        '5y': '5y',
        '10y': '10y',
        'ytd': 'ytd',
        'max': 'max'
      };

      let yfinancePeriod = periodMapping[period] || '1d';
      const yfinanceInterval = intervalMapping[interval] || '1m';

      // Use custom date range if provided
      let historicalData;
      if (startDate && endDate) {
        // Calculate period from date range for yfinance
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
          yfinancePeriod = '7d';
        } else if (daysDiff <= 30) {
          yfinancePeriod = '1mo';
        } else if (daysDiff <= 90) {
          yfinancePeriod = '3mo';
        } else if (daysDiff <= 180) {
          yfinancePeriod = '6mo';
        } else if (daysDiff <= 365) {
          yfinancePeriod = '1y';
        } else {
          yfinancePeriod = '2y';
        }

        try {
          historicalData = await this.yfinanceService.getHistoricalData(
            symbol, 
            yfinancePeriod, 
            yfinanceInterval
          );

          // Filter data to match the requested date range
          const startTime = start.getTime();
          const endTime = end.getTime();
          
          historicalData = historicalData.filter(data => {
            const dataTime = new Date(data.date).getTime();
            return dataTime >= startTime && dataTime <= endTime;
          });
        } catch (error) {
          logger.warn(`YFinance failed for chart data, trying AlphaVantage fallback for ${symbol}`);
          // Fallback to AlphaVantage for intraday data
          if (yfinanceInterval === '1m' || yfinanceInterval === '5m' || yfinanceInterval === '15m' || yfinanceInterval === '30m' || yfinanceInterval === '1h') {
            const alphaInterval = yfinanceInterval === '1h' ? '60min' : yfinanceInterval.replace('m', 'min');
            const alphaData = await this.alphaVantageService.getIntradayData(symbol, alphaInterval as any);
            historicalData = alphaData.map(data => ({
              date: data.date,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume
            }));
          } else {
            // Use daily/weekly/monthly data
            const alphaInterval = daysDiff <= 30 ? 'daily' : daysDiff <= 90 ? 'weekly' : 'monthly';
            const alphaData = await this.alphaVantageService.getTimeSeries(symbol, alphaInterval);
            historicalData = alphaData.map(data => ({
              date: data.date,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume
            }));
          }
        }
      } else {
        try {
          historicalData = await this.yfinanceService.getHistoricalData(
            symbol, 
            yfinancePeriod, 
            yfinanceInterval
          );
        } catch (error) {
          logger.warn(`YFinance failed for chart data, trying AlphaVantage fallback for ${symbol}`);
          // Fallback to AlphaVantage
          if (yfinanceInterval === '1m' || yfinanceInterval === '5m' || yfinanceInterval === '15m' || yfinanceInterval === '30m' || yfinanceInterval === '1h') {
            const alphaInterval = yfinanceInterval === '1h' ? '60min' : yfinanceInterval.replace('m', 'min');
            const alphaData = await this.alphaVantageService.getIntradayData(symbol, alphaInterval as any);
            historicalData = alphaData.map(data => ({
              date: data.date,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume
            }));
          } else {
            const alphaInterval = period === '1d' || period === '5d' ? 'daily' : 
                                 period === '1mo' || period === '3mo' ? 'weekly' : 'monthly';
            const alphaData = await this.alphaVantageService.getTimeSeries(symbol, alphaInterval);
            historicalData = alphaData.map(data => ({
              date: data.date,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume
            }));
          }
        }
      }

      const chartData: ChartDataPoint[] = historicalData.map(data => {
        const date = new Date(data.date);
        return {
          timestamp: date.getTime().toString(),
          datetime: date.toISOString(),
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume
        };
      });

      logger.info(`Successfully fetched chart data for ${symbol}: ${chartData.length} points`);
      return chartData;
    } catch (error) {
      logger.error(`Error fetching chart data for ${symbol}:`, error);
      throw new Error('Failed to fetch chart data');
    }
  }

  getCacheStats() {
    return {
      yfinance: this.yfinanceService.getCacheStats(),
      alphavantage: this.alphaVantageService.getCacheStats()
    };
  }

  clearCache() {
    this.yfinanceService.clearCache();
    this.alphaVantageService.clearCache();
  }
}