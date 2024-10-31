import app from './app.js';
import config from './config.js';
import cron  from 'node-cron';
import { resetOldContexts } from './modules/functions.js';
import { loadExistingClients, firstClient, clients } from './modules/whatsapp.js';

// Programar la tarea para que se ejecute diariamente a la medianoche
cron.schedule('0 0 * * *', () => {
    console.log('Ejecutando limpieza de contextos antiguos...');
    resetOldContexts().then(() => {
        console.log('Contextos antiguos reseteados.');
    }).catch((error) => {
        console.error('Error reseteando contextos antiguos:', error);
    });
});

let server;

loadExistingClients().then(clients => {
    console.log('Clients loaded:', clients);
    console.log('First client:', firstClient);

    server = app.listen(config.port, function () {
        console.log('Express server listening on port ' + server.address().port);
    });

}).catch(error => {
    console.error('Error loading clients:', error);
    process.exit(1);
});


export default server;