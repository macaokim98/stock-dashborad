"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const portfolioController_1 = require("../controllers/portfolioController");
const router = express_1.default.Router();
// Portfolio routes (no authentication - using session/demo data)
router.get('/overview', portfolioController_1.getPortfolioOverview);
router.get('/holdings', portfolioController_1.getPortfolioHoldings);
router.get('/history', portfolioController_1.getPortfolioHistory);
router.post('/holdings', portfolioController_1.addHolding);
router.put('/holdings/:id', portfolioController_1.updateHolding);
router.delete('/holdings/:id', portfolioController_1.removeHolding);
exports.default = router;
//# sourceMappingURL=portfolioRoutes.js.map