const crypto = require('crypto');

// Generate a random JWT secret
const secret = crypto.randomBytes(32).toString('hex');
console.log('Your JWT Secret is:', secret);
