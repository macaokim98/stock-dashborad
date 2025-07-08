"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.validateEmail = exports.validateStockSymbol = void 0;
const validateStockSymbol = (req, res, next) => {
    const { symbol } = req.params;
    if (!symbol) {
        const error = new Error('Stock symbol is required');
        error.statusCode = 400;
        return next(error);
    }
    // Basic symbol validation
    const symbolRegex = /^[A-Z]{1,5}$/;
    if (!symbolRegex.test(symbol.toUpperCase())) {
        const error = new Error('Invalid stock symbol format');
        error.statusCode = 400;
        return next(error);
    }
    next();
};
exports.validateStockSymbol = validateStockSymbol;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
//# sourceMappingURL=validationMiddleware.js.map