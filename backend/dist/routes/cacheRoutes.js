"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stockService_1 = require("../services/stockService");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const stockService = new stockService_1.StockService();
// Cache management routes
router.get('/stats', (req, res) => {
    try {
        const stats = stockService.getCacheStats();
        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting cache stats:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to get cache stats' }
        });
    }
});
router.post('/clear', (req, res) => {
    try {
        stockService.clearCache();
        logger_1.logger.info('Cache cleared via API');
        res.status(200).json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error clearing cache:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to clear cache' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=cacheRoutes.js.map