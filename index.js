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
    this.running = false;
    this.stopped = false;
  }

  async runTest() {
    if (this.running) return;
    this.running = true;
    let browserPath = "";
    // find and use local chrome install
    try {
      browserPath = await findChrome().then((e) => {
        return e.executablePath;
      });
    } catch (err) {
      // console.error("Chrome Not Installed", err);
      this.errorTest("Chrome Not Installed");
    }
    // if chrome not installed, exit
    if (browserPath === "") {
      this.errorTest("Chrome Not Installed");
      return;
    }

    let launchOptions = {
      headless: true,
      executablePath: browserPath,
      args: ["--single-process", "--no-zygote"],
    };

    // setup the browser object
    try {
      this.browser = await puppeteer.launch(launchOptions);
    } catch (err) {
      this.errorTest("Browser Launch Error");
    }

    // Timeout after 1 minute
    this.timeoutId = setTimeout(() => {
      // this should never really fire unless the test is stalled
      // network errors will be caught by the #test and returned as error
      this.errorTest("Test Timed Out after 60 seconds of incactivity");
    }, 60000);

    // Start test - if zero returned, clear timeout
    await this.#test().then((e) => {
      // success
      if (e === 0) {
        clearTimeout(this.timeoutId);
        event.emit("complete", "Test Complete");
        this.running = false;
        this.browser.close();
      }
      // error
      else {
        clearTimeout(this.timeoutId);
        this.errorTest(e);
      }
    });
  }

  async stopTest() {
    this.stopped = true;
    clearTimeout(this.timeoutId);
    let pages = await this.browser.pages();
    // close all pages
    for (let i = 0; i < pages.length; i++) {
      await pages[i].close();
    }
    // close browser
    this.browser.close().then(() => {
      event.emit("stopped", "Test Stopped");
      this.running = false;
    });
  }

  async errorTest(reason) {
    let pages = await this.browser.pages();
    // close all pages
    for (let i = 0; i < pages.length; i++) {
      await pages[i].close();
    }
    // close browser
    this.browser.close();
    if (!this.stopped) {
      this.browser.on("disconnected", () => {
        this.running = false;
        event.emit("error", reason);
      });
    }
  }

  async #test() {
    // return a promise that resolves when the test is complete
    return new Promise(async (resolve, reject) => {
      // Emit Test Started
      this.stopped = false;
      event.emit("started", "Test Started");

      // Create Page
      try {
        var page = await this.browser.newPage();
      } catch (err) {
        resolve("Page Creation Error");
      }

      // Set User Agent
      try {
        await page.setUserAgent(
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
        );
      } catch (err) {
        resolve("User Agent Error");
      }

      try {
        // Load Page
        await page.goto(this.url, { waitUntil: "networkidle0" });
      } catch (err) {
        resolve("Page Load Error");
      }

      try {
        // Click Start Test
        await page.click("#main-content > div.button__wrapper > div > button");
      } catch (error) {
        resolve("Page Load Error");
      }

      // Wait for Ping
      try {
        await page.waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span"
        );
      } catch (err) {
        // timeout
        resolve("Ping Timeout");
      }

      // Gather Ping
      try {
        const ping = await page.$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span",
          (item) => item.textContent
        );
        // Emit Ping Result
        event.emit("ping", ping);
      } catch (err) {
        // error
        // this.errorTest(err);
        resolve(err);
      }

      // Wait for Jitter
      try {
        await page.waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span"
        );
      } catch (err) {
        // timeout
        // this.errorTest("Jitter Timeout");
        resolve("Jitter Timeout");
      }

      // Gather Jitter
      try {
        const jitter = await page.$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span",
          (item) => item.textContent
        );
        // Emit Jitter Result
        event.emit("jitter", jitter);
      } catch (err) {
        // error
        // this.errorTest("Jitter Error");
        resolve("Jitter Error");
      }

      // Gather ISP
      try {
        const isp = await page.$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--isp > div.host-display__connection-body > h3",
          (item) => item.textContent
        );

        // Emit ISP Result
        event.emit("isp", isp);
      } catch (err) {
        // error
        // this.errorTest("ISP Error");
        resolve("ISP Error");
      }

      // Gather IP
      try {
        const ip = await page.$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--isp > div.host-display__connection-body > h4",
          (item) => item.textContent
        );
        // Emit IP Result
        event.emit("ip", ip);
      } catch (err) {
        // timeout
        // this.errorTest("IP Timeout");
        resolve("IP Timeout");
      }

      // Gather Location
      try {
        const location = await page.$eval(
          "#root > div > div.test.test--download.test--in-progress > div.container > footer > div.host-display-transition > div > div.host-display__connection.host-display__connection--sponsor > div.host-display__connection-body > h4 > span",
          (item) => item.textContent
        );
        // Emit Location Result
        event.emit("location", location);
      } catch (err) {
        // timeout
        // this.errorTest("Location Timeout");
        resolve("Location Timeout");
      }

      // Download Started
      try {
        await page.waitForSelector(
          "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-download > div.result-body > div > div > span"
        );
      } catch (err) {
        // timeout
        // this.errorTest("Download Timeout");
        resolve("Download Timeout");
      }

      // Upload Started (Signals that download is complete)
      try {
        await page.waitForSelector(
          "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-upload > div.result-body > div > div > span"
        );
      } catch (err) {
        // timeout
        // this.errorTest("Upload Timeout");
        resolve("Upload Timeout");
      }

      // Gather Download
      try {
        const downloadResult = await page.$eval(
          "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-tile-download > div.result-body > div > div > span",
          (item) => item.textContent
        );
        // Emit Download Result
        event.emit("downloadResult", downloadResult);
      } catch (err) {
        // timeout
        // this.errorTest("Download Error");
        resolve("Download Error");
      }

      // Share links only show at the end when all tests are done
      try {
        await page.waitForSelector(
          "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.share-assembly > div.share__links > span"
        );
      } catch (err) {
        // timeout
        // this.errorTest("Download Timeout");
        resolve("Download Timeout");
      }
      // Gather Upload
      try {
        const uploadResult = await page.$eval(
          "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-upload > div.result-body > div > div > span",
          (item) => item.textContent
        );
        // Emit Upload Result
        event.emit("uploadResult", uploadResult);
      } catch (err) {
        // timeout
        // this.errorTest("Upload Error");
        resolve("Upload Error");
      }

      this.browser.close();
      resolve(0);
      return;
    });
  }
}

module.exports = Speedtest;
