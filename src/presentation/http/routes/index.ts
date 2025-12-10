/**
 * Routes Index
 * Aggregates and exports all application routes
 */

import { Router } from 'express';
import roomRoutes from './room.routes.js';
import userRoutes from './user.routes.js';
import linkRoutes from './link.routes.js';
import chatRoutes from './chat.routes.js';
import authRoutes from './auth.routes.js';
import recordRoutes from './record.routes.js';
import healthRoutes from './health.routes.js';
import { container } from 'tsyringe';
import { UserController } from '../controllers/user.controller.js';
import { LinkController } from '../controllers/link.controller.js';
import { ChatController } from '../controllers/chat.controller.js';
import { RecordController } from '../controllers/record.controller.js';

const router = Router();

// Health check routes (no /api prefix)
router.use('/health', healthRoutes);

// API routes
router.use('/api/rooms', roomRoutes);
router.use('/api/users', userRoutes);
router.use('/api/links', linkRoutes);
router.use('/api/chat', chatRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/recordings', recordRoutes);

// Additional nested routes for better RESTful design
const userController = container.resolve(UserController);
const linkController = container.resolve(LinkController);
const chatController = container.resolve(ChatController);
const recordController = container.resolve(RecordController);

// Room-specific nested routes
router.get('/api/rooms/:roomName/users', userController.listUsers);
router.delete('/api/rooms/:roomName/users/:identity', userController.removeUser);
router.get('/api/rooms/:roomName/links', linkController.listLinks);
router.get('/api/rooms/:roomName/messages', chatController.getMessages);
router.post('/api/rooms/:roomName/messages/read', chatController.markAsRead);
router.post('/api/rooms/:roomName/recording/start', recordController.startRecording);
router.post('/api/rooms/:roomName/recording/stop', recordController.stopRecording);
router.get('/api/rooms/:roomName/recordings', recordController.listRecordings);

export default router;
