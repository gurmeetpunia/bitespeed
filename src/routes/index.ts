import { Router } from 'express';
import { identifyController } from '../controllers/identifyController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// Main identify endpoint
router.post('/identify', identifyController);

export default router;