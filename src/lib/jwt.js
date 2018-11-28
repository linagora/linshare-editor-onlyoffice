const jwt = require('jsonwebtoken');
const config = require('config');
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, '../../config/jwt.key'));

module.exports = {
  generateToken
};

function generateToken(payload = {}) {
  return jwt.sign(
    {
      ...payload,
      iss: config.get('linshare.jwt.issuer')
    },
    privateKey,
    {
      algorithm: 'RS256',
      expiresIn: config.get('linshare.jwt.expirationTime')
    }
  );
}
