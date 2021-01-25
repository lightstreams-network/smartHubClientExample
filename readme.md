# Lightstreams Smart Hub Client Example

This is an example project written in React Native that demonstrates data that is stored in a decentralized manner with privacy controls. Alice uploads data from her mobile phone to her Smart Hub which gives a universal unique id (Meta hash) for addressing and retrieving the data. Alice then grants Bob permission to access the data using a Smart Contract that manages as the Access Control (ACL) permissions. Bob then connects to his own Smart Hub and pulls a copy of the data to there and then streams to his mobile phone. 

For demonstration purposes, the same mobile phone applciation is storing the credentials of Alice and Bob.

## Requirements
- node 14.15.4

## Install

```
$ yarn install
$ cp .env.sample .env
```

## Setup
Initialise and run two Smart Hub's that each connect to the Sirius Test Network.

Smart Hub 1:
```
$ leth init --nodeid=1 --network=sirius --lightclient=true --blockchain_url=https://node.sirius.lightstreams.io --federation=true
$ leth run --nodeid=1 --network=sirius --https
```

Smart Hub 2:
```
$ leth init --nodeid=2 --network=sirius --lightclient=true --blockchain_url=https://node.sirius.lightstreams.io --federation=true
$ leth run --nodeid=2 --network=sirius --https
```

These will be hosting there API's at the following url addresses:
```
http://localhost:9091
http://localhost:9092
```

If you configure the Smart Hubs with different `nodeid` values then set the correct url addresses in the `.env` file.

## Run
```
$ yarn start
```

## Instructions
1. Ensure Alice's account is topped up with PHT tokens. Use Meta mask configured to the Sirius Network to send tokens to account `0x88a5C2d9919e46F883EB62F7b8Dd9d0CC45bc290`

Sirius Network Meta Mask Configuration:
```
RPC URL: https://node.sirius.lightstreams.io
Chain ID: 162
Currency Symbool: PHT
```

2. Click `Alice: Upload Data`. This will upload data to Smart Hub 1 where Alice is the owner of the data..
3. Click `Alice: Grant READ to Bob`. This will grant READ permission to Bob.
4. Click `Bob: Get Data`. This will stream the data from Smart Hub 1 to Smart Hub 2 using Bob's account.
5. Click `Aice: Revoke READ from Bob`. This will revoke READ permission from Bob and the data will be deleted from Smart Hub 2.
6. Click `Bob: Get Data`. Bob will no longer be able to access the data.
