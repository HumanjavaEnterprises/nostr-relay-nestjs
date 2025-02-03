const crypto = require('crypto');
const secp256k1 = require('secp256k1');

function generateNostrKeyPair() {
    let privateKey;
    do {
        privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));

    // Get the public key and take only the x-coordinate (first 32 bytes)
    const publicKeyFull = Buffer.from(secp256k1.publicKeyCreate(privateKey));
    const publicKey = publicKeyFull.slice(1, 33).toString('hex'); // Remove the prefix byte and take 32 bytes
    const privateKeyHex = privateKey.toString('hex');

    console.log('Generated Nostr Keys:');
    console.log('===================');
    console.log(`RELAY_PRIVATE_KEY=${privateKeyHex}`);
    console.log(`RELAY_PUBKEY=${publicKey}`);
    console.log('\nValidation:');
    console.log('===========');
    console.log(`Private key length: ${privateKeyHex.length} (expected: 64)`);
    console.log(`Public key length: ${publicKey.length} (expected: 64)`);
    console.log(`Private key format: ${/^[0-9a-f]{64}$/.test(privateKeyHex)}`);
    console.log(`Public key format: ${/^[0-9a-f]{64}$/.test(publicKey)}`);
}

generateNostrKeyPair();
