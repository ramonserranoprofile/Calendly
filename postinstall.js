import path from 'path'
import { execSync } from 'child_process'
import { __dirname } from './app.js'

// Obtener la ruta del directorio actual

// Define el directorio de caché
const cacheDir = path.join(__dirname, '.cache', 'puppeteer');

// Forzar la instalación de Chrome para Linux, independientemente del sistema operativo
try {
    console.log(`Forzando la instalación de Chrome en ${cacheDir} para Linux.`);
    execSync('npx puppeteer browsers install chrome --platform=linux', {
        env: { ...process.env, PUPPETEER_CACHE: cacheDir },
        stdio: 'inherit'
    });
} catch (error) {
    console.error('Error al instalar Chrome:', error.message);
}