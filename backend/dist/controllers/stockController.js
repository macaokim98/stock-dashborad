"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartData = exports.getTopLosers = exports.getTopGainers = exports.searchStocks = exports.getStockHistory = exports.getStockQuote = exports.getMarketOverview = void 0;
const stockService_1 = require("../services/stockService");
const logger_1 = require("../utils/logger");
const stockService = new stockService_1.StockService();
const getMarketOverview = async (req, res, next) => {
    try {
        const marketData = await stockService.getMarketOverview();
        res.status(200).json({
            success: true,
            data: marketData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching market overview:', error);
        next(error);
    }
};
exports.getMarketOverview = getMarketOverview;
const getStockQuote = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const quote = await stockService.getStockQuote(symbol.toUpperCase());
        if (!quote) {
            const error = new Error('Stock not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: quote,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching quote for ${req.params.symbol}:`, error);
        next(error);
    }
};
exports.getStockQuote = getStockQuote;
const getStockHistory = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const { interval = '1day', range = '1month' } = req.query;
        const history = await stockService.getStockHistory(symbol.toUpperCase(), interval, range);
        res.status(200).json({
            success: true,
            data: history,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching history for ${req.params.symbol}:`, error);
        next(error);
    }
};
exports.getStockHistory = getStockHistory;
const searchStocks = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            const error = new Error('Search query is required');
            error.statusCode = 400;
            throw error;
        }
        const results = await stockService.searchStocks(q);
        res.status(200).json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching stocks:', error);
        next(error);
    }
};
exports.searchStocks = searchStocks;
const getTopGainers = async (req, res, next) => {
    try {
        const gainers = await stockService.getTopGainers();
        res.status(200).json({
            success: true,
            data: gainers,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching top gainers:', error);
        next(error);
    }
};
exports.getTopGainers = getTopGainers;
const getTopLosers = async (req, res, next) => {
    try {
        const losers = await stockService.getTopLosers();
        res.status(200).json({
            success: true,
            data: losers,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching top losers:', error);
        next(error);
    }
};
exports.getTopLosers = getTopLosers;
const getChartData = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const { period = '1d', interval = '1m', startDate, endDate } = req.query;
        const chartData = await stockService.getChartData(symbol.toUpperCase(), period, interval, startDate, endDate);
        if (!chartData || chartData.length === 0) {
            const error = new Error('Chart data not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: chartData,
            timestamp: new Date().toISOString(),
            metadata: {
                symbol: symbol.toUpperCase(),
                period,
                interval,
                dataPoints: chartData.length
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Error fetching chart data for ${req.params.symbol}:`, error);
        next(error);
    }
};
exports.getChartData = getChartData;
//# sourceMappingURL=stockController.js.map