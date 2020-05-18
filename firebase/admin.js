const admin = require('firebase-admin');
const discountAccount = require('../discount_firebase.json');

admin.initializeApp({
    credential: admin.credential.cert(discountAccount),
    databaseURL: 'https://discount-268216.firebaseio.com'
});

module.exports = admin;