import { Request, Response, NextFunction } from 'express';
import { ApiError } from './errorMiddleware';

export const validateStockSymbol = (req: Request, res: Response, next: NextFunction) => {
  const { symbol } = req.params;
  
  if (!symbol) {
    const error = new Error('Stock symbol is required') as ApiError;
    error.statusCode = 400;
    return next(error);
  }

  // Basic symbol validation
  const symbolRegex = /^[A-Z]{1,5}$/;
  if (!symbolRegex.test(symbol.toUpperCase())) {
    const error = new Error('Invalid stock symbol format') as ApiError;
    error.statusCode = 400;
    return next(error);
  }

  next();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};