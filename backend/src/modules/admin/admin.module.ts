/**
 * AdminModule — Módulo da dashboard de administração.
 *
 * Contém o controller e service para os endpoints /admin/*.
 * Só é acessível por usuários com role ADMIN.
 */
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
