import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/portfolioService';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorMiddleware';

const portfolioService = new PortfolioService();

export const getPortfolioOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await portfolioService.getPortfolioOverview();
    
    res.status(200).json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching portfolio overview:', error);
    next(error);
  }
};

export const getPortfolioHoldings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const holdings = await portfolioService.getHoldings();
    
    res.status(200).json({
      success: true,
      data: holdings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching portfolio holdings:', error);
    next(error);
  }
};

export const getPortfolioHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = '1month' } = req.query;
    const history = await portfolioService.getPortfolioHistory(period as string);
    
    res.status(200).json({
      success: true,
      data: history,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching portfolio history:', error);
    next(error);
  }
};

export const addHolding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symbol, shares, purchasePrice } = req.body;
    
    if (!symbol || !shares || !purchasePrice) {
      const error = new Error('Symbol, shares, and purchase price are required') as ApiError;
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
  } catch (error) {
    logger.error('Error adding holding:', error);
    next(error);
  }
};

export const updateHolding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { shares, purchasePrice } = req.body;
    
    const holding = await portfolioService.updateHolding(id, {
      shares: shares ? Number(shares) : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined
    });
    
    if (!holding) {
      const error = new Error('Holding not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({
      success: true,
      data: holding,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating holding:', error);
    next(error);
  }
};

export const removeHolding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const success = await portfolioService.removeHolding(id);
    
    if (!success) {
      const error = new Error('Holding not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    
    res.status(200).json({
      success: true,
      message: 'Holding removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error removing holding:', error);
    next(error);
  }
};