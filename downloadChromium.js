// downloadChromium.js
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';

(async () => {
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download('1269260');
    console.log(`Chromium downloaded to ${revisionInfo.folderPath}`);
})();