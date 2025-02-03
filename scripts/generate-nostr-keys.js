const { generatePrivateKey, getPublicKey } = require('nostr-tools');

function generateKeys() {
    const sk = generatePrivateKey(); // generates a random 32-byte hex private key
    const pk = getPublicKey(sk); // generates a 32-byte hex public key
    
    console.log('Generated Nostr Keys:');
    console.log('===================');
    console.log(`RELAY_PRIVATE_KEY=${sk}`);
    console.log(`RELAY_PUBKEY=${pk}`);
    console.log('\nValidation:');
    console.log('===========');
    console.log(`Private key length: ${sk.length}`);
    console.log(`Public key length: ${pk.length}`);
    console.log(`Private key format: ${/^[0-9a-f]{64}$/.test(sk)}`);
    console.log(`Public key format: ${/^[0-9a-f]{64}$/.test(pk)}`);
}

generateKeys();
