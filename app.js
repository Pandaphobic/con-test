const Speedtest = require(".");

const speedtest = new Speedtest("https://CUSTOM_NAME.speedtestcustom.com/");

speedtest.runTest();

speedtest.event.on("ping", (e) => {
  console.log(e);
});

speedtest.event.on("jitter", (e) => {
  console.log(e);
});

speedtest.event.on("downloadResult", (e) => {
  console.log(e);
});

speedtest.event.on("uploadResult", (e) => {
  console.log(e);
});
