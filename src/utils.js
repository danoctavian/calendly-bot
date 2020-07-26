
Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

async function sleep(ms) {
  await new Promise((resolve, reject) => setTimeout(resolve, ms));
}

module.exports = {
  sleep
}
