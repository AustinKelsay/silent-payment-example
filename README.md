# slient payment simple example built with bitcoinjs-lib
## 🚧 work in progress

# spec (as far as I understand it):
sender_sec   # secret key of payment sender
sender_pub   # public key of payment sender
receipt_sec  # secret key of payment recipient.
receipt_pub  # public key of payment recipient.
## Sending a Payment
1. Recipient publishes their receipt_pub to sender.
2. Sender performs an ecdh operation to derive a shared secret.
shared_secret = ecdh(sender_sec, receipt_pub)
3. Sender hashes the shared secret to get a secret code.
 secret_code = hash(shared_secret)
4. Sender tweaks the receipt_pub with the secret code.
tweaked_pub = tweak_pubkey(receipt_pub, secret_code)
5. Sender makes a payment to the tweaked pubkey.
## Redeeming a Payment
The recipient must scan the utxo set for payments locked to a pubkey.
For each unspent payment, the recipient performs the following protocol:
1. For each input of the utxo, extract the pubkey used for signing.
input_pub = utxo.vin[*].witness[0]
2. Perform an ecdh operation on the input_pub using receipt_sec:
   shared_secret = ecdh(receipt_sec, input_pub)
3. Hash the shared secret to get the secret code:
   secret_code = hash(shared_secret)
4. Use the secret code to tweak the recipient pubkey:
   tweaked_pub = tweak_pubkey(receipt_pub, secret_code)
If tweaked_pub matches the utxo script_pubkey, then you found a payment that you can sweep. To derive the seckey for the utxo:
utxo_sec = tweak_seckey(receipt_sec, secret_code)
Essentially, the sender is using a shared secret to tweak the recipient pubkey and derive an obfuscated pubkey. The sender computes this shared secret using the same secret key that is sending the payment. This allows the recipient to extract the pubkey from the payment input, and perform the other side of the ecdh operation. This reveals the tweak for the recipient, so the recipient can tweak their seckey to sweep the funds.
