const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { register, login, me, updateMe, changePassword } = require('../controllers/authController');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  minThreshold: z.number().int().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register',      validate(registerSchema), register);
router.post('/login',         validate(loginSchema),    login);
router.get('/me',             authMiddleware,           me);
router.put('/me',             authMiddleware,           updateMe);
router.put('/me/password',    authMiddleware,           changePassword);

module.exports = router;
