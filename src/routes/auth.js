const express = require('express');
const { register, login, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(userSchemas.register), register);
router.post('/login', validate(userSchemas.login), login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;
