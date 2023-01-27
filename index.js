const puppeteer = require("puppeteer-core");
const { findChrome } = require("find-chrome-bin");
const events = require("events");
var event = new events.EventEmitter();

class Speedtest {
  constructor(url) {
    this.event = event;
    this.url = url;
    this.browser = null;
    this.timeoutId = null;
  }

  async runTest() {
    let browserPath = "";
    // find and use local chrome install
    try {
      browserPath = await findChrome().then((e) => {
        return e.executablePath;
      });
    } catch (err) {
      console.error("Chrome Not Installed", err);
      event.emit("error", "Chrome Not Installed");
    }
    // if chrome not installed, exit
    if (browserPath === "") {
      return;
    }

    let launchOptions = {
      headless: true,
      executablePath: browserPath,
      args: ["--start-maximized"],
    };

    // setup the browser object
    this.browser = await puppeteer.launch(launchOptions);

    // Timeout after 1 minute
    const timeoutId = setTimeout(() => {
      // this should never really fire unless the test is stalled
      // network errors will be caught by the #test and returned as error
      this.timeoutTest();
    }, 60000);

    // Start test - if zero returned, clear timeout
    await this.#test().then((e) => {
      // success
      if (e === 0) {
        clearTimeout(timeoutId);
        event.emit("complete", "Test Complete");
      }
      // error
      if (e === 1) {
        clearTimeout(timeoutId);
        event.emit("error", "Test Error");
      }
    });
  }

  stopTest() {
    this.browser.close();
    event.emit("stopped", "Test Stopped");
  }

  timeoutTest() {
    this.browser.close();
    event.emit("timeout", "Test Timed Out");
  }

  async #test() {
    // return a promise that resolves when the test is complete
    return new Promise(async (resolve, reject) => {
      let page = await this.browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
      );

      await page.goto(this.url, { waitUntil: "networkidle0" });
      await page.click("#main-content > div.button__wrapper > div > button");

      // Gather Ping
      await page
        .waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span"
        )
        .catch((err) => {
          // timeout
          event.emit("error", "Ping Timeout");
          resolve(1);
        });
      const ping = await page.$eval(
        "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span",
        (item) => item.textContent
      );
      // Emit Ping Result
      event.emit("ping", ping);

      // Gather Jitter
      await page
        .waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span"
        )
        .catch((err) => {
          // timeout
          event.emit("error", "Jitter Timeout");
          resolve(1);
        });
      const jitter = await page.$eval(
        "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span",
        (item) => item.textContent
      );
      // Emit Jitter Result
      event.emit("jitter", jitter);

      // Gather ISP
      const isp = await page.$eval(
        "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--isp > div.host-display__connection-body > h3",
        (item) => item.textContent
      );
      // Emit ISP Result
      event.emit("isp", isp);

      // Gather IP
      const ip = await page
        .$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--isp > div.host-display__connection-body > h4",
          (item) => item.textContent
        )
        .catch((err) => {
          // timeout
          event.emit("error", "IP Timeout");
          resolve(1);
        });
      // Emit IP Result
      event.emit("ip", ip);

      // Gather Location
      const location = await page.$eval(
        "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--sponsor > div.host-display__connection-body > h4 > span",
        (item) => item.textContent
      );
      // Emit Location Result
      event.emit("location", location);

      // Download Started
      await page
        .waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-download > div.result-body > div > div > span"
        )
        .catch((err) => {
          // timeout
          event.emit("error", "Download Timeout");
          resolve(1);
        });
      // Upload Started (Signals that download is complete)
      await page
        .waitForSelector(
          "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-upload > div.result-body > div > div > span"
        )
        .catch((err) => {
          // timeout
          event.emit("error", "Upload Timeout");
          resolve(1);
        });

      // Gather Download
      const downloadResult = await page.$eval(
        "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-tile-download > div.result-body > div > div > span",
        (item) => item.textContent
      );
      // Emit Download Result
      event.emit("downloadResult", downloadResult);

      // Share links only show at the end when all tests are done
      await page
        .waitForSelector(
          "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.share-assembly > div.share__links > span"
        )
        .catch((err) => {
          // timeout
          event.emit("error", "Download Timeout");
          resolve(1);
        });

      // Gather Upload
      const uploadResult = await page.$eval(
        "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-upload > div.result-body > div > div > span",
        (item) => item.textContent
      );

      // Emit Upload Result
      event.emit("uploadResult", uploadResult);

      this.browser.close();
      resolve(0);
    });
  }
}

module.exports = Speedtest;
