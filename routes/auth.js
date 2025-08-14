import express from 'express';

import { login, logout, register } from '../controllers/authController.js';
import { redirectIfLoggedIn } from '../middlewares/auth.js';
export const authRouter = express.Router();
authRouter.get('/', redirectIfLoggedIn, (req, res) => {
    res.render('auth/login');
});

authRouter.post('/register', redirectIfLoggedIn, register);
authRouter.post('/login', redirectIfLoggedIn, login);

// logout should not be protected by redirectIfLoggedIn
authRouter.post('/logout', logout);
