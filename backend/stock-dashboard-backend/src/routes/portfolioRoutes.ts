import express from 'express';
import { 
  getPortfolioOverview,
  getPortfolioHoldings,
  getPortfolioHistory,
  addHolding,
  updateHolding,
  removeHolding
} from '../controllers/portfolioController';

const router = express.Router();

// Portfolio routes (no authentication - using session/demo data)
router.get('/overview', getPortfolioOverview);
router.get('/holdings', getPortfolioHoldings);
router.get('/history', getPortfolioHistory);
router.post('/holdings', addHolding);
router.put('/holdings/:id', updateHolding);
router.delete('/holdings/:id', removeHolding);

export default router;