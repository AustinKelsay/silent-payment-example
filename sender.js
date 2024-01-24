const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const {ECPairFactory} = require('ecpair');
const crypto = require('crypto');
const BigInteger = require('bigi');
const ecurve = require('ecurve');
const Buffer = require('buffer').Buffer;
const axios = require('axios');

const ECPair = ECPairFactory(ecc);

const createSilentPaymentAddress = (publicKey, contractData) => {
    const contractHash = crypto.createHash('sha256').update(contractData).digest();
    const tweak = BigInteger.fromBuffer(contractHash.slice(0, 32));

    // Parse the public key
    const ecparams = ecurve.getCurveByName('secp256k1');
    const publicKeyPoint = ecurve.Point.decodeFrom(ecparams, Buffer.from(publicKey, 'hex'));

    // Apply the tweak
    const tweakedPoint = publicKeyPoint.add(ecparams.G.multiply(tweak));

    // Create a P2WPKH address from the tweaked public key
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(tweakedPoint.getEncoded(true)),
        network: bitcoin.networks.testnet
    });

    return address;
}

const paySilentPaymentAddress = (privateKeyHex, silentPaymentAddress, amount, txid, vout) => {
    // Convert the hex string to a Buffer
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');

    // Create the key pair from the private key buffer
    const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { network: bitcoin.networks.testnet });

    const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });

    // Convert UTXO value from BTC to satoshis (integer)
    const utxoValue = Math.round(0.01582633 * 1e8); // Replace 0.01582633 with the actual UTXO amount in BTC
    const utxoScript = "00145ae2e8f0d7ae5ff5bc639e32ada9a31467d92909"; // Replace with the actual scriptPubKey in hexadecimal format

    // Add input with UTXO details
    psbt.addInput({
        hash: txid,
        index: vout,
        witnessUtxo: {
            script: Buffer.from(utxoScript, 'hex'),
            value: utxoValue,
        },
    });

    // Add output (convert amount from BTC to satoshis)
    psbt.addOutput({
        address: silentPaymentAddress,
        value: Math.round(amount * 1e8), // Convert amount to satoshis
    });

    // Sign the transaction
    psbt.signInput(0, keyPair);
    psbt.validateSignaturesOfInput(0);
    psbt.finalizeAllInputs();

    const tx = psbt.extractTransaction();

    console.log(`Signed transaction: ${tx.toHex()}`);

    return tx;
}

const broadcastTransaction = (tx) => {
    return axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
        tx: tx.toHex()
    });
}

module.exports = {
    createSilentPaymentAddress,
    paySilentPaymentAddress,
    broadcastTransaction
};