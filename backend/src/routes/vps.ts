import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/vps/plans
 * @desc    Get available VPS configuration options
 * @access  Public
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      cpu: { min: 1, max: 16, step: 1, pricePerCore: 5 },
      ram: { min: 1, max: 64, step: 1, pricePerGb: 4 },
      storage: { min: 10, max: 1000, step: 10, pricePerGb: 0.1 },
      operatingSystems: [
        { name: 'Ubuntu 22.04 LTS', price: 0 },
        { name: 'Debian 11', price: 0 },
        { name: 'CentOS Stream 9', price: 0 },
        { name: 'Windows Server 2022', price: 15 },
      ],
      datacenters: [
        { code: 'US-EAST-1', name: 'US East - Virginia' },
        { code: 'US-WEST-1', name: 'US West - California' },
        { code: 'EU-CENTRAL-1', name: 'EU Central - Frankfurt' },
        { code: 'EU-WEST-1', name: 'EU West - London' },
      ],
    },
  });
});

/**
 * @route   POST /api/vps/calculate-price
 * @desc    Calculate price for VPS configuration
 * @access  Public
 */
router.post('/calculate-price', (req, res) => {
  const { cpuCores, ramGb, storageGb, operatingSystem } = req.body;

  const cpuPrice = cpuCores * 5;
  const ramPrice = ramGb * 4;
  const storagePrice = storageGb * 0.1;
  const osPrice = operatingSystem.includes('Windows') ? 15 : 0;

  const totalPrice = cpuPrice + ramPrice + storagePrice + osPrice;

  res.json({
    success: true,
    data: {
      totalPrice: Number(totalPrice.toFixed(2)),
      breakdown: {
        cpu: cpuPrice,
        ram: ramPrice,
        storage: storagePrice,
        operatingSystem: osPrice,
      },
    },
  });
});

/**
 * @route   POST /api/vps/orders
 * @desc    Create new VPS order
 * @access  Private
 */
router.post('/orders', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Endpoint not yet implemented',
  });
});

/**
 * @route   GET /api/vps/orders
 * @desc    Get user's VPS orders
 * @access  Private
 */
router.get('/orders', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Endpoint not yet implemented',
  });
});

/**
 * @route   GET /api/vps/instances
 * @desc    Get user's VPS instances
 * @access  Private
 */
router.get('/instances', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Endpoint not yet implemented',
  });
});

export default router;