# CON-TEST

The CONnectivity TESTer you've been waiting for!

## Install

`yarn add @pandaphobic/con-test`
or
`npm install @pandaphobic/con-test`

## Example

```
const Speedtest = require("@pandaphobic/con-test");

// Must include a link to a CUSTOM speedtest url
// These can be created at https://www.ookla.com/speedtest-custom
// Should look like: https://CUSTOM_NAME.speedtestcustom.com/
const speedtest = new Speedtest(CUSTOM_SPEEDTEST_URL);

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

```
