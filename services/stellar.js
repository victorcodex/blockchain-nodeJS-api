const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const request = require('request');

class stellar{

	createAccount(){
		return new Promise(function(resolve, reject){
			var pair = StellarSdk.Keypair.random();

			let secretkey = pair.secret()
			let publickey = pair.publicKey()


			request.get({
			  url: 'https://friendbot.stellar.org',
			  qs: { addr: publickey },
			  json: true
			}, function(error, response, body) {
			  if (error || response.statusCode !== 200) {
			    reject(error)
			  }
			  else {
			    resolve({secretkey, publickey})
			  }
			});
		});
	}

	fundWallet(){
		//
	}

	async sendFunds(mysecret, friendsPublickey, amount){
		let sourceKeys = StellarSdk.Keypair.fromSecret(mysecret);
		let destinationId = friendsPublickey;

		try{
			let friendAccount = await server.loadAccount(destinationId)
			let sourceAccount = await server.loadAccount(sourceKeys.publicKey())

			

			let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
		    .addOperation(StellarSdk.Operation.payment({
		    	destination: destinationId,
		        asset: StellarSdk.Asset.native(),
		    	amount: "" + amount
		    }))
		    .addMemo(StellarSdk.Memo.text('sending funds'))
		    .build();

		    

    		transaction.sign(sourceKeys);
    		let result = await server.submitTransaction(transaction);

    		return result;
		}
		catch(err){
			console.log(err)
			throw new Error('Unable to process transaction. Please try again')
		}

	}

	async balance(publickey){
		let account = await server.loadAccount( publickey )
		let balances = account.balances;
		let result = [];
		balances.forEach(function(balance) {
		   	result[result.length] = { type: balance.asset_type, balance: balance.balance};
		});

		return result;
	}

	async getTransactions( publickey ){
		let transactions = await server.transactions()
	    .forAccount( secret )
	    .call()

	    return transaction.records
	}
}

module.exports = new stellar()