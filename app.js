const mongo = require('mongodb')
const MongoClient = mongo.MongoClient
const ObjectId = mongo.ObjectId
const client = new MongoClient("mongodb://user5:user5user5@ds121321.mlab.com:21321/dealin_crud_test")
const Crypto = require('crypto-js')

const stellar = require('./services/stellar.js')
const bitcoin = require('./services/bitcoin.js')
const etherum = require('./services/etherum.js')

const NETWORKS = {
	STELLAR: 'stellar',
	BITCOIN: 'bitcoin',
	ETHERUM: 'etherum'
};

let db;

class app{
	constructor(){
		(async () => {
			await client.connect()
			db = client.db('dealin_crud_test')
			console.log("This code ran")
		})()
		
	}

	async register(firstname, lastname, email, password, username, phone ){
		password = Crypto.SHA256(password).toString()
		let user = await db.collection("users").find({$or: [{username: username}, {email: email.toLowerCase() }] }).limit(1).toArray()
		if(user.length > 0) throw new Error('Sorry, the provided username/email is already taken');

		user = {
			firstname,
			lastname,
			phone,
			email: email.toLowerCase(),
			password,
			username,
			friends:[],
			joined: new Date(),
			sessionToken: Math.random().toString(36).substr(2, 12) // seed session token so empty token is not used to login
		}

		await db.collection("users").insertOne( user )
		return {status: 200, message: 'Account created'}
	}

	async login(username, password){
		let email = username.toLowerCase()
		password = Crypto.SHA256(password).toString()

		let user = await db.collection("users").find({$or: [{username: username}, {email: email.toLowerCase() }], password: password }).limit(1).toArray()
		if(user.length == 0) throw new Error('Invalid username/password supplied')

		let sessionToken = Math.random().toString(36).substr(2, 13)
		await db.collection("users").updateOne({_id: user[0]._id}, {$set: {sessionToken}})

		return {status: 200, sessionToken, firstname: user.firstname }
	}

	async logout( sessionToken ){
		await this.verifysession( sessionToken )
		await db.collection("users").updateOne({_id: this.user._id}, {$set:{ sessionToken: Math.random().toString(36).substr(2, 14)}})
		return {status: 200, message: 'You are now logged out'}
	}

	async createNewCryptoWallet(sessionToken, network){
		await this.verifysession(sessionToken)
		let service = this.resolveService(network)

		let result = await service.createAccount()
		let address = {
			publickey: result.publickey,
			privatekey: result.privatekey,
			network,
			owner: this.user._id,
			created: new Date()
		};

		await db.collection("wallets").insertOne(address)
		return {status: 200, message: 'Account created for '+ network, address: address.publickey }
	}

	async addExistingCryptoWallet(sessionToken, network, publickey, privatekey ){
		await this.verifysession(sessionToken)
		network = this.verifynetwork(network)

		let address = {
			publickey,
			privatekey,
			network,
			owner: this.user._id,
			created: new Date()
		}

		await db.collection("wallets").insertOne(address)
		return {status: 200, message: 'Your existing wallet address has been saved'}
	}

	async addFriend(sessionToken, friendId){
		// friendid can be email or username or phone
		let email = friendId.toLowerCase()
		await this.verifysession( sessionToken )

		// make sure I'm not adding myself as a friend
		if(this.user.username == friendId || this.user.email == email || this.user.phone == friendId) throw new Error('You cannot add yourself as your friend')

		let friend = await db.collection('users').find({$or:[
			{email}, {username: friendId}, {phone: friendId}
		]}).limit(1).toArray()

		if(friend.length == 0) throw new Error('No friend with this id found. Please invite your friend to join this awesome platform')

		// have I already added friend
		if(this.alreadyHaveFriend(friend[0]._id)) return {status: 200, message: 'You already have this person as your friend'}
		await db.collection("users").updateOne({_id: this.user._id}, {$addToSet:{friends: friend[0]._id}})
		
		return {status: 200, message: 'Friend has been added' }
	}

	async inviteFriend(sessionToken, firstname, lastname, phone, email){
		// send email/sms to friend
	}

	async getListOfFriends(sessionToken){
		await this.verifysession(sessionToken)

		if(this.user.friends.length == 0) return {status: 200, message: "You haven't added any friends yet "}

		let friends = await db.collection("users").find({_id: {$in: this.user.friends }}).toArray()
		let result = []
		friends.forEach((friend) => {
			result[ result.length ] = {
				firstname: friend.firstname,
				lastname: friend.lastname,
				email: friend.email,
				phone: friend.phone,
				id: friend._id.toString()
			}
		})

		return {status: 200, message:'friend list', friends: result }
	}

	async sendFundsToFriend(sessionToken, friendId, amount, network){
		await this.verifysession(sessionToken)
		this.verifynetwork(network)
		friendId = new ObjectId(friendId)
		let service = this.resolveService(network)

		let friend = await db.collection("users").find({_id: friendId}).limit(1).toArray()
		if(friend.length > 0){
			// ensure both user and friend have wallets in the intended network
			let mywallet = await db.collection("wallets").find({owner: this.user._id, network}).limit(1).toArray()
			let friendwallet = await db.collection("wallets").find({owner: friendId, network}).limit(1).toArray()

			if(mywallet.length == 0 || friendwallet == 0) throw new Error('Sorry. Either you or your friend does not have a wallet saved in the specified network')

			let result = await service.sendFunds(mywallet[0].secretkey, friendwallet[0].publickey, amount )

		}else{
			return {status: 404, message: 'Friend not found'}
		}
	}

	async getBalance( sessionToken, network ){
		await this.verifysession(sessionToken)
		let service = this.resolveService(network)

		let mywallet = await db.collection("wallets").find({owner: this.user._id, network}).limit(1).toArray()

		let balance = await service.balance(mywallet[0].publickey )

	}

	async getRecentTransactions(sessionToken, network ){
		await this.verifysession(sessionToken)
		let service = this.resolveService(network)

		let mywallet = await db.collection("wallets").find({owner: this.user._id, network}).limit(1).toArray()

		let transactions = await service.getTransactions(mywallet[0].publickey )

		return transactions
	}

	async verifysession(token){
		let user = await db.collection("users").find({ sessionToken: token}).limit(1).toArray()
		if(user.length == 0) throw new Error('Invalid session. Please login')
		this.user = user[0]
		return true
	}

	resolveService( network ){
		network = this.verifynetwork(network)
		switch(network){
			case NETWORKS.STELLAR:
				return stellar 
			case NETWORKS.BITCOIN:
				return bitcoin
			case NETWORKS.ETHERUM:
				return etherum
		}
	}

	verifynetwork( network ){
		let keys = Object.keys(NETWORKS);
		for(let i in keys){
			if(NETWORKS[ keys[i] ] == network ) return network;
		}
		let validValues = Object.values(NETWORKS)
		throw new Error('Invalid Network chosen. Valid values are' + validValues.join(",") );
	}

	alreadyHaveFriend(id){
		for(let i in this.user.friends){
			if(this.user.friends[i] === id) return true
		}

		return false
	}

	verifyRequired(keys, obj){
		let fails = []
		for(let i in keys){
			let key = keys[i]
			if(obj[key] && obj[key] !== ""){}
			else{ fails[fails.length] = key; }
		}

		if(fails.length > 0){ throw new Error(fails.join(",") + " parameters are required"); }
	}
}

module.exports = new app()