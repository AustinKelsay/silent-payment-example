const {createSilentPaymentPubkey, scanForPayment} = require('./receiver');
const { createSilentPaymentAddress, paySilentPaymentAddress, broadcastTransaction } = require('./sender');

// SENDER
// Private Key: 6ba44da45c306d1b10324f9a5d454d5125febd4bd4a79a99fe20aa51663c5962
// Public Key: 02577a157fce0e1ee3e851c3c76fe5f259e5ba05471318d9c5f37832cfa16b8552

// RECEIVER
// Private Key: 08c0272a91026496e7469dd633aa2d995376ee912dffa266e2cc93a470316683
// Public Key: 034622aa2b1d6f1d6197e8db17228c4acd1f7e805ae07ee6a9b4bbd7da50ef4f8c

// Contract Data
const contractData = 'some random string of data bitch';

// Output to spend
const txid = '542f57ec34a7dcf4767418266ae09b899e00438a141acfea28d8fb82733074d2';
const vout = 0;

// RECEIVER create the silent payment public key
const silentPaymentPubkey = createSilentPaymentPubkey('034622aa2b1d6f1d6197e8db17228c4acd1f7e805ae07ee6a9b4bbd7da50ef4f8c');
console.log("silentPaymentPubkey", silentPaymentPubkey);

// SENDER create the silent payment address
const silentPaymentAddress = createSilentPaymentAddress(silentPaymentPubkey, contractData);
console.log("silentPaymentAddress", silentPaymentAddress);

// SENDER create the transaction
const tx = paySilentPaymentAddress('6ba44da45c306d1b10324f9a5d454d5125febd4bd4a79a99fe20aa51663c5962', silentPaymentAddress, 10000, txid, vout);
console.log("tx", tx);

// SENDER broadcast the transaction
broadcastTransaction(tx).then((response) => {
    console.log(response.data);
}).catch((error) => {
    console.log(error);
});

// RECEIVER scan the chain for the transaction
scanForPayment(silentPaymentPubkey, contractData)
    .then(() => console.log('Scan complete'))
    .catch(error => console.error(error));