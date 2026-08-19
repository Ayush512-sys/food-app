import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);

// Allow first user registration, or admin-only
router.post('/register', register); 

export default router;
