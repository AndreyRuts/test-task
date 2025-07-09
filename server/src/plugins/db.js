import mongoose from 'mongoose';
import { getEnvVar } from '../utils/getEnvVar.js';



export const initMongoConnection = async () => {
    const DB_ACCESS = getEnvVar('MONGODB_URI');
    
    try {
        await mongoose.connect(DB_ACCESS);
        console.log('Mongo connection successfully established!');
    } catch (error) {
        console.error('Error while setting up mongo connection', error);
        throw error;
    }
};

