module.exports = {
  // 允许的文件扩展名白名单（仅包含安全的文件类型）
  // 禁止所有可执行脚本、配置文件、数据库文件、证书密钥等高危文件
  allowedExtensions: [
    // 图片（低风险，仅显示不执行）
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif',    
    // PDF文档（中等风险，需安全扫描）
    'pdf',
    
    // Office文档（无宏的安全版本，中等风险）
    'docx', 'xlsx', 'pptx',
    
    // 纯文本（低风险，仅显示不执行）
    'txt', 'md', 'json', 'xml', 'csv', 'log',
    
    // 音频（低风险，仅播放不执行）
    'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
    
    // 视频（低风险，仅播放不执行）
    'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'
  ],

  // 允许的 MIME 类型模式（与allowedExtensions对应）
  allowedMimeTypes: [
    /^image\//,  // 所有图片类型
    /^application\/pdf$/,  // PDF
    /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/,  // docx
    /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/,  // xlsx
    /^application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation$/,  // pptx
    /^text\//,  // 纯文本类型
    /^audio\//,  // 音频
    /^video\//   // 视频
  ],

  // 文件头签名（魔数）- 用于验证文件内容与扩展名是否匹配
  fileSignatures: {
    // 图片文件
    'png': ['89504e47'],
    'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8', 'ffd8fff0', 'ffd8fff7', 'ffd8ffdb'],
    'gif': ['474946383961', '474946383761'],  // GIF89a, GIF87a
    'webp': ['52494646'],  // RIFF容器，后续检测 WEBP 标识
    'bmp': ['424d'],
    'ico': ['00000100'],
    'tiff': ['49492a00', '4d4d002a', '49492a'],  // TIFF小端和大端
    'tif': ['49492a00', '4d4d002a', '49492a'],
    
    // 文档文件
    'pdf': ['25504446'],  // %PDF
    'docx': ['504b0304'],
    'xlsx': ['504b0304'],
    'pptx': ['504b0304'],
    
    // 音频文件
    'mp3': ['494433', 'fffb', 'fff3', 'fff2', 'ffe0', 'ffe3', 'ffe2'],
    'wav': ['52494646'],  // RIFF容器，后续检测 WAVE 标识
    'ogg': ['4f676753'],
    'flac': ['664c6143'],
    'aac': ['fff1', 'fff9'],  // ADTS格式，MP4容器格式会在灵活检测中处理
    'm4a': ['0000001866747970', '0000002066747970', '4d344120'],
    'wma': ['3026b2758e66cf11'],
    
    // 视频文件
    'mp4': ['0000001866747970', '0000001c66747970', '0000002066747970', '0000002466747970'],
    '3gp': ['0000001466747970', '0000001c66747970'],
    '3g2': ['0000001c6674797033673270'],
    'webm': ['1a45dfa3'],
    'mov': ['0000001866747970', '667479704d534e56', '0000002066747970'],
    'avi': ['52494646'],  // RIFF容器，后续检测 AVI 标识
    'mkv': ['1a45dfa3'],
    'flv': ['464c5601']
  },

  // 禁止的危险文件扩展名（按风险类别分组）
  blockedExtensions: [
    // SVG（可能包含恶意脚本/XSS）
    'svg',

    // 可执行文件和脚本
    'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'msi', 'msp', 'mst',
    'dll', 'sys', 'ocx', 'cpl', 'drv', 'so',
    
    // Web脚本和服务器端代码
    'php', 'php3', 'php4', 'php5', 'php6', 'phps', 'phtml',
    'asp', 'aspx', 'jsp', 'jspx', 'jhtml',
    'cgi', 'pl', 'py', 'pyc', 'pyd',
    'rb', 'rbw', 'rhtml', 'erb',
    'sh', 'bash', 'zsh', 'csh', 'tcsh',
    'ps1', 'psm1', 'psd1', 'vbs', 'vbe', 'jse', 'wsf', 'wsc',
    
    // 前端脚本代码
    'html', 'htm', 'shtml', 'xhtml', 'htaccess',
    'js', 'mjs', 'jsx', 'tsx', 'vue',
    'ts', 'cts', 'mts',
    'css', 'scss', 'sass', 'less',
    
    // 编程语言源码
    'py', 'pyw',
    'java', 'jav', 'class', 'jar', 'war', 'ear',
    'c', 'cpp', 'h', 'hpp', 'cc', 'cxx',
    'cs', 'csx',
    'go', 'rs', 'rscript',
    'rb', 'rake', 'gem',
    'swift', 'kt', 'kts', 'scala', 'groovy',
    'dart', 'lua', 'perl', 'plx',
    'r', 'R', 'rmd',
    'php', 'phtml', 'module', 'theme',
    'coffee', 'litcoffee',
    
    // 配置文件（可能修改系统行为）
    'ini', 'cfg', 'conf', 'config', 'reg', 'inf',
    'properties', 'prop', 'settings',
    'env', 'environment', '.env',
    'yaml', 'yml', 'toml', 'json5',
    'xml', 'xaml', 'resx',
    
    // 数据库文件（包含敏感数据）
    'sql', 'db', 'sqlite', 'sqlite3', 'mdb', 'accdb',
    'dbf', 'cdb', 'fdb',
    
    // 证书和密钥（安全凭证）
    'pem', 'key', 'cer', 'crt', 'der', 'p12', 'pfx', 'p8', 'jks',
    'p7b', 'p7r', 'p7s',
    'gpg', 'pgp', 'asc',
    
    // Office宏文件（可能包含恶意VBA代码）
    'doc', 'docm', 'dot', 'dotm',
    'xls', 'xlsm', 'xlt', 'xltm', 'xlam',
    'ppt', 'pptm', 'pot', 'potm', 'ppam', 'ppsm',
    
    // 系统和虚拟机镜像
    'iso', 'img', 'bin', 'cue', 'mdf', 'mds',
    'vmdk', 'vhd', 'vhdx', 'hdd', 'qcow', 'qcow2',
    'dmg', 'cdr', 'sparseimage',
    
    // 压缩文件（可能包含恶意文件）
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lz',
    'cab', 'arj', 'lzh', 'ace', 'tgz', 'tbz2',
    
    // 快捷方式和链接
    'lnk', 'url', 'desktop', 'shortcut',
    'webloc', 'website', 'pcast',
    
    // 邮件和联系人
    'eml', 'msg', 'vcf', 'vcard', 'ics',
    'mbox', 'mail',
    
    // 设计和排版文件
    'psd', 'psb', 'ai', 'eps', 'indd',
    'skp', 'skm', 'blend',
    'fbx', 'obj', '3ds', 'dae', 'stl',
    
    // 帮助和文档系统
    'chm', 'hlp', 'hlpx',
    'hta', 'adget', 'shb',
    
    // Flash和媒体相关
    'swf', 'fla', 'as', 'vcproj', 'sln',
    'aaf', 'mxf', 'prproj',
    
    // 移动应用
    'apk', 'ipa', 'xap', 'appx', 'appxbundle',
    'aab', 'nex', 'crt',
    
    // 下载和共享
    'torrent', 'magnet', 'metalink',
    'par', 'par2',
    
    // 其他高危类型
    'bat', 'btm', 'command', 'workflow',
    'exe1', 'exe2', 'pif', 'application',
    'gadget', 'msc', 'diagcab',
    'jar', 'jnlp', 'webstart',
    'vhd', 'vhd', 'vhdx'
  ],

  // 最大文件大小（字节）
  maxFileSize: 100 * 1024 * 1024, // 100MB

  // 头像最大大小
  maxAvatarSize: 5 * 1024 * 1024 // 5MB
};