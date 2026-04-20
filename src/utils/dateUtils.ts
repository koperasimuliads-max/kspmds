export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '-';
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}