const Speedtest = require(".");

const speedtest = new Speedtest("https://CUSTOM.speedtestcustom.com/");

speedtest.runTest();

// wait 10 seconds then call speedtest.stopTest()
const timeoutId1 = setTimeout(() => {
  speedtest.stopTest();
}, 10000);

// run the test again after 12 seconds
const timeoutId2 = setTimeout(() => {
  speedtest.runTest();
}, 12000);

// try runnig it while another is running (won't work)
const timeoutId3 = setTimeout(() => {
  speedtest.runTest();
}, 14000);

speedtest.event.on("started", (e) => {
  // e is the started result
  console.log(e);
});

speedtest.event.on("ping", (e) => {
  // e is the ping result
  console.log(e);
});

speedtest.event.on("jitter", (e) => {
  // e is the jitter result
  console.log(e);
});

speedtest.event.on("downloadResult", (e) => {
  // e is the download result
  console.log(e);
});

speedtest.event.on("uploadResult", (e) => {
  // e is the upload result
  console.log(e);
});

speedtest.event.on("isp", (e) => {
  // e is the isp result
  console.log(e);
});

speedtest.event.on("ip", (e) => {
  // e is the ip result
  console.log(e);
});

speedtest.event.on("location", (e) => {
  // e is the location result
  console.log(e);
});

speedtest.event.on("stopped", (e) => {
  // e is the stopped result
  console.log(e);
});

speedtest.event.on("error", (e) => {
  // e is the error result
  console.log(e);
});

speedtest.event.on("complete", (e) => {
  // e is the complete result
  console.log(e);
});

speedtest.event.on("timeout", (e) => {
  // e is the timeout result
  console.log(e);
});
