import { config as dotenv } from 'dotenv';
dotenv();

const port = process.env.PORT || 3000;

export default {
    // HTTP Port to run our web application
    port: port
};