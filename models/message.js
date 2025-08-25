const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    room:'String',
    user:'String',
    text:'String',
    imageUrl: String,  
    timestamp: { type: Date, default: Date.now }
})
module.exports=mongoose.model('message',messageSchema)