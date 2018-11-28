module.exports = {
  DOCUMENT_EXTENSIONS: {
    text: ['.doc', '.docx', '.docm', '.dot', '.dotx', '.dotm', '.odt', '.fodt', '.ott', '.rtf', '.txt', '.html', '.htm', '.mht', '.pdf', '.djvu', '.fb2', '.epub', '.xps'],
    spreadsheet: ['.xls', '.xlsx', '.xlsm', '.xlt', '.xltx', '.xltm', '.ods', '.fods', '.ots', '.csv'],
    presentation: ['.pps', '.ppsx', '.ppsm', '.ppt', '.pptx', '.pptm', '.pot', '.potx', '.potm', '.odp', '.fodp', '.otp']
  },
  DOCUMENT_TYPES: {
    text: 'text',
    spreadsheet: 'spreadsheet',
    presentation: 'presentation'
  },
  DOCUMENT_STATES: {
    downloading: 'downloading',
    downloaded: 'downloaded'
  }
};
