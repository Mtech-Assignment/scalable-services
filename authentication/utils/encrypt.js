const bcrypt = require('bcrypt');
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

// Hash password
exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Compare hashed password
exports.comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

// Encrypt mnemonic
exports.encryptMnemonic = (mnemonic) => {
    const cipher = crypto.createCipheriv(algorithm, key, encryptionIV);
    // initialization vector ensures uniqueness of the encryption
    return Buffer.from(
        cipher.update(mnemonic, 'utf8', 'hex') + cipher.final('hex')
      ).toString('base64') // Encrypts data and converts to hex and base64 // Returning encrypted mnemonic and IV
};

// Decrypt mnemonic
exports.decryptMnemonic = (encryptedMnemonic) => {
    const buff = Buffer.from(encryptedMnemonic, 'base64')
    const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    ) // Decrypts data and converts to utf8
};

