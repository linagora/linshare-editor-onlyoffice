module.exports = {
  DOCUMENT_EXTENSIONS: {
    text: ['doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'fodt', 'ott', 'rtf', 'txt', 'html', 'htm', 'mht', 'pdf', 'djvu', 'fb2', 'epub', 'xps'],
    spreadsheet: ['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'ods', 'fods', 'ots', 'csv'],
    presentation: ['pps', 'ppsx', 'ppsm', 'ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'odp', 'fodp', 'otp']
  },
  EDITABLE_EXTENSIONS: ['doc', 'docx', 'odt', 'rtf', 'txt', 'xlsx', 'ods', 'csv', 'pptx', 'odp'],
  DOCUMENT_TYPES: {
    text: 'text',
    spreadsheet: 'spreadsheet',
    presentation: 'presentation'
  },
  DOCUMENT_STATES: {
    downloading: 'downloading',
    downloaded: 'downloaded',
    saving: 'saving',
    removed: 'removed'
  },
  PUBSUB_EVENTS: {
    DOCUMENT_DOWNLOADED: 'document:downloaded',
    DOCUMENT_DOWNLOAD_FAILED: 'document:download:failed',
    DOCUMENT_SAVED: 'document:saved',
    DOCUMENT_SAVE_FAILED: 'document:save:failed'
  },
  WEBSOCKET_EVENTS: {
    DOCUMENT_LOAD_DONE: 'document:load:done',
    DOCUMENT_LOAD_FAILED: 'document:load:failed',
    ERROR: 'error'
  }
};
