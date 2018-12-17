module.exports = function(mixin) {
  mixin.express = {
    response: callback => {
      return {
        status: code => {
          callback && callback(code);

          return {
            json: () => {},
            end: () => {},
            send: () => {}
          };
        }
      };
    },
    jsonResponse: callback => {
      const _headers = {};
      const _set = {};

      return {
        set: (key, value) => {
          _set[key] = value;
        },
        header: (key, value) => {
          _headers[key] = value;
        },
        status: code => {
          return {
            json: data => {
              return callback && callback(code, data, _headers, _set);
            }
          };
        }
      };
    }
  };
};
