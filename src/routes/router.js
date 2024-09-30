import express from 'express';
import dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
dotenv.config();
const router = express.Router();

router.get('/', (req, res) => {
    //res.render('index', { title: 'WHABOTAPI' });
    console.log('Redirecting to index.html');
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

router.post('/contact', (req, res) => {
    console.log('Solicitud recibida');
    console.log('DATA RECEIVED:', req.body);
    const { name, email, subject, message } = req.body || {};
    console.log('Received data:', name, email, subject, message);
    console.log('Sending Email...');

    const transporter = nodemailer.createTransport({
        host: 'smtp.ionos.com',      // Servidor SMTP de IONOS
        port: 587,                   // Puerto para TLS
        secure: false,               // true para 465, false para otros puertos
        auth: {
            user: process.env.IONOS_USER,
            pass: process.env.IONOS_PASS
        },
        tls: {
            rejectUnauthorized: false, // Opcional, para evitar problemas de certificados SSL
        },
    });

    const mailOptions = {
        from: process.env.IONOS_USER,
        to: process.env.IONOS_USER, // Asegúrate de que el email esté correctamente formateado
        subject: subject + `${name} just sent you a constact message!!`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        let result;
        if (error) {
            console.error('Error sending email:', error);
            result = `<p style='color: red;'><span>Error sending Email, please try again later!.</span></p>`;
        } else {
            console.log('Email sent:', info.response);
            result = `<p style='color: #13E3E9;'><span>Mail Sent Successfully!.</span></p>`;
        }
        console.log('result:', result); // Asegúrate de que esto esté aquí
        return res.json({ message: result }); // Envía el resultado como un objeto JSON
    });
});

export default router;