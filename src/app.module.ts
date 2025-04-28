import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // 👈 Importa MongooseModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // 👇 Conexión a tu base de datos
    MongooseModule.forRoot('mongodb+srv://leonardoedi1979:leonardo2411@edisoncloud.ux4si.mongodb.net/merdb', {
      dbName: 'merdb', // opcional, si tu conexión ya especifica la base de datos, no es necesario
      retryAttempts: 3, // opcional: reintentos si falla
      retryDelay: 1000, // opcional: tiempo entre reintentos
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
