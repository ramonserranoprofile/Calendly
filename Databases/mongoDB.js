import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();


mongoose.connect(process.env.MONGODB_URI, {

}).then(() => {
    console.log('Conexión exitosa a MongoDB.');
}).catch(err => {
    console.error('Error en la conexión a MongoDB:', err);
    setTimeout(mongo, 5000); // Reintenta la conexión después de 5 segundos
})



mongoose.connection.on('connected', () => {
    console.log('Conectado a MongoDB.');
});

mongoose.connection.on('error', (err) => {
    console.error('Error en la conexión a MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Conexión a MongoDB terminada.');
});

mongoose.connection.on('reconnected', () => {
    console.log('Reconección exitosa a MongoDB.');
});


export default mongoose;