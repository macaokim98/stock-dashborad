import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stockService';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorMiddleware';

const stockService = new StockService();

export const getMarketOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const marketData = await stockService.getMarketOverview();
    
    res.status(200).json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching market overview:', error);
    next(error);
  }
};

export const getStockQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getStockQuote(symbol.toUpperCase());
    
    if (!quote) {
      const error = new Error('Stock not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error fetching quote for ${req.params.symbol}:`, error);
    next(error);
  }
};

export const getStockHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol } = req.params;
    const { interval = '1day', range = '1month' } = req.query;
    
    const history = await stockService.getStockHistory(
      symbol.toUpperCase(), 
      interval as string, 
      range as string
    );
    
    res.status(200).json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error fetching history for ${req.params.symbol}:`, error);
    next(error);
  }
};

export const searchStocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      const error = new Error('Search query is required') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const results = await stockService.searchStocks(q);
    
    res.status(200).json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error searching stocks:', error);
    next(error);
  }
};

export const getTopGainers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gainers = await stockService.getTopGainers();
    
    res.status(200).json({
      success: true,
      data: gainers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching top gainers:', error);
    next(error);
  }
};

export const getTopLosers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const losers = await stockService.getTopLosers();
    
    res.status(200).json({
      success: true,
      data: losers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching top losers:', error);
    next(error);
  }
};