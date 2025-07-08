import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: ApiError, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorMiddleware.d.ts.map