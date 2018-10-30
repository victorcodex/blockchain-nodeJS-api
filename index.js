const express = require('express')
const app = express()

const cryptoapp = require('./app.js')

//mongodb://user5:user5user5@ds121321.mlab.com:21321/dealin_crud_test

app.post('/') // create account

app.listen(process.env.PORT || 3000, function(){ console.log('now listening on ' + process.env.PORT || 3000) })