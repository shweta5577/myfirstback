const seedData = require("../seed/seedData");

const shouldAutoSeed = () => {
  return String(process.env.AUTO_SEED_ON_START || "").toLowerCase() === "true";
};

const runStartupSeed = async () => {
  if (!shouldAutoSeed()) {
    return;
  }

  const result = await seedData();
  // eslint-disable-next-line no-console
  console.log("Startup seed:", result.message || "completed");
};

module.exports = {
  runStartupSeed
};
