module.exports = {
  getSocketInfo
};

function getSocketInfo(socket) {
  if (!socket || !socket.request) {
    return null;
  }

  return {
    query: socket.request && socket.request._query
  };
}
