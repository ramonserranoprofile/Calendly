import express from 'express';
import initializeClient, { clients } from '../modules/whatsapp.js';
// import ivrRouter from './ivr/routes.js';

const router = express.Router();

// Página principal

router.get('/api', (req, res) => {
    res.render('index', { title: 'Esto es Api' });
});

router.get('/', (req, res) => {
    res.send('Bienvenido a WHABOTAPI')
});

// Integrar rutas crear chatBot con la app
// Ruta para iniciar una nueva sesión de WhatsApp
// router.post('/start/:sessionName/:email', (req, res) => {
//     const sessionName = req.params.sessionName;
//     const email = req.params.email;

//     if (clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`]) {
//         console.log(`La sesión ${sessionName} ya está en funcionamiento.`);
//         clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`].initialize();
//         return res.status(400).send(`La sesión ${sessionName} ya está en funcionamiento.`);
//     }

//     try {
//         initializeClient(sessionName, email);
//         console.log(`Sesión ${sessionName} iniciada con el correo ${email}`);
//         // console.log('CLIENTS:', clients);
//         res.send(`Sesión ${sessionName} iniciada.`);

//     } catch (error) {
//         console.error(`Error al iniciar la sesión ${sessionName}:`, error);
//         res.status(500).send(`Error al iniciar la sesión ${sessionName}.`);
//     }
// });

// // Ruta para detener el cliente y eliminar una sesión de WhatsApp por medio del borrado de la carpeta en local
// router.post('/stop/:sessionName/:email', async (req, res) => {
//     const sessionName = req.params.sessionName;
//     const email = req.params.email;

//     if (clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`]) {
//         try {
//             const client = clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`];
//             await client.logout(); // Destruir el cliente
//             delete clients[sessionName]; // Eliminar la sesión del objeto clients
//             // Eliminar la carpeta de la sesión
//             // const sessionFolder = path.join('.wwebjs_auth', `RemoteAuth-${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`);
//             // fs.rm(sessionFolder, { recursive: true, force: true }, (err) => {
//             //     if (err) {
//             //         console.error(`Error al eliminar la carpeta de la sesión ${sessionName}:`, err);
//             //         return res.status(500).send(`Error al eliminar la carpeta de la sesión ${sessionName}.`);
//             //     }
//             //     console.log(`Sesión ${sessionName} detenida y carpeta eliminada.`);
//             //     res.send(`Sesión ${sessionName} detenida y carpeta eliminada.`);
//             // });
//         } catch (error) {
//             console.error(`Error al detener la sesión ${sessionName}:`, error);
//             return res.status(500).send(`Error al detener la sesión ${sessionName}.`);
//         }
//     } else {
//         res.status(400).send(`La sesión ${sessionName} no está en funcionamiento.`);
//     }
// });

// // Ruta para pausar una sesión de WhatsApp sin eliminarla
// router.post('/pause/:sessionName/:email', async (req, res) => {
//     const sessionName = req.params.sessionName;
//     const email = req.params.email;

//     if (clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`]) {
//         try {
//             const client = clients[`${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`];
//             await client.destroy();  // No destruyas la sesión, simplemente usa logout en lugas de destroy. 
//             // delete clients[sessionName];            
//             console.log(`Sesión ${sessionName} pausada.`);
//             res.send(`Sesión ${sessionName} pausada.`);
//             // Eliminar la carpeta de la sesión
//             // const sessionFolder = path.join('.wwebjs_auth', `RemoteAuth-${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`);
//             // fs.rm(sessionFolder, { recursive: true, force: true }, (err) => {
//             //     if (err) {
//             //         console.error(`Error al eliminar la carpeta de la sesión ${sessionName}:`, err);
//             //         return res.status(500).send(`Error al eliminar la carpeta de la sesión ${sessionName}.`);
//             //     }
//             //     console.log(`Sesión ${sessionName} detenida y carpeta eliminada.`);
//             //     res.send(`Sesión ${sessionName} detenida y carpeta eliminada.`);
//             // });
//         } catch (error) {
//             console.error(`Error al pausar la sesión ${sessionName}:`, error);
//             return res.status(500).send(`Error al pausar la sesión ${sessionName}.`);
//         }
//     } else {
//         res.status(400).send(`La sesión ${sessionName} no está en funcionamiento.`);
//     }
// });

// router.post('/clients_request', (req, res) => {
//     res.json(clients);
// });

// Ruta GET para iniciar una nueva sesión de WhatsApp
router.get('/start/:sessionName/:email', (req, res) => {
    // Aquí puedes realizar cualquier lógica adicional antes de redirigir
    const sessionName = req.params.sessionName;
    const email = req.params.email;
    // Redirigir la solicitud GET a la ruta POST /start/:sessionName/:email
    res.redirect(307, `/start/${sessionName}/${email}`);
});

// Ruta para iniciar una nueva sesión de WhatsApp
router.post('/start/:sessionName/:email', (req, res) => {
    const sessionName = req.params.sessionName;
    const email = req.params.email;

    const clientKey = `${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`;

    if (clients[clientKey]) {
        console.log(`La sesión ${sessionName} ya está en funcionamiento.`);
        clients[clientKey].initialize();
        return res.status(400).send(`La sesión ${sessionName} ya está en funcionamiento.`);
    }

    try {
        initializeClient(sessionName, email);
        console.log(`Sesión ${sessionName} iniciada con el correo ${email}`);
        res.send(`Sesión ${sessionName} iniciada.`);
    } catch (error) {
        console.error(`Error al iniciar la sesión ${sessionName}:`, error);
        res.status(500).send(`Error al iniciar la sesión ${sessionName}.`);
    }
});

// Ruta para detener el cliente y eliminar una sesión de WhatsApp por medio del borrado de la carpeta en local
router.post('/stop/:sessionName/:email', async (req, res) => {
    const sessionName = req.params.sessionName;
    const email = req.params.email;

    const clientKey = `${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`;

    if (clients[clientKey]) {
        try {
            const client = clients[clientKey];
            await client.logout(); // Destruir el cliente
            delete clients[clientKey]; // Eliminar la sesión del objeto clients
            console.log(`Sesión ${sessionName} detenida y eliminada.`);
            res.send(`Sesión ${sessionName} detenida y eliminada.`);
        } catch (error) {
            console.error(`Error al detener la sesión ${sessionName}:`, error);
            return res.status(500).send(`Error al detener la sesión ${sessionName}.`);
        }
    } else {
        res.status(400).send(`La sesión ${sessionName} no está en funcionamiento.`);
    }
});

// Ruta para pausar una sesión de WhatsApp sin eliminarla
router.post('/pause/:sessionName/:email', async (req, res) => {
    const sessionName = req.params.sessionName;
    const email = req.params.email;

    const clientKey = `${sessionName}-_${email.replace('.', '_').replace('@', '-').replace('.', '_')}`;

    if (clients[clientKey]) {
        try {
            const client = clients[clientKey];
            await client.destroy();  // Destruir el cliente
            console.log(`Sesión ${sessionName} pausada.`);
            res.send(`Sesión ${sessionName} pausada.`);
        } catch (error) {
            console.error(`Error al pausar la sesión ${sessionName}:`, error);
            return res.status(500).send(`Error al pausar la sesión ${sessionName}.`);
        }
    } else {
        res.status(400).send(`La sesión ${sessionName} no está en funcionamiento.`);
    }
});

router.post('/clients_request', (req, res) => {
    res.json(clients);
});

export default router;