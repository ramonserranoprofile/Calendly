// import { createClient } from 'redis';
// import { config as dotenv } from 'dotenv';
// dotenv();

// // Primer cliente de Redis
// const redis = createClient({
//     password: process.env.REDIS_PASSWORD || null,
//     socket: {
//         host: process.env.REDIS_HOST || '127.0.0.1',
//         port: process.env.REDIS_PORT || 6379,
//         reconnectStrategy: (retries) => {
//             // Estrategia de reconexión con incremento exponencial de retraso
//             const delay = Math.min(retries * 100, 3000); // hasta 3 segundos
//             console.log(`Intento de reconexión #${retries}, reconectando en ${delay}ms`);
//             return delay;
//         }
//     }
// });

// redis.on('connect', () => {
//     console.log('Conexión exitosa a Redis.');
// });

// redis.on('error', (err) => {
//     console.error('Error en la conexión a Redis:', err);
// });

// redis.on('end', () => {
//     console.log('Conexión a Redis terminada.');
// });

// redis.on('reconnecting', () => {
//     console.log('Intentando reconectar a Redis...');
// });

// // Conectar al cliente Redis
// (async () => {
//     try {
//         await redis.connect();
//     } catch (err) {
//         console.error('Error inicial al conectar a Redis:', err);
//     }
// })();

// export default redis;



import Redis from 'ioredis';
import { config as dotenv } from 'dotenv';
dotenv();

// Create the Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            // Exponential backoff strategy for reconnection delay
            const delay = Math.min(err.attempt * 100, 3000); // up to 3 seconds
            console.log(`Reconnection attempt #${err.attempt}, retrying in ${delay}ms`);
            return true; // reconnect
        }
        return false;
    }
});

redis.on('connect', () => {
    console.log('Connected successfully to Redis.');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('end', () => {
    console.log('Redis connection ended.');
});

redis.on('reconnecting', () => {
    console.log('Attempting to reconnect to Redis...');
});

// Export the Redis client for use in other modules
export default redis;
