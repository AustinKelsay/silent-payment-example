const bitcoin = require('bitcoinjs-lib');
const crypto = require('crypto');

export const createSilentPaymentAddress = (publicKey, contractData) => {
    const contractHash = crypto.createHash('sha256').update(contractData).digest();
    const tweak = contractHash.slice(0, 32);

    // Apply the tweak to the master public key
    const tweakedPubKey = bitcoin.ecurve.Point.decodeFrom(
        bitcoin.networks.bitcoin.messagePrefix,
        publicKey
    ).add(bitcoin.ecurve.getCurve().g.multiply(BigInteger.fromBuffer(tweak)));

    // Create a P2WPKH address from the tweaked public key
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(tweakedPubKey.encodeCompressed()),
        network: bitcoin.networks.testnet
    });

    return address;
}

export const paySilentPaymentAddress = (privateKey, silentPaymentAddress, amount, txid, vout) => {
    const txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet);
    txb.addInput(txid, vout);
    txb.addOutput(silentPaymentAddress, amount);
    txb.sign(0, bitcoin.ECPair.fromWIF(privateKey, bitcoin.networks.testnet));

    const tx = txb.build();

    console.log(`Signed transaction: ${tx.toHex()}`);

    return tx;
}

export const broadcastTransaction = (tx) => {
    return axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
        tx: tx.toHex()
    });
}