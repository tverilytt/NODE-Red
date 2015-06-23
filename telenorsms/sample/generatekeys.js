/*global require, module,console */
  /*jshint devel : true*/

'use strict';

var cryptico = require('./cryptico.js').cryptico;

module.exports.cryptico = cryptico;

var passPhrase = 'your-passphrase';
var Bits = 512;
        
console.log('passphrase: ' + passPhrase);
console.log('Bit length: ' + Bits);
        
var privateKey = cryptico.generateRSAKey(passPhrase, Bits);
var privateKeyString = privateKey.n.toString(16);
console.log('Private key string: ' + privateKeyString);

var publicKeyString = cryptico.publicKeyString(privateKey);       
        
console.log('Public key string:' + publicKeyString);

console.log('Private key JSON', JSON.stringify(privateKey));
