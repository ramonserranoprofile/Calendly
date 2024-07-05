import postcss from 'postcss';
import purgecss from '@fullhuman/postcss-purgecss';
import cheerio from 'cheerio';
import safeParser from 'postcss-safe-parser';
import fs from 'fs';
import path from 'path';
import { sync as globSync } from 'glob'; // Importa específicamente 'sync' desde 'glob'

// Function to run PurgeCSS y js
const runPurgeCSS = async () => {
    console.log('Starting PurgeCSS...');

    const options = {
        content: [
            './**/*.html',
            './**/*.js',
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    };

    const cssFiles = globSync('./static/css/*.css'); // Utiliza globSync para obtener la lista de archivos CSS
    console.log('CSS files found:', cssFiles);

    // Procesa cada archivo CSS encontrado
    cssFiles.forEach(cssFilePath => {
        const css = fs.readFileSync(cssFilePath, 'utf8');

        postcss([purgecss(options)])
            .process(css, { from: cssFilePath, to: cssFilePath })
            .then(result => {
                // Escribe el CSS procesado de vuelta al mismo archivo
                fs.writeFileSync(cssFilePath, result.css);

                if (result.map) {
                    fs.writeFileSync(`${cssFilePath}.map`, result.map.toString());
                }

                console.log(`PurgeCSS processed: ${cssFilePath}`);
            })
            .catch(err => {
                console.error('Error processing CSS:', err);
            });
    });

    console.log('PurgeCSS has successfully processed all CSS files.');
};

// Ejecuta la función para purgar css y js
runPurgeCSS().catch(err => {
    console.error('Error running PurgeCSS:', err);
});



const cssFilePath = './static/css/*.css'; // Ruta a tu archivo CSS principal
// Función para extraer selectores de los archivos CSS
const extractCSSSelectors = (cssFilePath) => {
    const cssFiles = globSync(cssFilePath);
    console.log('CSS files found 1:', cssFiles);
    const cssContent = fs.readFileSync(`${cssFiles[1]}`, 'utf8');
    const root = postcss.parse(cssContent, { parser: safeParser });
    const selectors = new Set();
    console.log('CSS Selectors 2:', selectors);

    root.walkRules(rule => {
        rule.selectors.forEach(selector => selectors.add(selector));
    });

    return Array.from(selectors);
};


// Función para purgar archivos HTML
const purgeHTMLFiles = async (cssFilePath) => {
    const usedSelectors = extractCSSSelectors(cssFilePath);
    const htmlPattern = './**/*.html'; // Patrón para buscar archivos HTML

    globSync(htmlPattern, {}, (err, files) => {
        if (err) {
            console.error('Error al buscar archivos HTML:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.resolve(file);
            const originalHtml = fs.readFileSync(filePath, 'utf8');
            const $ = cheerio.load(originalHtml);

            // Eliminar elementos no usados
            $('*').each((i, el) => {
                const element = $(el);
                const classes = element.attr('class');
                const id = element.attr('id');

                if (classes) {
                    const classList = classes.split(/\s+/);
                    const isClassUsed = classList.some(cls => usedSelectors.includes(`.${cls}`));
                    if (!isClassUsed) {
                        element.remove();
                        return;
                    }
                }

                if (id && !usedSelectors.includes(`#${id}`)) {
                    element.remove();
                    return;
                }
            });

            const purgedHtml = $.html();
            fs.writeFileSync(filePath, purgedHtml, 'utf8');
            console.log(`Archivo purgado: ${filePath}`);
        });
    });
};
// Ejecutar la función para purgar archivos HTML
purgeHTMLFiles(cssFilePath).catch(err => {
    console.error('Error purging HTML files:', err);
});

