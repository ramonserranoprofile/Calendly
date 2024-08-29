import express from 'express';

const routerApi = express.Router();

routerApi.get('/', (req, res) => {
    res.send('Bienvenido a WHABOTAPI')
});

export default routerApi;