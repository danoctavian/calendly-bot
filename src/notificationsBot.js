const TelegramBot = require('node-telegram-bot-api')
const log = require('./logging')
const { TelegramBotSubscriber } = require('./models')

class NotificationsBot {
  constructor(config) {
    this.secretToken = config.secretToken
    this.dryRun = config.dryRun
    this.subscribers = config.notificationSubscribers
  }

  async setup() {
    if (this.dryRun) {
      log.info(`Telegram notifications bot is running in DRYRUN mode. No subscribing or polling is happening.`)
    } else {
        const storedSubscribers = await TelegramBotSubscriber.find()
        this.subscribers = storedSubscribers
        log.info(`The following chat ids are subscribed to notifications ${JSON.stringify(this.subscribers)}`)

        this.bot = new TelegramBot(this.secretToken, {polling: true})

        this.bot.on('error', e => {
          log.error(e.stack)
        })

        // Matches "/echo [whatever]"
        this.bot.onText(/\/subscribe/, async (msg) => {
          const chatId = msg.chat.id;
          log.info(`Received subscribe request from chat id ${chatId}`)

          if (new Set(this.subscribers).has(chatId)) {
            log.info(`Chat ID ${chatId} already subscribed`)
            await this.bot.sendMessage(chatId, 'Already subscribed to notifications.')
          } else {
            log.info(`Subscriber unknown.`)
            this.subscribers.push({ chatId });

            await TelegramBotSubscriber.create({ chatId });
            await log.info(`Chat ID ${chatId} subscribed successfully`)
            this.bot.sendMessage(chatId, 'You have successfully subscribed to notifications.')
          }
        })
    }
  }

  async broadcastNotification(text) {
    if (this.dryRun) {
      log.info(`DRYRUN broadcast notification: ${text}`)
    } else {
      await this.setup();
      await Promise.all(this.subscribers.map(async subscriber => {
        try {
          await this.bot.sendMessage(subscriber.chatId, text)
          log.info(`Broadcasting notification: ${text} to ${subscriber.chatId}`);
        } catch (e) {
          log.error(`Failed to send notification to chat ID ${subscriber.chatId} with ${e.stack}. Moving on.`)
        }
      }))
    }
  }
}

module.exports = NotificationsBot
