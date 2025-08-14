import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';


import session from 'express-session';
import expressMySQLSession from 'express-mysql-session';
import { dashboardRouter } from './routes/dashboard.js';
import { authRouter } from './routes/auth.js';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS as the view engine

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const PORT = 5000 ;


// Serve static files from SB Admin 2 folder
app.use(express.static(path.join(__dirname, 'public')));

const MySQLStore = expressMySQLSession(session);
const sessionStore = new MySQLStore({
    host: 'confonda.cpmgwqsgyfq7.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'alifathan-66',
    database: 'confonda'
});
app.set('trust proxy', 1);
session({
  cookie: {
    secure: true, // if HTTPS
    sameSite: 'none'
  }
})

app.use(session({
    secret: 'phpvsnodejs', // secret key to sign the session ID
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        secure: true, // set to true if using HTTPS
        httpOnly: true
    }
}));

// Basic route to render index.ejs



app.use(authRouter);
app.use(dashboardRouter);
// Dashboard route


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});