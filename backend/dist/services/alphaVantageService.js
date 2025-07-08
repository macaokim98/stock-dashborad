"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaVantageService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class AlphaVantageService {
    constructor() {
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
        this.apiKey = process.env.ALPHAVANTAGE_API_KEY || '';
        if (!this.apiKey) {
            logger_1.logger.warn('AlphaVantage API key not found in environment variables');
        }
    }
    getCacheKey(func, symbol, params) {
        return `${func}_${symbol}_${JSON.stringify(params || {})}`;
    }
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }
    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
    async getQuote(symbol) {
        try {
            if (!this.apiKey) {
                throw new Error('AlphaVantage API key not configured');
            }
            const cacheKey = this.getCacheKey('GLOBAL_QUOTE', symbol);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger_1.logger.info(`Using cached AlphaVantage quote for ${symbol}`);
                return cached;
            }
            logger_1.logger.info(`Fetching quote for ${symbol} from AlphaVantage`);
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: this.apiKey
                },
                timeout: 10000
            });
            const quote = response.data['Global Quote'];
            if (!quote || Object.keys(quote).length === 0) {
                logger_1.logger.warn(`No quote data found for ${symbol} from AlphaVantage`);
                return null;
            }
            const result = {
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
            logger_1.logger.info(`Successfully fetched AlphaVantage quote for ${symbol}: $${result.price}`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching quote from AlphaVantage for ${symbol}:`, error);
            return null;
        }
    }
    async getTimeSeries(symbol, interval = 'daily') {
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
                logger_1.logger.info(`Using cached AlphaVantage time series for ${symbol} (${interval})`);
                return cached;
            }
            logger_1.logger.info(`Fetching ${interval} time series for ${symbol} from AlphaVantage`);
            const response = await axios_1.default.get(this.baseUrl, {
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
                logger_1.logger.warn(`No time series data found for ${symbol} from AlphaVantage`);
                return [];
            }
            const result = Object.entries(timeSeries)
                .map(([date, data]) => ({
                date,
                open: parseFloat(data['1. open']),
                high: parseFloat(data['2. high']),
                low: parseFloat(data['3. low']),
                close: parseFloat(data['4. close']),
                volume: parseInt(data['5. volume'])
            }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            this.setCache(cacheKey, result);
            logger_1.logger.info(`Successfully fetched AlphaVantage time series for ${symbol}: ${result.length} points`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching time series from AlphaVantage for ${symbol}:`, error);
            return [];
        }
    }
    async getIntradayData(symbol, interval = '5min') {
        try {
            if (!this.apiKey) {
                throw new Error('AlphaVantage API key not configured');
            }
            const cacheKey = this.getCacheKey('TIME_SERIES_INTRADAY', symbol, { interval });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger_1.logger.info(`Using cached AlphaVantage intraday data for ${symbol} (${interval})`);
                return cached;
            }
            logger_1.logger.info(`Fetching ${interval} intraday data for ${symbol} from AlphaVantage`);
            const response = await axios_1.default.get(this.baseUrl, {
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
                logger_1.logger.warn(`No intraday data found for ${symbol} from AlphaVantage`);
                return [];
            }
            const result = Object.entries(timeSeries)
                .map(([date, data]) => ({
                date,
                open: parseFloat(data['1. open']),
                high: parseFloat(data['2. high']),
                low: parseFloat(data['3. low']),
                close: parseFloat(data['4. close']),
                volume: parseInt(data['5. volume'])
            }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            this.setCache(cacheKey, result);
            logger_1.logger.info(`Successfully fetched AlphaVantage intraday data for ${symbol}: ${result.length} points`);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching intraday data from AlphaVantage for ${symbol}:`, error);
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
        logger_1.logger.info('AlphaVantage cache cleared');
    }
}
exports.AlphaVantageService = AlphaVantageService;
//# sourceMappingURL=alphaVantageService.js.map