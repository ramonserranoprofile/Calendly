import app from './app.js';
import config from './config.js';
import { config as dotenv } from 'dotenv';
dotenv();

const server = app.listen(config.port, function () {
    console.log('Express server listening on port ' + server.address().port);
});

export default server;