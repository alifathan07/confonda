import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import gradient from 'gradient-string';
import methodOverride from 'method-override';

import session from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import { $Enums } from '@prisma/client';
import { dashboardRouter } from './routes/dashboard.js';
import { authRouter } from './routes/auth.js';
import PDFDocument from "pdfkit";
import fs from "fs";
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(methodOverride('_method'));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));    
const PORT = process.env.PORT || 3000;


// Serve static files from SB Admin 2 folder
app.use(express.static(path.join(__dirname, 'public')));

const MySQLStore = expressMySQLSession(session);
const sessionStore = new MySQLStore({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'confonda'
});
app.set('trust proxy', 1);


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


// Basic route to render index.ejss


app.use(authRouter);
app.use(dashboardRouter);
// Dashboard route


// Start the server
app.listen(PORT, () => {
    console.log(gradient(['cyan', 'pink'])(`Server is running on http://localhost:${PORT}`));
});