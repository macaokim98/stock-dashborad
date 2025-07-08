import express from 'express';
import { 
  getMarketOverview, 
  getStockQuote, 
  getStockHistory, 
  searchStocks,
  getTopGainers,
  getTopLosers,
  getChartData
} from '../controllers/stockController';
import { validateStockSymbol } from '../middleware/validationMiddleware';

const router = express.Router();

// Public routes (no authentication required)
router.get('/market-overview', getMarketOverview);
router.get('/search', searchStocks);
router.get('/top-gainers', getTopGainers);
router.get('/top-losers', getTopLosers);
router.get('/quote/:symbol', validateStockSymbol, getStockQuote);
router.get('/history/:symbol', validateStockSymbol, getStockHistory);
router.get('/chart/:symbol', validateStockSymbol, getChartData);

export default router;