const mongoose = require('mongoose')
const config = require('../../config')

const COLLECTION = config.database.collection;

const telegramBotSubscriberSchema = new mongoose.Schema({
  chatId: { type: String }
})

telegramBotSubscriberSchema.index({ chatId: 1 }, { unique: true })

module.exports = mongoose.model('TelegramBotSubscriber', telegramBotSubscriberSchema, COLLECTION)
