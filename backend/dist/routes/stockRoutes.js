"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stockController_1 = require("../controllers/stockController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/market-overview', stockController_1.getMarketOverview);
router.get('/search', stockController_1.searchStocks);
router.get('/top-gainers', stockController_1.getTopGainers);
router.get('/top-losers', stockController_1.getTopLosers);
router.get('/quote/:symbol', validationMiddleware_1.validateStockSymbol, stockController_1.getStockQuote);
router.get('/history/:symbol', validationMiddleware_1.validateStockSymbol, stockController_1.getStockHistory);
router.get('/chart/:symbol', validationMiddleware_1.validateStockSymbol, stockController_1.getChartData);
exports.default = router;
//# sourceMappingURL=stockRoutes.js.map