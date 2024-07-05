import http from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import { config as dotenv } from 'dotenv';
import router from './src/routes.js';
import OpenAI from 'openai';
import { loadExistingClients } from './modules/whatsapp.js';
import winston from 'winston';
import logger from 'morgan';

dotenv();
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
        new winston.transports.File({ filename: 'app/logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'app/logs/combined.log' }),
    ],
});

// Establecer la ubicación de las vistas
export const __dirname = path.dirname(new URL(import.meta.url).pathname).substring(1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuración de Morgan para registro de solicitudes
app.use(morgan('combined', { stream: fs.createWriteStream(path.join(__dirname, 'app/logs/traccess.log'), { flags: 'a' }) }));
app.use(logger('dev'));
const SESSIONS_PATH = path.resolve(__dirname, '../');
console.log('SESSIONS_PATH:', `${ SESSIONS_PATH }\\.wwebjs_auth`);
// Cargar routers
app.use('/api', router);

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