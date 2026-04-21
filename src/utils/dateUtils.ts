export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  
  // Handle various date formats
  const dateStrClean = String(dateStr).trim();
  
  // If it's already in dd/mm/yyyy format, return as is
  if (dateStrClean.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    return dateStrClean;
  }
  
  // If it's in YYYY-MM-DD format (ISO)
  if (dateStrClean.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStrClean.split('-');
    if (parts.length !== 3) return dateStrClean;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  // If it's in dd-mm-yyyy format
  if (dateStrClean.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const parts = dateStrClean.split('-');
    if (parts.length !== 3) return dateStrClean;
    const [day, month, year] = parts;
    return `${day}/${month}/${year}`;
  }
  
  // Return original if no format matches
  return dateStrClean;
}

export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const dateStrClean = String(dateStr).trim();
  
  // Try various formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    const match = dateStrClean.match(format);
    if (match) {
      let year, month, day;
      if (format.source.includes('YYYY')) {
        [, year, month, day] = match;
      } else {
        [, day, month, year] = match;
      }
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  return null;
}