import app from './app.js';
import config from './config.js';


import { loadExistingClients, firstClient, clients } from './modules/whatsapp.js';


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