const { CryptoJS } = require("crypto-js");

console.log(CryptoJS.AES.encrypt('sheesh', 'boi').toString())