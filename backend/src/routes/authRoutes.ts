import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from '../validators/authValidators';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.get('/search', authenticate, authController.searchUsers);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put('/password', authenticate, validate(updatePasswordSchema), authController.updatePassword);

export default router;
