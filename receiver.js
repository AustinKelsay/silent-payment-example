const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const {ECPairFactory} = require('ecpair');
const crypto = require('crypto');

const ECPair = ECPairFactory(ecc);

const createSilentPaymentPubkey = (masterPublicKey) => {
    const { publicKey } = ECPair.fromPublicKey(Buffer.from(masterPublicKey, 'hex'));

    return publicKey;
}

const regenerateSilentPaymentAddress = (publicKey, contractData) => {
    const contractHash = crypto.createHash('sha256').update(contractData).digest();
    const tweak = contractHash.slice(0, 32);

    const tweakedPubKey = bitcoin.ecurve.Point.decodeFrom(
        bitcoin.networks.bitcoin.messagePrefix,
        publicKey
    ).add(bitcoin.ecurve.getCurve().g.multiply(BigInteger.fromBuffer(tweak)));

    const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(tweakedPubKey.encodeCompressed()),
        network: bitcoin.networks.testnet
    });

    return address;
}

// Function to scan the latest block for transactions to the silent payment address
const scanForPayment = async (publicKey, contractData) => {
    try {
        const latestBlockHashResponse = await axios.get('https://api.blockcypher.com/v1/btc/test3');
        const latestBlockHash = latestBlockHashResponse.data.hash;

        const latestBlockResponse = await axios.get(`https://api.blockcypher.com/v1/btc/test3/blocks/${latestBlockHash}`);
        const transactions = latestBlockResponse.data.txids;

        for (let txid of transactions) {
            const transactionResponse = await axios.get(`https://api.blockcypher.com/v1/btc/test3/txs/${txid}`);
            const transaction = transactionResponse.data;

            const regeneratedAddress = regenerateSilentPaymentAddress(publicKey, contractData);

            for (let output of transaction.outputs) {
                if (output.addresses && output.addresses.includes(regeneratedAddress)) {
                    console.log(`Transaction found: ${txid}`);
                    console.log(`Amount: ${output.value} satoshis`);
                    return; // Assuming you want to stop after finding the first transaction
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning for payment: ${error.message}`);
    }
};

module.exports = {
    createSilentPaymentPubkey,
    scanForPayment,
    regenerateSilentPaymentAddress
};