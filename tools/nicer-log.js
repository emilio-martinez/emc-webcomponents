const package = require('../package.json');
const util = require('util');

function nicerLog(title, ...logItems) {
  const inspectOpts = { colors: true, compact: true };
  const toPrint = logItems.reduce(
    (acc, arg) => acc.concat(util.inspect(arg, inspectOpts), '\r\n'),
    []
  );
  console.log(`[${package.name}] ${title}:\r\n`, ...toPrint);
}

module.exports = nicerLog;
