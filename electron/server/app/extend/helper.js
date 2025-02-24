// electron/server/app/extend/helper.js
module.exports = {
  success(data = null, message = 'success') {
    return {
      code: 0,
      data,
      message,
    }
  },

  error(message = 'error', code = -1) {
    return {
      code,
      data: null,
      message,
    }
  },
}
