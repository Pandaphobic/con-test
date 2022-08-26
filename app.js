const speedtest = require(".");

const test = new speedtest();

test.runTest();

test.event.on("ping", (e) => {
  console.log(e);
});

test.event.on("jitter", (e) => {
  console.log(e);
});

test.event.on("downloadResult", (e) => {
  console.log(e);
});

test.event.on("uploadResult", (e) => {
  console.log(e);
});
