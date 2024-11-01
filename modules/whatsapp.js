import qrcode from 'qrcode-terminal';
import qrcodeLib from 'qrcode';
import pkg from 'whatsapp-web.js';
import { config as dotenv } from 'dotenv';
dotenv();
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
//import puppeteer from 'puppeteer';
import { __dirname } from '../app.js';
const { Client, RemoteAuth, Buttons, List, MessageMedia } = pkg;
import { MongoStore } from 'wwebjs-mongo';
import mongoose from 'mongoose'
import {
    sendQRbyEmail,
    sendReplyWithStar,
    resetUserContext,
    transcribeAudio,
    getAIResponse,
    getExecutablePath,
} from './functions.js'
import puppeteerConfig from '../.puppeteerrc.mjs';

export const clients = [];

// Merge the Puppeteer configuration with the default options
const mergedConfig = Object.assign({}, puppeteerConfig, {
    // Add other default options here if needed
});

// Launch Puppeteer with the merged configuration
const launchOptions = {
    headless: true, // 'new', // Add other launch options here if needed
    ...mergedConfig, // Spread the merged configuration here
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    executablePath: getExecutablePath(),    
    timeout: 1000000, // Set timeout to 120 seconds or adjust as needed
    //defaultViewport: null, // Add this line to disable viewport
    // Add the following line to increase protocolTimeout
    //protocolTimeout: 720000, // Set protocolTimeout to 360 seconds or adjust as needed
};

// Función para iniciar Puppeteer con los argumentos necesarios
async function startPuppeteer() {
    const browser = await puppeteer.launch(launchOptions);    
    return browser;
}
// Conexión a MongoDB
try {
    await mongoose.connect(process.env.MONGODB_URI);
    if (mongoose.connection.readyState === 1) {
        console.log('Conectado exitosamente a MongoDB');
    }
} catch (err) {
    console.error('Error al conectar a MongoDB:', err);
}

// Llama a la función para iniciar Puppeteer
async function initializeClient(user, email) {
    let cleanEmail;
    try {
        cleanEmail = email.replace(/@/g, '-').replace(/\./g, '_').replace(/[^a-zA-Z0-9-_@.]/g, '');
    } catch (error) {
        console.error('Error al limpiar el email:', error);
        cleanEmail = 'mail@mail.com';
    }
    const sessionName = `${user}-_${cleanEmail}`;
    const clientId = `${user}-_${cleanEmail}`;
    const store = new MongoStore({ mongoose: mongoose });
    const SESSIONS_PATH = path.resolve(__dirname, '../');
    
    let puppeteerOptions
    
    new Promise((resolve, reject) => {
        startPuppeteer().then(browser => {
            const puppeteerOptions = {
                browser: browser
            };
            resolve(puppeteerOptions.browser);
            return puppeteerOptions
        }).catch(err => {
            reject(err);
        });
    });

    const datapath = path.join(__dirname, 'data')
    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: clientId,
            //dataPath: datapath,
            store: store,
            backupSyncIntervalMs: 60000,
            puppeteer: puppeteerOptions,            
            dumpio: true,
        })
    })

    clients[sessionName] = client;

    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
        qrcodeLib.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error al generar el código QR:', err);
                return;
            }
            const mail = (client.options.authStrategy.clientId).split('-_')[1].replace('_', '.').replace('-', '@').replace('_', '.');
            console.log('email:', mail);
            sendQRbyEmail(url.split(',')[1], `${mail}`);
            console.log(`QR code generated and Emailed to ${mail}`);
        });
    });

    client.on('ready', () => {
        const clientInfo = client.info;
        if (clientInfo) {
            const pushname = clientInfo.pushname;
            const userId_from = clientInfo.wid.user;
            console.log('Name:', pushname);
            console.log('User:', userId_from);
            console.log(`WhatsApp client ${sessionName} is ready!`);
            // saveSessionToDB(sessionName, store); // Descomentar si se va a guardar en la base de datos
            return userId_from;
        } else {
            console.error('Client info is not available.');
        }
    });

    client.on('auth_failure', msg => {
        console.error('Authentication failed:', msg);
        process.exit(1);
    });

    client.on('remote_session_saved', () => {
        console.log('**********Remote session saved***************');
    });

    client.on('disconnected', async (reason) => {
        console.log(`Client ${sessionName} disconnected:`, reason);
        const clientInstance = clients[sessionName];

        if (clientInstance && reason === 'LOGOUT') {
            try {
                await clientInstance.destroy();
                delete clients[sessionName];

                const sessionFolder = path.join(__dirname, '.wwebjs_auth', `RemoteAuth-${sessionName}`);
                setTimeout(() => {
                    fs.rm(sessionFolder, { recursive: true, force: true }, (err) => {
                        if (err) {
                            console.error(`Error al eliminar la carpeta de la sesión ${sessionName}:`, err);
                        } else {
                            console.log(`Sesión ${sessionName} detenida y carpeta eliminada.`);
                        }
                    });
                }, 1500);
            } catch (error) {
                console.error(`Error al detener la sesión ${sessionName}:`, error);
            }
        } else {
            console.error(`La sesión ${sessionName} no está en funcionamiento o no se desconectó por LOGOUT.`);
        }
    });

    client.on('reconnecting', () => {
        console.log('Client is reconnecting...');
    });

    client.on('message', async msg => {
        const fromNumber = msg.from;
        const parts = fromNumber.split('@');
        const userId = parts[0];
        const name_to = msg._data.notifyName;
        if (msg.body == '!ping') {
            console.log('Datos Cliente:', `{ User: ${userId}, Name: ${name_to} }`);
            await sendReplyWithStar(msg, `pong para ${userId}, ${name_to}`);
            msg.react('👍');
        } else if (msg.body == '!help' || msg.body == '!Help' || msg.body == 'help' || msg.body == 'Help') {
            msg.reply('Los comandos disponibles son:\n!ping - Responde pong\n!info - Información del bot\n!chat - !chat + tu_mensaje (para consultar a la IA)');
            msg.react('ℹ️');
        } else if (msg.body == '!info') {
            msg.reply(`This is a WhatsApp's Bot AI Powered made by RSⓇ`);
            msg.react('📄');
        } else if (msg.body == '!reset') {
            await resetUserContext(userId);
            msg.reply('Tu contexto ha sido restablecido.');
            msg.react('🔄');
        } else if (msg.body.startsWith('!chat ')) {
            const query = msg.body.replace('!chat ', '');
            const response = await getAIResponse(query, userId);
            await client.sendSeen(msg.from);
            msg.reply('Gracias por su consulta, espere la respuesta de la IA');
            msg._data.star = true;
            msg._data.isStarred = true;
            if (msg.body && msg)
                msg.reply(response);
            else {
                msg.reply('Por favor, !chat + su consulta a la IA.');
            }
            msg.react('💬');
        } else {
            if (!(msg.hasMedia) && (msg.type === 'chat') && (msg._data.subtype !== 'url') && (msg._data.from !== 'status@broadcast')) {
                console.log('Received text message:', msg);
                await client.sendSeen(msg.from);
                //msg.react('👍');
                const buttons = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": msg.from,  // Reemplaza con el número de teléfono del destinatario
                    "type": "interactive",
                    "interactive": {
                        "type": "button",
                        "body": {
                            "text": "¿Qué te gustaría hacer?"
                        },
                        "action": {
                            "buttons": [
                                {
                                    "type": "reply",
                                    "reply": {
                                        "id": "btn1",
                                        "title": "Opción 1"
                                    }
                                },
                                {
                                    "type": "reply",
                                    "reply": {
                                        "id": "btn2",
                                        "title": "Opción 2"
                                    }
                                },
                                {
                                    "type": "reply",
                                    "reply": {
                                        "id": "btn3",
                                        "title": "Opción 3"
                                    }
                                }
                            ]
                        }
                    }
                };
                //msg.reply(`${buttons}`);

                //client.sendMessage(msg.from, buttons);

                msg._data.star = true;
                msg._data.isStarred = true;
                console.log(`Message from ${name_to}: ${msg.body}, ${msg._data.star}, ${msg._data.isStarred}`);
            }
        }
        if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
            console.log('Received audio message:', msg);
            const media = await msg.downloadMedia();
            console.log('Media:', media);
            if (media && media.mimetype == 'audio/ogg; codecs=opus') {
                const filePath = `./${msg.id._serialized}.${media.mimetype.split('/')[1].split(';')[0]}`;
                fs.writeFileSync(filePath, media.data, { encoding: 'base64' });
                console.log('Identificador de usuario:', userId);
                const transcription = await transcribeAudio(filePath);
                console.log('Transcribed:', transcription);
                console.log(`Message from ${name_to}: ${msg.body}`);
                const aiResponse = await getAIResponse(transcription, userId);
                msg.reply(aiResponse);
            }
        }
        return userId;
    });

    client.on('change_state', (state) => {
        console.log('Client state changed:', state);
    });

    client.on('change_session', (state) => {
        console.log('Client session changed:', state);
    });

    client.on('error', async (error) => {
        console.error('WhatsApp Client Error:', error);

        // Handle specific error messages and codes
        if (error.code === 'ECONNRESET') {
            console.warn('Connection reset detected. Reinitializing in 10 seconds...');
            setTimeout(() => client.initialize(), 10000);

        } else if (error.code === 'ENOTFOUND') {
            console.warn('Network issue: Host not found. Rechecking in 30 seconds...');
            setTimeout(() => client.initialize(), 30000);

        } else if (error.code === 'ETIMEDOUT') {
            console.warn('Connection timed out. Retrying initialization in 20 seconds...');
            setTimeout(() => client.initialize(), 20000);

        } else if (error.message.includes('Execution context was destroyed')) {
            console.log('Handling "Execution context was destroyed" error. Attempting recovery...');
            try {
                await client.destroy();  // Clean up the existing client instance
                await client.initialize();  // Reinitialize the client
                console.log('Reconnection attempt successful.');
            } catch (reconnectError) {
                console.error('Error during reconnection attempt:', reconnectError);
            }

        } else {
            // General error handling for unhandled cases
            console.warn('Unhandled client error encountered. Restarting client as a fallback.');
            setTimeout(() => client.initialize(), 15000);
        }
    });

    client.initialize();
    return client;
};

export async function loadExistingClients(client) {
    const authPath = path.join(__dirname, '.wwebjs_auth');
    console.log('authPath:', authPath);

    // Ensure the auth directory exists
    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
        console.log(`Created auth directory at: ${authPath}`);
    }

    // Read existing session folders
    fs.readdirSync(authPath).forEach(folder => {
        if (folder.startsWith('RemoteAuth-')) {
            const sessionName = folder.replace('RemoteAuth-', '').split('-_')[0];
            const email = folder.replace('RemoteAuth-', '').split('-_')[1].replace('_', '.').replace('-', '@').replace('_', '.');
            console.log('Cargando sesión:', sessionName, 'Email:', email);
            initializeClient(sessionName, email);
            clients[sessionName] = client;
        }
    });

    return clients;
}
const clientKeys = Object.keys(clients);
const firstClientKey = clientKeys[0];
export const firstClient = clients[firstClientKey];

export default initializeClient;