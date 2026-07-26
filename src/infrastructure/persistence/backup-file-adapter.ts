import { BACKUP_LIMITS } from '../../domain/backup/backup-schema';
export async function readBackupFile(file: File): Promise<string> {
  if (file.size > BACKUP_LIMITS.bytes) throw new Error('file-too-large');
  return file.text();
}
export function downloadJson(contents: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
