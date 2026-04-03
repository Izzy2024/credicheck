import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.config';

export const requireDisputeOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  const disputeId = req.params['disputeId'];
  if (!disputeId) {
    res.status(400).json({ error: 'ID de disputa requerido' });
    return;
  }

  const dispute = await (prisma as any).dispute.findUnique({
    where: { id: disputeId },
    select: { id: true, userId: true },
  });

  if (!dispute) {
    res.status(404).json({ error: 'Disputa no encontrada' });
    return;
  }

  const isAdmin = user.role === 'ADMIN';
  const isOwner = user.id === dispute.userId;

  if (!isAdmin && !isOwner) {
    res.status(403).json({
      error: 'No tienes permisos para acceder a los adjuntos de esta disputa',
    });
    return;
  }

  next();
};
