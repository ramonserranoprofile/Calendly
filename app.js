import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import { config as dotenv } from 'dotenv';
import router from './src/routes.js';
import { OpenAI } from 'openai';
import { loadExistingClients } from '../../modules/whatsapp.js';
import winston from 'winston';
import logger from 'morgan';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import session from 'express-session'; // Necesario para usar csrf con sesiones
dotenv();

const app = express();

// MIDDLEWARES DE SEGURIDAD
// app.disable('etag');
// app.disable('x-powered-by-header');
// app.disable('x-powered-by');

// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutos
//     max: 100, // limita cada IP a 100 solicitudes por ventana de 15 minutos
//     standardHeaders: true, // Envia la información de tasa en los headers 'RateLimit-*'
//     legacyHeaders: false, // Desactiva los headers 'X-RateLimit-*'
//     message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo después de un tiempo.',
// });
// // Aplica el middleware a todas las rutas
// app.use(limiter);

// app.use((req, res, next) => {
//     res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self';");
//     next();
// });

// app.use(session({
//     secret: process.env.CSRF_SECRET, // Debes proporcionar un secreto seguro aquí
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false } // Asegúrate de que este valor esté en true si usas HTTPS
// }));

//const csrfProtection = csrf({ cookie: false });
//app.use(csrfProtection);

// app.use((req, res, next) => {
//     res.locals.csrfToken = req.csrfToken();
//     next();
// });

// FIN MIDDLEWARES DE SEGURIDAD

// Establecer la ubicación de las vistas
// Obtén el directorio actual
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Crear el directorio y archivo de log si no existen
const logsDir = path.join(__dirname, 'logs');
const logFile = path.join(logsDir, 'traccess.log');

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}
// Configuración de Morgan para registro de solicitudes
app.use(logger('dev'));
app.use(morgan('combined', { stream: fs.createWriteStream(logFile, { flags: 'a' }) }));
app.use(express.json());
// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Configuración de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Configura el logger para semdMessage
export const loggerWinston = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

const SESSIONS_PATH = path.resolve(__dirname, '../');

// Cargar routers
app.use('/', router, (req, res) => {
    res.render('index', { title: 'Esto es root' });
});

// Función para cargar los clientes existentes al iniciar la aplicación
loadExistingClients();

// Middleware para manejar errores 404

// Manejo de errores CSRF
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        // Token CSRF inválido o faltante
        res.status(403);
        res.send('La solicitud no es segura, por favor intenta de nuevo.');
    } else {
        next(err);
    }
});
// Error handling middleware
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('error', { message: err.message });
});

export default app;