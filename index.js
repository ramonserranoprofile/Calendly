import app from './app.js';
import config from './config.js';


const server = app.listen(config.port, function () {
    console.log('Express server listening on port ' + server.address().port);
});

export default server;