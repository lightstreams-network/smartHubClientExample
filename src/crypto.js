const Buffer = require('buffer').Buffer;
const ethers = require('ethers');

export const generateToken = async (peerId, wallet) => {
      let provider = wallet.provider;
      let privateKey = wallet.privateKey;
      let blockCount = await provider.getBlockNumber();

      const expirationBlock = blockCount + 10 ** 6;

      const claims = {
         blockchain: "PHT",
         peer_id: peerId,
         eth_address: wallet.address,
         iat: blockCount,
         eat: expirationBlock,
         timestamp: Date.now(),
      };

      const marshalledClaims = JSON.stringify(claims);

      let data = Buffer.from(marshalledClaims);
      let dataHex = data.toString("hex");
      let hash = ethers.utils.keccak256("0x" + dataHex)
      let key = new ethers.utils.SigningKey(privateKey);
      let signed = ethers.utils.joinSignature(key.signDigest(hash));

      const marshalledClaimsHexBuffer = new Buffer(marshalledClaims, 'ascii');
      const encodedClaimsBase64 = marshalledClaimsHexBuffer.toString('base64');

      const encodedClaimsBase64URLSafe = encodedClaimsBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

      const sigHexBuffer = new Buffer(signed.replace(/^0x/, ""), 'hex');
      const encodedSigBase64 = sigHexBuffer.toString('base64');
      const encodedSigBase64URLSafe = encodedSigBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

      const token = encodedClaimsBase64URLSafe + "." + encodedSigBase64URLSafe;

      return token;
   }