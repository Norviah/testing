module.exports = {
  apps : [{
    name: 'trio',
    script: 'build/places/run.js',
    // cron_restart: "0 */6 * * *",
    cron_restart: "*/2 * * * *",
    autostart: false,
    instances: 1
  }]
};
