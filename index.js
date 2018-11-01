const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const urlparser = bodyParser.urlencoded({extended: false})
const jsonparser = bodyParser.json()

const cryptoapp = require('./app.js')

//mongodb://user5:user5user5@ds121321.mlab.com:21321/dealin_crud_test

app.post('/users', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["firstname", "lastname", "email", "phone", "password", "username"], req.body)
		let result = await cryptoapp.register(req.body.firstname, req.body.lastname, req.body.email, req.body.password, req.body.username, req.body.phone )
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/user', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["password", "username"], req.body)
		let result = await cryptoapp.login(req.body.username, req.body.password)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/user/logout', async function(req, res){
	try{
		let result = await cryptoapp.logout(req.get('token'))
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/user/wallets', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		let result = await cryptoapp.createNewCryptoWallet(req.get('token'), req.body.network)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.put('/user/wallets', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["network", "publickey", "privatekey"], req.body)
		let result = await cryptoapp.addExistingCryptoWallet(req.get('token'), req.body.network, req.body.publickey, req.body.privatekey)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/friends', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["friendid"], req.body)
		let result = await cryptoapp.addFriend(req.get('token'), req.body.friendid)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/friends', async function(req, res){
	try{
		
		let result = await cryptoapp.getListOfFriends(req.get('token'))
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/transfer', [urlparser, jsonparser], async function(req, res){
	try{
		cryptoapp.verifyRequired(["friendid", "amount", "network"], req.body)
		let result = await cryptoapp.sendFundsToFriend(req.get('token'), req.body.friendid, req.body.amount, req.body.network)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/balance', async function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		let result = await cryptoapp.getBalance(req.get('token'), req.body.network)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/transactions', async function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		let result = await cryptoapp.getRecentTransactions(req.get('token'), req.body.network)
		res.json(result)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})

app.listen(3000, function(){ console.log('now listening on ' + 3000) })