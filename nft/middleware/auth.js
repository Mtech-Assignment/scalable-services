require('dotenv').config();

const authenticateJWT = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get the token from the Authorization header

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const authServiceUrl = `${process.env.AUTH_SERVICE_URL}/auth/verify`;
    let verifyResult = await (await fetch(authServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token
        }),
    })).json();

    if (!verifyResult || !verifyResult.is_token_valid) {
      return res.status(403).json({ success: false, message: 'Invalid token.' });
    }

    next();
    
};

module.exports = authenticateJWT;
