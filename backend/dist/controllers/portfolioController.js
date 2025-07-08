"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeHolding = exports.updateHolding = exports.addHolding = exports.getPortfolioHistory = exports.getPortfolioHoldings = exports.getPortfolioOverview = void 0;
const portfolioService_1 = require("../services/portfolioService");
const logger_1 = require("../utils/logger");
const portfolioService = new portfolioService_1.PortfolioService();
const getPortfolioOverview = async (req, res, next) => {
    try {
        const overview = await portfolioService.getPortfolioOverview();
        res.status(200).json({
            success: true,
            data: overview,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio overview:', error);
        next(error);
    }
};
exports.getPortfolioOverview = getPortfolioOverview;
const getPortfolioHoldings = async (req, res, next) => {
    try {
        const holdings = await portfolioService.getHoldings();
        res.status(200).json({
            success: true,
            data: holdings,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio holdings:', error);
        next(error);
    }
};
exports.getPortfolioHoldings = getPortfolioHoldings;
const getPortfolioHistory = async (req, res, next) => {
    try {
        const { period = '1month' } = req.query;
        const history = await portfolioService.getPortfolioHistory(period);
        res.status(200).json({
            success: true,
            data: history,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio history:', error);
        next(error);
    }
};
exports.getPortfolioHistory = getPortfolioHistory;
const addHolding = async (req, res, next) => {
    try {
        const { symbol, shares, purchasePrice } = req.body;
        if (!symbol || !shares || !purchasePrice) {
            const error = new Error('Symbol, shares, and purchase price are required');
            error.statusCode = 400;
            throw error;
        }
        const holding = await portfolioService.addHolding({
            symbol: symbol.toUpperCase(),
            shares: Number(shares),
            purchasePrice: Number(purchasePrice),
            purchaseDate: new Date()
        });
        res.status(201).json({
            success: true,
            data: holding,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding holding:', error);
        next(error);
    }
};
exports.addHolding = addHolding;
const updateHolding = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { shares, purchasePrice } = req.body;
        const holding = await portfolioService.updateHolding(id, {
            shares: shares ? Number(shares) : undefined,
            purchasePrice: purchasePrice ? Number(purchasePrice) : undefined
        });
        if (!holding) {
            const error = new Error('Holding not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            data: holding,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating holding:', error);
        next(error);
    }
};
exports.updateHolding = updateHolding;
const removeHolding = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await portfolioService.removeHolding(id);
        if (!success) {
            const error = new Error('Holding not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            success: true,
            message: 'Holding removed successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error removing holding:', error);
        next(error);
    }
};
exports.removeHolding = removeHolding;
//# sourceMappingURL=portfolioController.js.map