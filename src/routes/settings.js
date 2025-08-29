const express = require('express');
const {
  getUserSettings,
  updateUserSettings,
  migrateLocalStorageData,
  getAvailableCurrencies,
  getUserCurrencySymbol
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { validate, settingsSchemas } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/settings/currencies
// @desc    Get available currencies (public)
// @access  Public
router.get('/currencies', getAvailableCurrencies);

// All other routes are protected
router.use(protect);

// @route   GET /api/settings/currency-symbol
// @desc    Get user's current currency symbol
// @access  Private
router.get('/currency-symbol', getUserCurrencySymbol);

// @route   GET /api/settings
// @desc    Get user settings
// @access  Private
router.get('/', getUserSettings);

// @route   PUT /api/settings
// @desc    Update user settings
// @access  Private
router.put('/', validate(settingsSchemas.update), updateUserSettings);

// @route   POST /api/settings/migrate
// @desc    Migrate localStorage data to MongoDB
// @access  Private
router.post('/migrate', validate(settingsSchemas.migrate), migrateLocalStorageData);

module.exports = router;
