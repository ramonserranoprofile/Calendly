import nodemailer from 'nodemailer';
import { config as dotenv } from 'dotenv';
dotenv();
import { openaiClient } from '../app.js';
import fs from 'fs';
import redis from '../Databases/redisDB.js';




// Configuración del transporte de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ramonserrano76@gmail.com',
        pass: 'pfsackibbvbyphjs'
    },
    tls: {
        rejectUnauthorized: false
    },
});

// Función para enviar el QR por correo
export const sendQRbyEmail = (qr, email) => {
    console.log('Enviando QR por correo...');
    const mailOptions = {
        from: 'ramonserrano76@gmail.com',
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
    await redis.set(`context:${userId}`, JSON.stringify(context), 'EX', 3600); // Expire in 1 hour
}

export async function resetUserContext(userId) {
    await redis.del(`context:${userId}`);
}

export async function transcribeAudio(filePath) {
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
        console.error('Error al transcribir el archivo de audio:', error);
        throw error;
    } finally {
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {
            console.error('Error al eliminar archivos temporales:', err);
        }
    }
}

export async function getAIResponse(message, userId) {
    const userContext = await getUserContext(userId);
    console.log('User Context:', userContext);
    const prompt = `Yo soy un Developer y tu eres un asistente con Inteligencia Artificial para atender por mi a los clientes o personas que me escriban, sea lo que sea que quieran mandalos a explorar mis botones de contacto: "website: https://www.ramonserranoprofile.tech; Email: developer@ramonserranoprofile.tech; Phone: +5491125103169."; esos mensajes envialos cortos y en ingles y español y solo limitate a temas relacionados con el trabajo que yo como profesional de la tecnología puedo proporcionar, ¡no respondas nada de otros temas por fuera de estos!.`;

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
        model: 'gpt-3.5-turbo',
        n: 1,
        max_tokens: 2048,
        stop: null,
        temperature: 0.7,
        user: userId,
        stream: false,
    });

    console.log('COMPLETION:', completion);
    const responseMessage = completion.choices[0].message.content;
    console.log('AI Response:', responseMessage);
    await saveUserContext(userId, [...userContext, { role: 'user', content: message }, { role: 'assistant', content: responseMessage }]);
    return responseMessage;
}