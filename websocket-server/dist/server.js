"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const stockDataStreamer_1 = require("./services/stockDataStreamer");
const connectionManager_1 = require("./handlers/connectionManager");
const realTimeStockHandler_1 = require("./handlers/realTimeStockHandler");
const portfolioHandler_1 = require("./handlers/portfolioHandler");
const notificationHandler_1 = require("./handlers/notificationHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.WEBSOCKET_PORT || 3002;
// CORS configuration
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});
exports.io = io;
// Basic middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'WebSocket Server',
        timestamp: new Date().toISOString(),
        connections: io.engine.clientsCount,
        uptime: process.uptime()
    });
});
// Initialize services
const stockDataStreamer = new stockDataStreamer_1.StockDataStreamer();
const connectionManager = new connectionManager_1.ConnectionManager();
const stockHandler = new realTimeStockHandler_1.RealTimeStockHandler(stockDataStreamer);
const portfolioHandler = new portfolioHandler_1.PortfolioHandler();
const notificationHandler = new notificationHandler_1.NotificationHandler();
// Socket.IO connection handling
io.on('connection', (socket) => {
    logger_1.logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);
    // Register connection
    connectionManager.addConnection(socket);
    // Handle client events
    socket.on('subscribe_to_stocks', (symbols) => {
        stockHandler.subscribeToStocks(socket, symbols);
    });
    socket.on('unsubscribe_from_stocks', (symbols) => {
        stockHandler.unsubscribeFromStocks(socket, symbols);
    });
    socket.on('subscribe_to_portfolio', () => {
        portfolioHandler.subscribeToPortfolio(socket);
    });
    socket.on('unsubscribe_from_portfolio', () => {
        portfolioHandler.unsubscribeFromPortfolio(socket);
    });
    socket.on('subscribe_to_notifications', () => {
        notificationHandler.subscribeToNotifications(socket);
    });
    socket.on('set_price_alert', (data) => {
        notificationHandler.setPriceAlert(socket, data);
    });
    socket.on('remove_price_alert', (alertId) => {
        notificationHandler.removePriceAlert(socket, alertId);
    });
    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger_1.logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
        connectionManager.removeConnection(socket.id);
        stockHandler.unsubscribeFromAll(socket);
        portfolioHandler.unsubscribeFromPortfolio(socket);
        notificationHandler.unsubscribeFromNotifications(socket);
    });
    // Error handling
    socket.on('error', (error) => {
        logger_1.logger.error(`Socket error for ${socket.id}:`, error);
    });
});
// Start real-time data streaming
stockDataStreamer.start();
// Start server
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 WebSocket server running on port ${PORT}`);
    logger_1.logger.info(`📡 Real-time stock data streaming active`);
    logger_1.logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    stockDataStreamer.stop();
    server.close(() => {
        logger_1.logger.info('Server closed');
        process.exit(0);
    });
});
//# sourceMappingURL=server.js.map