const crypto = require('crypto');
require('dotenv').config();

// Configuration for encryption
const algorithm = process.env.ECNRYPTION_METHOD; // AES encryption
const encryption_key = process.env.SECRET_KEY;
const encryption_iv = process.env.SECRET_KEY;
const key = crypto
  .createHash('sha512')
  .update(encryption_key)
  .digest('hex')
  .substring(0, 32);
const encryptionIV = crypto
  .createHash('sha512')
  .update(encryption_iv)
  .digest('hex')
  .substring(0, 16);

// Decrypt mnemonic
exports.decryptMnemonic = (encryptedMnemonic) => {
    const buff = Buffer.from(encryptedMnemonic, 'base64')
    const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    ) // Decrypts data and converts to utf8
};

