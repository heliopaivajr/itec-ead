import * as XLSX from 'xlsx';

/**
 * Exporta dados para arquivo Excel (.xlsx)
 * @param data Array de objetos para exportar
 * @param filename Nome do arquivo sem extensão
 * @param sheetName Nome da planilha (padrão: "Dados")
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = 'Dados'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Exporta dados para arquivo CSV
 * @param data Array de objetos para exportar
 * @param filename Nome do arquivo sem extensão
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
