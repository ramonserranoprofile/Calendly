import path from 'path';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
/**
 * @type {import("puppeteer").Configuration}
 */

// Obtén el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define la ruta de la caché
const cacheDirectory = join(__dirname, '/app/.cache', 'puppeteer');

// Crea la carpeta de caché si no existe
if (!existsSync(cacheDirectory)) {
    mkdirSync(cacheDirectory, { recursive: true });
}

const puppeteerConfig = {
    // Cambia la ubicación de la caché para Puppeteer
    cacheDirectory: cacheDirectory,
};

export default puppeteerConfig;