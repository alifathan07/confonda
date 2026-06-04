import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import gradient from 'gradient-string';
import methodOverride from 'method-override';

import session from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const { $Enums } = prisma; 
import { dashboardRouter } from './routes/dashboard.js';
import { authRouter } from './routes/auth.js';
import PDFDocument from "pdfkit";
import fs from "fs";
import { generateBcPDF } from './controllers/bcController.js';
import { postUser, userData } from './controllers/usersController.js';
import { apiRouter } from './routes/api.js';
import { checkPopups } from './middlewares/popups.js';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride("_method")); // must be before routers

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const PORT = process.env.PORT || 3000;


// Serve static files from SB Admin 2 folder
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MySQLStore = expressMySQLSession(session);
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'confonda_dev'
});
app.set('trust proxy', 1);

// 
app.use(session({
    secret: 'phpvsnodejs', // secret key to sign the session ID
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        secure: false, // set to true if using HTTPS
        httpOnly: true
    }
}));

// Global popup middleware - runs on every request
app.use(checkPopups);

const PUBLIC_BC_SECRET = process.env.PUBLIC_BC_SECRET || 'confonda_public_bc_secret';

function signPublicBcId(id) {
    return crypto
        .createHmac('sha256', PUBLIC_BC_SECRET)
        .update(String(id))
        .digest('hex');
}



// Public BC view (NO AUTH) - accessed via signed URL /public/bc/:id?sig=...
app.get('/public/bc/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const sig = (req.query.sig || '').toString();
        const view = (req.query.view || '').toString();
        if (!id || Number.isNaN(id)) {
            return res.status(400).send('ID invalide');
        }
        const expected = signPublicBcId(id);
        if (!sig || sig !== expected) {
            return res.status(403).send('Lien invalide');
        }

        // Default behavior: auto-download PDF
        // Optional: open HTML preview with ?view=1
        if (view !== '1') {
            return generateBcPDF(req, res);
        }

        const bc = await prisma.bondeCommande.findUnique({
            where: { id },
            include: {
                commandesItems: {
                    include: {
                        BondeCommandeChantierItem: { include: { chantier: true } }
                    }
                },
                fournisseur: true,
                chantier: true,
            }
        });

        if (!bc) {
            return res.status(404).send('Bon de commande non trouvé');
        }

        const publicBcUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        // Render dedicated public template (no dashboard sidebar/topbar)
        return res.render('public/bc', { bc, publicBcUrl });
    } catch (e) {
        console.error('Erreur public BC:', e);
        return res.status(500).send('Erreur serveur');
    }
});


// JWT API for React Native (separate from session-based web auth)
app.use('/api', apiRouter);

app.use(authRouter);
app.use(dashboardRouter);

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(gradient(['cyan', 'pink'])(`Server is running on http://localhost:${PORT}`));
});
