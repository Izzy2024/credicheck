import { prisma } from '../config/database.config';
import ExcelJS from 'exceljs';

function escapeCSV(val: string | null | undefined): string {
  if (!val) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export class ExportService {
  static async exportRecordsCSV(): Promise<string> {
    const records = await prisma.creditReference.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });

    const headers = [
      'Nombre',
      'Tipo ID',
      'Numero ID',
      'Monto Deuda',
      'Acreedor',
      'Estado',
      'Fecha Deuda',
      'Ciudad',
      'Notas',
      'Creado Por',
      'Fecha Creacion',
    ];

    const rows = records.map(r => [
      r.fullName,
      r.idType,
      r.idNumber,
      r.debtAmount.toString(),
      r.creditorName,
      r.debtStatus,
      r.debtDate.toISOString().split('T')[0],
      r.city || '',
      r.notes || '',
      `${r.creator.firstName} ${r.creator.lastName}`,
      r.createdAt.toISOString().split('T')[0],
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');
  }

  static async exportRecordsExcel(): Promise<Buffer> {
    const records = await prisma.creditReference.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Referencias Crediticias');

    sheet.columns = [
      { header: 'Nombre', key: 'fullName', width: 25 },
      { header: 'Tipo ID', key: 'idType', width: 12 },
      { header: 'Numero ID', key: 'idNumber', width: 15 },
      { header: 'Monto Deuda', key: 'debtAmount', width: 15 },
      { header: 'Acreedor', key: 'creditorName', width: 20 },
      { header: 'Estado', key: 'debtStatus', width: 15 },
      { header: 'Fecha Deuda', key: 'debtDate', width: 12 },
      { header: 'Ciudad', key: 'city', width: 15 },
      { header: 'Notas', key: 'notes', width: 30 },
      { header: 'Creado Por', key: 'createdBy', width: 20 },
      { header: 'Fecha Creacion', key: 'createdAt', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };
    records.forEach(r => {
      sheet.addRow({
        fullName: r.fullName,
        idType: r.idType,
        idNumber: r.idNumber,
        debtAmount: Number(r.debtAmount),
        creditorName: r.creditorName,
        debtStatus: r.debtStatus,
        debtDate: r.debtDate.toISOString().split('T')[0],
        city: r.city || '',
        notes: r.notes || '',
        createdBy: `${r.creator.firstName} ${r.creator.lastName}`,
        createdAt: r.createdAt.toISOString().split('T')[0],
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async exportHistoryCSV(userId?: string): Promise<string> {
    const where: any = {};
    if (userId) where.userId = userId;

    const history = await prisma.searchHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const headers = [
      'Fecha',
      'Tipo Busqueda',
      'Termino',
      'Resultados',
      'Tiempo (ms)',
      'Usuario',
    ];

    const rows = history.map(h => [
      h.createdAt.toISOString(),
      h.searchType,
      h.searchTerm,
      h.resultsCount.toString(),
      h.executionTimeMs.toString(),
      `${h.user.firstName} ${h.user.lastName}`,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');
  }
}
