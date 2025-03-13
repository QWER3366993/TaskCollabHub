// 文件类型图标映射
export const fileTypeIcons: Record<string, string> = {
    // 图片类
    'image/': 'image',

    // PDF
    'application/pdf': 'picture_as_pdf',

    // Office文档
    'application/msword': 'g_translate', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'g_translate', // .docx
    'application/vnd.ms-excel': 'g_translate', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'g_translate', // .xlsx
    'application/vnd.ms-powerpoint': 'g_translate', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'g_translate', // .pptx

    // 纯文本文件
    'text/plain': 'edit_note',

    // 压缩包
    'application/zip': 'folder_zip',
    'application/x-rar': 'folder_zip',
    'application/x-tar': 'folder_zip',

    // 代码文件
    'text/html': 'html',
    'text/css': 'css',
    'application/javascript': 'javascript',

    // 默认类型
    'default': 'file_present'
};

// 简化匹配逻辑
export const getFileIcon = (fileType: string) => {
    const typeKeys = Object.keys(fileTypeIcons);

    // 优先匹配完整类型
    if (fileTypeIcons[fileType]) return fileTypeIcons[fileType];

    // 其次匹配类型前缀
    const matchedKey = typeKeys.find(key =>
        key.endsWith('/') && fileType.startsWith(key)
    );

    return matchedKey
        ? fileTypeIcons[matchedKey]
        : fileTypeIcons.default;
};