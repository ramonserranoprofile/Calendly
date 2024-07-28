// downloadChromium.js
import { createWriteStream } from 'fs';
import { get } from 'https';
import { join } from 'path';
import { execSync } from 'child_process';
import extract from 'extract-zip';
import { __dirname } from './app.js';
const downloadChromium = async () => {
    const url = 'https://github.com/chromium/chromium/archive/refs/tags/1269260.zip'; // URL de Chromium precompilado
    const zipPath = join(__dirname, 'chromium.zip');
    const extractPath = join(__dirname, 'chromium');

    console.log('Descargando Chromium...');

    const file = createWriteStream(zipPath);
    get(url, (response) => {
        response.pipe(file);
        file.on('finish', async () => {
            file.close();
            console.log('Chromium descargado. Extrayendo...');

            await extract(zipPath, { dir: extractPath });
            console.log('Chromium extraído a', extractPath);

            execSync(`rm ${zipPath}`); // Elimina el archivo zip después de extraer
            console.log('Chromium listo para usar.');
        });
    }).on('error', (err) => {
        console.error('Error descargando Chromium:', err.message);
    });
};

downloadChromium();