import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import session from 'express-session';
export const register = async(req, res) => {
    const { name, email, password, chantierId  } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            chantier: {
            connect: { id: parseInt(chantierId) } // connect to existing chantier
            }
        }
    });
    if (!user) {
        return res.status(500).send('User creation failed');
        
    }else {
        return res.status(201).json('welcome to our app');
    }
}
export const login = async (req, res) => {
    const { email, password } = req.body;
    

    const user = await prisma.user.findUnique({
        where: { email }
    });
    

    if (!user) {
        return res.status(401).render('auth/login.ejs', {
            errors: { general: 'Invalid email or password' },
            old: { email }
        });
    } else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            req.session.user = { id: user.id, name: user.name, email: user.email };
            req.session.save(() => {
                return res.redirect('/dashboard');
            });
        } else {
            return res.status(401).render('auth/login.ejs', {
                errors: { general: 'Invalid email or password' },
                old: { email }
            });
        }
    }
    
}
export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Could not log out');
        }
        res.redirect('/');
    });
}


// FJ46q/:EbJhYqLQj