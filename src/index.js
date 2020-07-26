const axios = require('axios')
const mongoose = require('mongoose')
const { sleep } = require('./utils')
const log = require('./logging')
const config = require('../config.json')
const NotificationsBot = require('./notificationsBot')

async function main() {
  log.info(`Connecting to database at ${config.database.address}`);
  const fullURL = `mongodb://${config.database.username}:${config.database.password}@${config.database.address}`
  await mongoose.connect(fullURL)
  const notificationsBot = new NotificationsBot(config.notificationsBot)
  await notificationsBot.setup()

  while (true) {
    try {
      log.info(`Checking for slots..`)

      for (const sub of config.subscriptions) {
        log.info(`Checking ${sub.name}..`)
        if (sub.disabled) {
          log.info(`${sub.name} is disabled. Skipping.`)
          continue;
        }

        const yesterday = new Date().addDays(-1)
        const futureLimit = new Date().addDays(60)

        const rangeStart = yesterday.toISOString().split('T')[0]
        const rangeEnd = futureLimit.toISOString().split('T')[0]

        const url = `https://calendly.com/api/booking/event_types/${sub.bookingEntityId}/calendar/range?timezone=${config.timezone}&diagnostics=false&range_start=${rangeStart}&range_end=${rangeEnd}&single_use_link_uuid=`
        log.info(`Querying url: ${url}`)
        const { data } = await axios.get(url)
        const availableDays = data.days.filter(day => day.spots.filter(spot => spot.status === 'available').length > 0)

        if (availableDays.length > 0) {
          const notificationText = `Available spots for ${sub.profileLink} on days: ${JSON.stringify(availableDays.map(day => day.date))}`
          log.info(`Sending notification text ${notificationText}`)
          notificationsBot.broadcastNotification(notificationText)
        } else {
          log.info(`No available days for ${sub.name}`);
        }
      }

      await sleep(config.checkInterval)
    } catch (e) {
      const errMessage= `Failed to check for slots with ${e.stack}`
      log.error(errMessage)
      notificationsBot.broadcastNotification(errMessage)
      await sleep(config.checkInterval)
    }
  }
}

main().catch(e => {
  log.error(`FATAL: ${e.stack}`)
})
