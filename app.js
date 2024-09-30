import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import dotenv from 'dotenv';
import routerApi from './src/routes/routes.js';
import router from './src/routes/router.js';
import OpenAI from 'openai';
import { loadExistingClients } from './modules/whatsapp.js';
import winston from 'winston';
import logger from 'morgan';
import favicon from 'serve-favicon';
dotenv.config();

const app = express();

app.use(express.json());

// Configuración de middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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


// Establecer la ubicación de las vistas

// Obtenemos __filename
const __filename = fileURLToPath(import.meta.url);

// Obtenemos __dirname
export const __dirname = path.dirname(__filename);

console.log('RAIZ:', __dirname);
app.set('views', path.join(__dirname, 'views'));
console.log('VIEWS:', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // o el motor que estés usando

app.use(express.static(path.join(__dirname, 'templates')));
app.use('/static', express.static(path.join(__dirname, 'static')));
// Configurar favicon
app.use(favicon(path.join(__dirname, 'static', 'icons', 'favicon.ico')));
// Configuración de Morgan para registro de solicitudes
// app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'logs/traccess.log'), { flags: 'a' }) }));
app.use(logger('dev'));


// Cargar routers

app.use('/', router);
app.use('/api', routerApi);

// Función para cargar los clientes existentes al iniciar la aplicación
loadExistingClients();

// Middleware para manejar errores 404
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('error', { message: err.message });
});

export default app;