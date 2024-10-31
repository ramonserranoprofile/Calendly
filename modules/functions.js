import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
import { openaiClient } from '../app.js'
import fs from 'fs';
import redis from '../Databases/redisDB.js';
import { OpenAI } from 'openai';
import { text } from 'express';
import https from 'https';
import os from 'os';

// Configuración del transporte de nodemailer
console.log('CORREO creds:', process.env.GMAIL_USER, process.env.GMAIL_PASS)

const transporter = nodemailer.createTransport({
    host: 'smtp.ionos.com',      // Servidor SMTP de IONOS
    port: 587,                   // Puerto para TLS
    secure: false,               // true para 465, false para otros puertos
    auth: {
        user: process.env.IONOS_USER, // Tu correo de IONOS
        pass: process.env.IONOS_PASS,              // Tu contraseña de IONOS
    },
    tls: {
        rejectUnauthorized: false, // Opcional, para evitar problemas de certificados SSL
    },
});

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS,
//     },
//     tls: {
//         rejectUnauthorized: false
//     },
// });

// Función para enviar el QR por correo

export const sendQRbyEmail = (qr, email) => {
    console.log('Enviando QR por correo...');
    const mailOptions = {
        from: `"QR Code Mailer" <${process.env.IONOS_USER}>`,
        to: email,
        subject: 'WhatsApp QR Code',
        text: 'Scan this QR code to connect to WhatsApp',
        html: `<p>Scan this QR code to connect to WhatsApp:</p><img src="cid:qrcode"/>`,
        attachments: [
            {
                filename: 'qrcode.png',
                content: qr,
                encoding: 'base64',
                cid: 'qrcode'
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
        } else {
            console.log('Código QR enviado por correo: ' + info.response);
        }
    });
};

// Función para marcar un mensaje como destacado
async function markMessageWithStar(msg) {
    await msg.react('⭐');
}

// Función para enviar una respuesta y marcarla como destacada
export async function sendReplyWithStar(msg, replyText) {
    const reply = await msg.reply(replyText);
    msg._data.star = true;
    msg._data.isStarred = true
    await markMessageWithStar(reply);
}

async function getUserContext(userId) {
    const context = await redis.get(`context:${userId}`);
    const parsedContext = context ? JSON.parse(context) : [];

    const maxContextSize = 10;
    if (parsedContext.length > maxContextSize) {
        return parsedContext.slice(-maxContextSize);
    }
    return parsedContext;
}

async function saveUserContext(userId, context) {
    const maxContextSize = 10;
    if (context.length > maxContextSize) {
        context = context.slice(-maxContextSize);
    }
    await redis.set(`context:${userId}`, JSON.stringify(context), 'EX', 86400); // Expire in 1 day
}

export async function resetUserContext(userId) {
    await redis.del(`context:${userId}`);
}

async function checkAndResetUserContext(userId) {
    const context = await redis.get(`context:${userId}`);
    if (context) {
        const parsedContext = JSON.parse(context);
        const currentTime = Date.now();
        const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;

        // Verificar si el contexto tiene más de 30 días
        if (parsedContext.length > 0 && (currentTime - parsedContext[0].timestamp) > thirtyDaysInMilliseconds) {
            await resetUserContext(userId);
        }
    }
}

export async function resetOldContexts() {
    const keys = await redis.keys('context:*');
    for (const key of keys) {
        const userId = key.split(':')[1];
        await checkAndResetUserContext(userId);
    }
}

export async function transcribeAudio(filePath) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const transcriptionResponse = await openaiClient.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: 'whisper-1',
                language: 'es',
                temperature: 0.5
            });

            const transcription = transcriptionResponse.text.trim();
            console.log('Transcription:', transcription);
            return transcription;
        } catch (error) {
            console.error(`Intento ${attempt + 1} - Error al transcribir el archivo de audio:`, error.message);
            if (error.response) {
                console.error('Detalles de la respuesta:', error.response.data);
            }
            attempt++;
            if (attempt >= maxRetries) {
                throw error; // Lanza el error después del último intento
            }
            // Espera antes de reintentar
            await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
            console.log('Eliminando archivo temporal:', filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('Archivo temporal eliminado:', filePath);
            }
        }
    }
}

export async function getAIResponse(message, userId) {
    const userContext = await getUserContext(userId);
    console.log('User Context:', userContext);
    const prompt = `Yo soy un Developer y tu eres un asistente con Inteligencia Artificial. te llamas DeVoP y estás para atender por mi a los clientes o personas que me escriban, si te preguntan sobre ti o sobre mi, respondeles corto y conciso, además, si preguntan sobre mis servicios, respondele de acuerdo a lo que esta en mi 'Website': 'https://www.ramonserranoprofile.tech', o en mi 'linkedin': 'https://www.linkedin.com/in/ramonserranoprofile', también mándalos a explorar mis medios de contacto:\nWebsite: https://www.ramonserranoprofile.com\nEmail: developer@ramonserranoprofile.com\nPhone: +5491125103169.; esos mensajes envialos cortos y en ingles y español y solo limitate a temas relacionados con el trabajo que yo como profesional de la tecnología puedo proporcionar, ¡no respondas nada de otros temas fuera de estos anteriormente explicados!.`;

    const messages = [
        { role: "system", content: prompt },
        ...userContext,
        { role: "user", content: message },
    ];

    for (let msg of messages) {
        if (typeof msg.content !== 'string' && !Array.isArray(msg.content)) {
            if (typeof msg.content === 'object' && msg.content !== null) {
                msg.content = JSON.stringify(msg.content);
            } else {
                throw new Error(`Invalid type for 'messages.content': expected a string or an array of objects, but got ${typeof msg.content}`);
            }
        }
    }

    const completion = await openaiClient.chat.completions.create({
        messages: messages,
        model: 'gpt-4o-2024-08-06',
        n: 1,
        max_tokens: 2000,
        stop: null,
        temperature: 0.7,
        user: userId,
        stream: true,

    });

    let responseMessage = '';
    try {
        for await (const chunk of completion) {
            const content = chunk.choices[0].delta?.content;
            if (content) {
                process.stdout.write(content);
                responseMessage += content;
            } else {
                console.error('Received undefined chunk content:', chunk);
            }
        }
    } catch (error) {
        console.error('Error processing completion stream:', error);
    }

    console.log('COMPLETION:', completion);
    //responseMessage = completion.choices[0].message.content;
    console.log('AI Response:', responseMessage);
    await saveUserContext(userId, [...userContext, { role: 'user', content: message }, { role: 'assistant', content: responseMessage }]);
    return responseMessage;
}

export function getExecutablePath() {
    const platform = os.platform();
    if (platform === 'win32') {
        return './.cache/puppeteer/chrome/win64-127.0.6533.88/chrome-win64/chrome.exe';
    } else if (platform === 'linux') {
        return '/usr/bin/google-chrome';
    } else {
        throw new Error('Unsupported platform: ' + platform);
    }
}