const crypto = require('crypto');

function generateHexKeys() {
    // Generate a random 32-byte private key
    const privateKey = crypto.randomBytes(32);
    const privateKeyHex = privateKey.toString('hex').toLowerCase();
    
    // Generate a public key using the private key
    const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex').toLowerCase();
    
    // Validate the keys
    const hexRegex = /^[0-9a-f]{64}$/;
    const isPrivateKeyValid = hexRegex.test(privateKeyHex);
    const isPublicKeyValid = hexRegex.test(publicKey);
    
    if (!isPrivateKeyValid || !isPublicKeyValid) {
        console.error('Error: Generated keys do not match required format!');
        process.exit(1);
    }
    
    console.log('\nGenerated Hex Keys for Nostr Relay:');
    console.log('===============================');
    console.log(`RELAY_PRIVATE_KEY=${privateKeyHex}`);
    console.log(`RELAY_PUBKEY=${publicKey}`);
    console.log('\nKey Verification:');
    console.log('----------------');
    console.log(`Private key length: ${privateKeyHex.length} chars (should be 64)`);
    console.log(`Public key length: ${publicKey.length} chars (should be 64)`);
    console.log(`Private key hex format: ${isPrivateKeyValid ? '✅' : '❌'}`);
    console.log(`Public key hex format: ${isPublicKeyValid ? '✅' : '❌'}`);
    
    // Additional validation output
    console.log('\nValidation Details:');
    console.log('------------------');
    console.log('Required format: 64 lowercase hex characters (0-9a-f)');
    console.log(`Private key matches format: ${hexRegex.test(privateKeyHex)}`);
    console.log(`Public key matches format: ${hexRegex.test(publicKey)}`);
    console.log(`Sample of private key: ${privateKeyHex.slice(0, 10)}...${privateKeyHex.slice(-10)}`);
    console.log(`Sample of public key: ${publicKey.slice(0, 10)}...${publicKey.slice(-10)}`);
}

generateHexKeys();
