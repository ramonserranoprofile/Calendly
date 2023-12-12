import purgecss from '@fullhuman/postcss-purgecss';

const runPurgeCSS = async () => {
    const options = {
        content: [
            './**/*.html',
            './**/js/*.js',
            // Add any other file types or paths your project uses
        ],
        css: ['./**/css/*.css'], // Path to your main CSS file
        // Other configuration options...
    };

    const result = purgecss(options);

    // Haz algo con el resultado si es necesario
    console.log(result);
};

runPurgeCSS();