import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { signJwt } from '../middlewares/jwtAuth.js';

export const apiLogin = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const identifier = username || email;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'username/email and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ name: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      console.log('try again');
      return res.status(401).json({ error: 'Invalid credentials' });
            

    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
                  console.log('try again');

      return res.status(401).json({ error: 'Invalid credentials' });

      
    }

    const token = signJwt({
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      chantierId: user.chantierId,
    });
     console.log(token);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        chantierId: user.chantierId,
      },
     
      
    });
  } catch (e) {
    console.error('apiLogin error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const apiMe = async (req, res) => {
  // req.user is set by verifyJwt
  return res.json({ user: req.user });
};
