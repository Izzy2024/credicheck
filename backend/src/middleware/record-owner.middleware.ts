import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.config';

export const requireRecordOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  const recordId = req.params['id'];
  if (!recordId) {
    res.status(400).json({ error: 'ID de registro requerido' });
    return;
  }

  const tenantId = user.tenantId || 'default';

  const record = await prisma.creditReference.findFirst({
    where: { id: recordId, deletedAt: null, tenantId },
    select: { id: true, createdBy: true },
  });

  if (!record) {
    res.status(404).json({ error: 'Registro no encontrado' });
    return;
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.id === record.createdBy;

  if (!isAdmin && !isOwner) {
    res.status(403).json({
      error: 'No tienes permisos para modificar este registro',
    });
    return;
  }

  next();
};
