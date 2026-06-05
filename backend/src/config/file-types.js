module.exports = {
  // 允许的文件扩展名白名单
  allowedExtensions: [
    // 图片
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
    // 文档
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    // 文本
    'txt', 'md', 'json', 'xml', 'csv',
    // 压缩
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    // 代码
    'js', 'ts', 'py', 'go', 'java', 'cpp', 'html', 'css', 'php',
    // 音频
    'mp3', 'wav', 'ogg', 'flac', 'aac',
    // 视频
    'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'
  ],

  // 允许的 MIME 类型模式
  allowedMimeTypes: [
    /^image\//,
    /^application\/pdf$/,
    /^application\/msword$/,
    /^application\/vnd\.openxmlformats-officedocument\./,
    /^application\/vnd\.ms-excel$/,
    /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\./,
    /^application\/vnd\.ms-powerpoint$/,
    /^application\/vnd\.openxmlformats-officedocument\.presentationml\./,
    /^text\//,
    /^application\/zip$/,
    /^application\/x-rar-compressed$/,
    /^application\/x-tar$/,
    /^application\/gzip$/,
    /^application\/x-bzip2$/,
    /^application\/javascript$/,
    /^audio\//,
    /^video\//
  ],

  // 文件头签名（魔数）
  fileSignatures: {
    'png': ['89504e47'],
    'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8', 'ffd8fff0', 'ffd8fff7'],
    'pdf': ['25504446'],
    'zip': ['504b0304', '504b0506', '504b0708'],
    'gif': ['47494638'],
    'webp': ['52494646'],
    'bmp': ['424d'],
    'rar': ['52617221'],
    '7z': ['377abcaf'],
    'tar': ['7573746172'],
    'gz': ['1f8b08'],
    'mp4': ['0000001866747970'],
    'webm': ['1a45dfa3'],
    'mp3': ['494433', 'fffb', 'fff3', 'fff2'],
    'wav': ['52494646']
  },

  // 禁止的危险文件扩展名
  blockedExtensions: [
    'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'msi',
    'dll', 'sys', 'ocx', 'cpl', 'drv',
    'php', 'asp', 'aspx', 'jsp', 'jspx', 'cgi', 'pl', 'pyc',
    'html', 'htm', 'js', 'vbs', 'jse', 'wsf', 'wsc',
    'jar', 'class', 'war', 'ear',
    'apk', 'ipa', 'xap', 'appx',
    'lnk', 'url', 'desktop',
    'eml', 'msg', 'vcf',
    'ps', 'eps', 'ai',
    'iso', 'bin', 'cue', 'mdf',
    'torrent', 'magnet',
    'sql', 'mdb', 'accdb',
    'cer', 'pem', 'crt', 'key',
    'reg', 'inf', 'ini',
    'hta', 'chm', 'hlp',
    'swf', 'fla',
    'java', 'jav'
  ],

  // 最大文件大小（字节）
  maxFileSize: 100 * 1024 * 1024, // 100MB

  // 头像最大大小
  maxAvatarSize: 5 * 1024 * 1024 // 5MB
};