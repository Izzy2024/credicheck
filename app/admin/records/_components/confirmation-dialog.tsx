'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './status-manager';
import { AlertTriangle, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export type RecordStatus = 'ACTIVE' | 'PAID' | 'INACTIVE' | 'PAYMENT_PLAN' | 'DISPUTED';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  type?: 'danger' | 'warning' | 'info';
  requireConfirmation?: boolean;
  confirmationText?: string;
  showNotes?: boolean;
  statusInfo?: {
    currentStatus: RecordStatus;
    newStatus: RecordStatus;
    recordName: string;
  };
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
  type = 'warning',
  requireConfirmation = false,
  confirmationText = 'CONFIRMAR',
  showNotes = false,
  statusInfo
}: ConfirmationDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireConfirmation && confirmationInput !== confirmationText) {
      setError('Por favor, escribe el texto de confirmación correctamente.');
      return;
    }

    setError('');
    try {
      await onConfirm();
      setConfirmationInput('');
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error en confirmación:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmationInput('');
      setNotes('');
      setError('');
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const canConfirm = !requireConfirmation || confirmationInput === confirmationText;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Información de cambio de estado */}
        {statusInfo && (
          <div className="space-y-3">
            <div className="text-sm">
              <strong>Registro:</strong> {statusInfo.recordName}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Cambio de estado:</span>
              <StatusBadge status={statusInfo.currentStatus} />
              <span className="text-sm">→</span>
              <StatusBadge status={statusInfo.newStatus} />
            </div>
          </div>
        )}

        {/* Campo de notas */}
        {showNotes && (
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Añade notas o comentarios sobre esta acción..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Campo de confirmación */}
        {requireConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Escribe <strong>{confirmationText}</strong> para confirmar esta acción:
            </Label>
            <Input
              id="confirmation"
              value={confirmationInput}
              onChange={(e) => {
                setConfirmationInput(e.target.value);
                setError('');
              }}
              placeholder={confirmationText}
              disabled={isLoading}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Alerta de advertencia */}
        {type === 'danger' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción es irreversible. Por favor, asegúrate de que deseas continuar.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook personalizado para manejar diálogos de confirmación
export function useConfirmationDialog() {
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => Promise<void>;
    type?: 'danger' | 'warning' | 'info';
    requireConfirmation?: boolean;
    confirmationText?: string;
    showNotes?: boolean;
    statusInfo?: {
      currentStatus: RecordStatus;
      newStatus: RecordStatus;
      recordName: string;
    };
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: async () => {},
    type: 'warning',
    requireConfirmation: false,
  });

  const showConfirmation = (config: Omit<typeof dialog, 'open'>) => {
    setDialog({ ...config, open: true });
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      open={dialog.open}
      onOpenChange={(open) => setDialog(prev => ({ ...prev, open }))}
      title={dialog.title}
      description={dialog.description}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      onConfirm={dialog.onConfirm}
      type={dialog.type}
      requireConfirmation={dialog.requireConfirmation}
      confirmationText={dialog.confirmationText}
      showNotes={dialog.showNotes}
      statusInfo={dialog.statusInfo}
    />
  );

  return {
    showConfirmation,
    ConfirmationDialogComponent,
  };
}

// Diálogos preconfigurados para acciones comunes
export const confirmDeleteRecord = (recordName: string, onConfirm: () => Promise<void>) => ({
  title: 'Eliminar Registro',
  description: `¿Estás seguro de que quieres eliminar el registro de "${recordName}"? Esta acción no se puede deshacer.`,
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  onConfirm,
  type: 'danger' as const,
  requireConfirmation: true,
  confirmationText: 'ELIMINAR',
});

export const confirmStatusChange = (
  recordName: string,
  currentStatus: RecordStatus,
  newStatus: RecordStatus,
  onConfirm: (notes?: string) => Promise<void>
) => ({
  title: 'Cambiar Estado del Registro',
  description: `¿Estás seguro de que quieres cambiar el estado del registro "${recordName}"?`,
  confirmText: 'Cambiar Estado',
  cancelText: 'Cancelar',
  onConfirm,
  type: 'warning' as const,
  showNotes: true,
  statusInfo: {
    currentStatus,
    newStatus,
    recordName,
  },
});

export const confirmBulkStatusChange = (
  recordCount: number,
  newStatus: RecordStatus,
  onConfirm: (notes?: string) => Promise<void>
) => ({
  title: 'Actualización Masiva de Estados',
  description: `¿Estás seguro de que quieres cambiar el estado de ${recordCount} registros seleccionados?`,
  confirmText: 'Actualizar Todos',
  cancelText: 'Cancelar',
  onConfirm,
  type: 'warning' as const,
  showNotes: true,
  requireConfirmation: recordCount > 10, // Requerir confirmación para muchas operaciones
  confirmationText: 'ACTUALIZAR TODO',
});