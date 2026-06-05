export function formatFileSize(bytes) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

export function getFileType(filename) {
  const ext = getFileExtension(filename);
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const documentExtensions = ['doc', 'docx', 'pdf', 'txt', 'rtf'];
  const spreadsheetExtensions = ['xls', 'xlsx', 'csv'];
  const presentationExtensions = ['ppt', 'pptx'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

  if (imageExtensions.includes(ext)) return 'image';
  if (documentExtensions.includes(ext)) return 'document';
  if (spreadsheetExtensions.includes(ext)) return 'spreadsheet';
  if (presentationExtensions.includes(ext)) return 'presentation';
  if (videoExtensions.includes(ext)) return 'video';
  if (audioExtensions.includes(ext)) return 'audio';
  if (archiveExtensions.includes(ext)) return 'archive';
  return 'other';
}
