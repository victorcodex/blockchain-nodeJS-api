const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const urlparser = bodyParser.urlencoded({extended: false})
const jsonparser = bodyParser.json()

const cryptoapp = require('./app.js')

//mongodb://user5:user5user5@ds121321.mlab.com:21321/dealin_crud_test

app.post('/users', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["firstname", "lastname", "email", "phone", "password", "username"], req.body)
		cryptoapp.register(req.body.firstname, req.body.lastname, req.body.email, req.body.password, req.body.username, req.body.phone )
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/user', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["password", "username"], req.body)
		cryptoapp.login(req.body.username, req.body.password)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/user/logout', function(req, res){
	try{
		cryptoapp.logout(req.headers.token)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/user/wallets', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		cryptoapp.createNewCryptoWallet(req.headers.token, req.body.network)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.put('/user/wallets', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["network", "publickey", "privatekey"], req.body)
		cryptoapp.addExistingCryptoWallet(req.headers.token, req.body.network, req.body.publickey, req.body.privatekey)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/friends', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["friendid"], req.body)
		cryptoapp.addFriend(req.headers.token, req.body.friendid)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/friends', function(req, res){
	try{
		
		cryptoapp.getListOfFriends(req.headers.token)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.post('/transfer', [urlparser, jsonparser], function(req, res){
	try{
		cryptoapp.verifyRequired(["friendid", "amount", "network"], req.body)
		cryptoapp.sendFundsToFriend(req.headers.token, req.body.friendid, req.body.amount, req.body.network)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/balance', function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		cryptoapp.getBalance(req.headers.token, req.body.network)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})
app.get('/transactions', function(req, res){
	try{
		cryptoapp.verifyRequired(["network"], req.body)
		cryptoapp.getRecentTransactions(req.headers.token, req.body.network)
	}
	catch(e){
		res.json({status: 400, message: e.message })
	}
})

app.listen(process.env.PORT || 3000, function(){ console.log('now listening on ' + process.env.PORT || 3000) })