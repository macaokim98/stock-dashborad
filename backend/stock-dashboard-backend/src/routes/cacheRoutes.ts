import express from 'express';
import { StockService } from '../services/stockService';
import { logger } from '../utils/logger';

const router = express.Router();
const stockService = new StockService();

// Cache management routes
router.get('/stats', (req, res) => {
  try {
    const stats = stockService.getCacheStats();
    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get cache stats' }
    });
  }
});

router.post('/clear', (req, res) => {
  try {
    stockService.clearCache();
    logger.info('Cache cleared via API');
    
    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to clear cache' }
    });
  }
});

export default router;