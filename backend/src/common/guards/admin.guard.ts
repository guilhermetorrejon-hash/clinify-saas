/**
 * AdminGuard — Bloqueia acesso de usuários que NÃO são admin.
 *
 * Um "guard" no NestJS é como um porteiro: ele roda ANTES do controller
 * e decide se a requisição pode prosseguir ou não.
 *
 * Esse guard verifica se o usuário logado tem role === 'ADMIN'.
 * Deve ser usado JUNTO com o JwtAuthGuard (que garante que o user está logado).
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // O JwtAuthGuard já colocou o user no request (via Passport)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Acesso restrito a administradores.');
    }

    return true;
  }
}
