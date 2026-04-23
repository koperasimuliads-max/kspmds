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
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, order: 'YMD' }, // YYYY-MM-DD
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, order: 'DMY' }, // DD/MM/YYYY
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, order: 'DMY' }, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStrClean.match(format.regex);
    if (match) {
      let year, month, day;
      if (format.order === 'YMD') {
        [, year, month, day] = match;
      } else {
        [, day, month, year] = match;
      }
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      // Validate date
      if (date.getFullYear() === parseInt(year) &&
          date.getMonth() === parseInt(month) - 1 &&
          date.getDate() === parseInt(day)) {
        return date;
      }
    }
  }

  return null;
}