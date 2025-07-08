import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { StockDataStreamer } from './services/stockDataStreamer';
import { ConnectionManager } from './handlers/connectionManager';
import { RealTimeStockHandler } from './handlers/realTimeStockHandler';
import { PortfolioHandler } from './handlers/portfolioHandler';
import { NotificationHandler } from './handlers/notificationHandler';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.WEBSOCKET_PORT || 3002;

// CORS configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Basic middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

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
const stockDataStreamer = new StockDataStreamer();
const connectionManager = new ConnectionManager();
const stockHandler = new RealTimeStockHandler(stockDataStreamer);
const portfolioHandler = new PortfolioHandler();
const notificationHandler = new NotificationHandler();

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Register connection
  connectionManager.addConnection(socket);
  
  // Handle client events
  socket.on('subscribe_to_stocks', (symbols: string[]) => {
    stockHandler.subscribeToStocks(socket, symbols);
  });
  
  socket.on('unsubscribe_from_stocks', (symbols: string[]) => {
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
  
  socket.on('remove_price_alert', (alertId: string) => {
    notificationHandler.removePriceAlert(socket, alertId);
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    connectionManager.removeConnection(socket.id);
    stockHandler.unsubscribeFromAll(socket);
    portfolioHandler.unsubscribeFromPortfolio(socket);
    notificationHandler.unsubscribeFromNotifications(socket);
  });
  
  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

// Start real-time data streaming
stockDataStreamer.start();

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 WebSocket server running on port ${PORT}`);
  logger.info(`📡 Real-time stock data streaming active`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stockDataStreamer.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { io };