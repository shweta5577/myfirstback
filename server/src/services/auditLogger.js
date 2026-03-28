const Log = require("../models/Log");
const { emitRealtimeEvent } = require("../config/socket");

const writeLog = async ({ actor = null, machine = null, action, level = "info", data = {} }) => {
  const entry = await Log.create({ actor, machine, action, level, data });
  emitRealtimeEvent("machine:log", entry);
  return entry;
};

module.exports = {
  writeLog
};
