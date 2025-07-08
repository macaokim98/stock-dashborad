import { Request, Response, NextFunction } from 'express';
export declare const getPortfolioOverview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPortfolioHoldings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPortfolioHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const removeHolding: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=portfolioController.d.ts.map