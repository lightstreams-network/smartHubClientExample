import React, { Component } from "react";
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	TextInput
} from "react-native";

// Library used for interacting with the blockchain.
const ethers = require('ethers');

// Library used to generate authentication token.
const crypto = require('./src/crypto');

// Libary used to stream data from Smart Hub.
const fileStream = require('./src/fileStream');

// Imported environment variables from the .env file.
import {
	BLOCKCHAIN_RPC,
	SMART_HUB_1,
	SMART_HUB_2
} from "react-native-dotenv";

// Json file used for deploying an ACL contract.
import Acl from "./build/contracts/ACL.json";

// Private key for Alice's account. This is encrypted.
// Note: This needs be stored in a secure location on Alice's device
import EncryptedPrivateKey from "./privateKey.json";

const provider = new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC);

let encryptedKey = JSON.stringify(EncryptedPrivateKey);

// Password for decrypting Alice's account. 
//In this example, we have hard coded the value. In production, Alice would need to enter her password. 
let password = "foo";
let aliceWallet;

// The ACL smart contract that will be deployed.
let aclContract;

let bobWallet = new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);		
let bobAccount = bobWallet.address;

// Decrypt Alice's private key and load her wallet.
ethers.Wallet.fromEncryptedJson(encryptedKey, password).then((w) => {
	aliceWallet = w;
    console.log("Top up Account: " + aliceWallet.address);
    // "Address: 0x88a5C2d9919e46F883EB62F7b8Dd9d0CC45bc290"
	aliceWallet = new ethers.Wallet(w.privateKey, provider);
});

class App extends Component {
	constructor() {
		super();

		// Set the initial values.
		this.state = {
			account: aliceWallet.address,
			accountBal: 0,
			acl: "",
			meta: "",
			grantMessage: "",
			dataMessage: ""
		};

		// Poll to get the updated balance of the account every second.
		setInterval(() => {
			aliceWallet.getBalance().then(balance => {
				this.setState({
					accountBal: ethers.utils.formatEther(balance.toString())
				});
			});
		}, 1000);
	}

	saveData = async () => {
		let owner = aliceWallet.address;

		// Create an instance of a Contract Factory
		let factory = new ethers.ContractFactory.fromSolidity(Acl, aliceWallet);

		// Deploying the ACL contract passing the owner address and isPublic to false as the parameters to the constructor.
		aclContract = await factory.deploy(owner, false);

		// Display the ACL address.
		let acl = aclContract.address;
		this.setState({acl});

		// Create data to upload.
		let data = {
			message: "Hello world!"
		};
		let strData = JSON.stringify(data);

		// Upload the data to Smart Hub 1 where Aiice is the owner.
		let response = await fetch(`${SMART_HUB_1}/storage/add-raw-with-acl`, {
			method: 'post',
			body: JSON.stringify({data: strData, owner, ext: 'json', acl}),
		});
	
		// Display the meta address for the uploaded data.
		let responseJson = await response.json();
		let meta = responseJson.meta;
		this.setState({meta});
	};

	grantRead = async () => {
		// Grant READ permission to Bob.
		let tx = await aclContract.grantRead(bobAccount);
		await tx.wait();

		// Verify that READ permission.
		let result = await aclContract.hasRead(bobAccount);
		if (result) {
			this.setState({grantMessage: `Granted READ permission.`});
		}
	};

	revokeRead = async () => {
		// Revoke READ permission from Bob.
		let tx = await aclContract.revokeAccess(bobAccount);
		await tx.wait();

		// Verigy that READ permission has been revoked.
		let result = await aclContract.hasRead(bobAccount);
		if (!result) {
			this.setState({grantMessage: `Revoked READ permission.`});
		}
	};

	getData = async () => {
		// Get the PeerId of Smart Huy 2. The peerId is needed to generate the authentication token.
		let response = await fetch(`${SMART_HUB_2}/storage/status`, {
			method: 'get'
		});
		let responseJson = await response.json();
		let peerId = responseJson.peer_id;

		// Generate the authentication token for Bob's account.
		let token = await crypto.generateToken(peerId, bobWallet);

		// Stream the data from Smart Hub 1 to Smart Hub 2 using Bob's account.
		let dataMessage;
		try {
			let data = await fileStream.stream(SMART_HUB_2, this.state.meta, token, false);
			dataMessage = data.message;
		} catch(error) {
			dataMessage = error.message;	
		}

		// Display the data.
		this.setState({dataMessage});
	}

	render() {
		return (
			<View style={styles.container}>
				<View >

					<Text style={[{ marginTop: 10 }]}>Alice's Account: {this.state.account}</Text>
					<Text style={[{ marginTop: 10 }]}>Balance: {this.state.accountBal} PHT</Text>

					<TouchableOpacity
						style={styles.bigButton}
						onPress={() => this.saveData()}
					>
						<Text style={styles.buttonText}>Alice: Upload Data</Text>
					</TouchableOpacity>
				</View>

				<View style={[{ alignItems: "center" }]}>
					<Text style={[{ marginTop: 30 }]}>ACL Address: {this.state.acl}</Text>
					<Text style={[{ marginTop: 30 }]}>Meta Address: {this.state.meta}</Text>
				</View>

				<View >
					<TouchableOpacity
						style={styles.bigButton}
						onPress={() => this.grantRead()}
					>
						<Text style={styles.buttonText}>Alice: Grant READ to Bob</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.bigButton}
						onPress={() => this.revokeRead()}
					>
						<Text style={styles.buttonText}>Alice: Revoke READ from Bob</Text>
					</TouchableOpacity>
				</View>

				<View style={[{ alignItems: "center" }]}>
					<Text style={[{ marginTop: 30 }]}>{this.state.grantMessage}</Text>
				</View>

				<View ><TouchableOpacity
						style={styles.bigButton}
						onPress={() => this.getData()}
					>
						<Text style={styles.buttonText}>Bob: Get Data</Text>
					</TouchableOpacity>
				</View>

				<View style={[{ alignItems: "center" }]}>
					<Text style={[{ marginTop: 30 }]}>{this.state.dataMessage}</Text>
				</View>
			</View>
		);
	}
}

export default App;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		alignContent: "center",
		justifyContent: "center"
	},
	buttons: {
		flex: 1,
		flexDirection: "row"
	},
	bigButton: {
		marginRight: 40,
		marginLeft: 40,
		marginTop: 10,
		padding: 10,
		backgroundColor: "#68a0cf",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#fff"
	},
	buttonText: {
		color: "#fff",
		textAlign: "center"
	},
	textInput: {
		height: 40,
		paddingLeft: 6,
		borderBottomWidth: 1,
		borderBottomColor: "#76788f"
	},
	hidden: {
		opacity: 0,
		width: 0,
		height: 0
	}
});
