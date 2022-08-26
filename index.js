import puppeteer from "puppeteer-core";
import events from "events";
import os from "os";
export var event = new events.EventEmitter();

export class Speedtest {
  constructor() {
    this.event = event;
  }

  async runTest() {
    let url = "https://gazelle.speedtestcustom.com/";

    let browserPath = "";

    switch (os.type()) {
      case "Windows_NT":
        browserPath =
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
        break;

      default:
        break;
    }

    let launchOptions = {
      headless: false,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--start-maximized"],
    };

    let browser = await puppeteer.launch(launchOptions);

    let page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle0" });
    await page.click("#main-content > div.button__wrapper > div > button");

    // Ping
    await page.waitForSelector(
      "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span"
    );
    const ping = await page.$eval(
      "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-ping > div.result-body > div > div > span",
      (item) => item.textContent
    );
    // console.log("Ping:", ping);
    event.emit("ping", ping);

    // Jitter
    await page.waitForSelector(
      "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span"
    );
    const jitter = await page.$eval(
      "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-latency > div.result-tile.result-tile-jitter > div.result-body > div > div > span",
      (item) => item.textContent
    );

    // console.log("Jitter:", jitter);
    event.emit("jitter", jitter);

    // Download Started
    await page.waitForSelector(
      "#root > div > div.test.test--download.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-download > div.result-body > div > div > span"
    );
    // console.log("Download Started");

    // Upload Started (Signals that download is complete)
    await page.waitForSelector(
      "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-active-test.result-tile-upload > div.result-body > div > div > span"
    );

    const downloadResult = await page.$eval(
      "#root > div > div.test.test--upload.test--in-progress > div.container > main > div > div.results-speed > div.result-tile.result-tile-download > div.result-body > div > div > span",
      (item) => item.textContent
    );

    // console.log("Download: ", downloadResult);
    event.emit("downloadResult", downloadResult);

    // console.log("Upload Started");

    // Share links only show at the end when all tests are done
    await page.waitForSelector(
      "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.share-assembly > div.share__links > span"
    );

    const uploadResult = await page.$eval(
      "#root > div > div.test.test--finished.test--in-progress > div.container > main > div.results-container.results-container-stage-finished > div.results-speed > div.result-tile.result-tile-upload > div.result-body > div > div > span",
      (item) => item.textContent
    );

    // console.log("Upload: ", uploadResult);
    event.emit("uploadResult", uploadResult);

    browser.close();
    console.log("Tests Complete");
  }
}
