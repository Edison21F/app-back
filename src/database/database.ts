import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb+srv://leonardoedi1979:leonardo2411@edisoncloud.ux4si.mongodb.net/merdb');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', (error as Error).message);
    process.exit(1); // Opcional: salir de la app si falla la conexión
  }
};
