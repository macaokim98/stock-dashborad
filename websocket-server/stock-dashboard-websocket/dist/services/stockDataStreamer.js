"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockDataStreamer = void 0;
const logger_1 = require("../utils/logger");
const events_1 = require("events");
const yfinanceService_1 = require("./yfinanceService");
class StockDataStreamer extends events_1.EventEmitter {
    constructor() {
        super();
        this.intervals = new Map();
        this.subscribedSymbols = new Set();
        this.isRunning = false;
        this.setMaxListeners(100); // Increase listener limit
        this.yfinanceService = new yfinanceService_1.YFinanceService();
    }
    start() {
        if (this.isRunning) {
            logger_1.logger.warn('Stock data streamer is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info('Starting stock data streamer');
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
        logger_1.logger.info('Stopping stock data streamer');
        // Clear all intervals
        this.intervals.forEach((interval, symbol) => {
            clearInterval(interval);
            logger_1.logger.debug(`Stopped streaming for ${symbol}`);
        });
        this.intervals.clear();
        if (this.marketDataInterval) {
            clearInterval(this.marketDataInterval);
            this.marketDataInterval = undefined;
        }
        this.removeAllListeners();
    }
    subscribeToSymbol(symbol) {
        if (this.subscribedSymbols.has(symbol)) {
            logger_1.logger.debug(`Already subscribed to ${symbol}`);
            return;
        }
        this.subscribedSymbols.add(symbol);
        if (this.isRunning) {
            this.startSymbolStream(symbol);
        }
        logger_1.logger.info(`Subscribed to ${symbol}`);
    }
    unsubscribeFromSymbol(symbol) {
        if (!this.subscribedSymbols.has(symbol)) {
            return;
        }
        this.subscribedSymbols.delete(symbol);
        const interval = this.intervals.get(symbol);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(symbol);
        }
        logger_1.logger.info(`Unsubscribed from ${symbol}`);
    }
    getSubscribedSymbols() {
        return Array.from(this.subscribedSymbols);
    }
    startMarketDataStream() {
        const updateMarketData = async () => {
            try {
                const marketData = await this.fetchMarketOverview();
                this.emit('market_data', marketData);
            }
            catch (error) {
                logger_1.logger.error('Error fetching market data:', error);
            }
        };
        // Initial fetch
        updateMarketData();
        // Set up interval
        const interval = parseInt(process.env.MARKET_DATA_INTERVAL || '5000');
        this.marketDataInterval = setInterval(updateMarketData, interval);
        logger_1.logger.info(`Market data streaming started (${interval}ms interval)`);
    }
    startSymbolStream(symbol) {
        if (this.intervals.has(symbol)) {
            logger_1.logger.debug(`Stream already exists for ${symbol}`);
            return;
        }
        const updateStockData = async () => {
            try {
                const quote = await this.fetchStockQuote(symbol);
                if (quote) {
                    this.emit('stock_update', quote);
                }
            }
            catch (error) {
                logger_1.logger.error(`Error fetching data for ${symbol}:`, error);
            }
        };
        // Initial fetch
        updateStockData();
        // Set up interval
        const intervalMs = parseInt(process.env.STOCK_QUOTES_INTERVAL || '2000');
        const interval = setInterval(updateStockData, intervalMs);
        this.intervals.set(symbol, interval);
        logger_1.logger.info(`Started streaming for ${symbol} (${intervalMs}ms interval)`);
    }
    async fetchMarketOverview() {
        try {
            logger_1.logger.debug('Fetching market overview from YFinance');
            const indicesData = await this.yfinanceService.getMarketIndices();
            const indexMapping = [
                { symbol: '^GSPC', name: 'S&P 500' },
                { symbol: '^IXIC', name: 'NASDAQ' },
                { symbol: '^DJI', name: 'Dow Jones' }
            ];
            const indices = indexMapping.map(({ symbol, name }) => {
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
                }
                else {
                    logger_1.logger.warn(`No market data available for ${symbol}`);
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
        }
        catch (error) {
            logger_1.logger.error('Error in fetchMarketOverview:', error);
            throw error;
        }
    }
    async fetchStockQuote(symbol) {
        try {
            // Mock real-time stock data with realistic price movements
            const baseStocks = {
                'AAPL': 195.43,
                'MSFT': 421.89,
                'GOOGL': 2834.56,
                'TSLA': 248.50,
                'AMZN': 3342.88,
                'META': 378.25,
                'NVDA': 875.28,
                'AMD': 167.89
            };
            const basePrice = baseStocks[symbol] || 100;
            const variation = (Math.random() - 0.5) * 0.015; // ±0.75% variation
            const newPrice = basePrice * (1 + variation);
            const change = newPrice - basePrice;
            const changePercent = (change / basePrice) * 100;
            return {
                symbol,
                price: Number(newPrice.toFixed(2)),
                change: Number(change.toFixed(2)),
                changePercent: Number(changePercent.toFixed(2)),
                volume: Math.floor(Math.random() * 50000000) + 10000000,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.error(`Error fetching quote for ${symbol}:`, error);
            return null;
        }
    }
}
exports.StockDataStreamer = StockDataStreamer;
//# sourceMappingURL=stockDataStreamer.js.map