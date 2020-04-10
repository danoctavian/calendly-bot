const log = require('./logging')
const config = require('./config.json')
const NotificationsBot = require('./notificationsBot')

async function main() {
  const notificationsBot = new NotificationsBot(config.notificationsBot)
  await notificationsBot.setup()

  while (true) {
    try {
      log.info(`Checking for slots..`)

      for (const sub of config.subscriptions) {
        log.info(`Checking ${sub.name}..`)

        // TODO: finish
        const url = `https://calendly.com/api/booking/event_types/${config.bookingEntityId}/calendar/range?timezone=${config.timezone}&diagnostics=false&range_start=2020-04-10&range_end=2020-04-30&single_use_link_uuid=`
        await axios.get(url)
      }

      await new Promise((resolve, reject) => setTimeout(config.checkInterval, resolve))
    } catch (e) {
      const errMessage= `Failed to check for slots with ${e.stack}`
      log.error(errMessage)
      notificationsBot.broadcastNotification(errMessage)
    }
  }
}

main().catch(e => {
  log.error(`FATAL: ${e.stack}`)
})
