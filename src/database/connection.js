import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let connectionPromise;

export function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI não foi definido.');
  }

  // Evita cair no banco padrão "test" quando a URI não possui um nome de banco.
  connectionPromise ??= mongoose.connect(process.env.MONGODB_URI, { dbName: 'nerdsbrasil' })
    .then((connection) => {
      logger.info('DATABASE', 'sistema', 'Conectado ao banco nerdsbrasil.');
      return connection;
    });
  return connectionPromise;
}
