const puppeteer = require("puppeteer-core");
const { BrowserWindow, session } = require("electron");
const pie = require("puppeteer-in-electron");

async function register(data, app) {
  const browser = await pie.connect(app, puppeteer);
  // Create a new window
  const window = new BrowserWindow({
    height: 800,
    width: 1200,
  });
  try {
    // Generate the url
    const url = `https://www.mijndomein.nl/domeinnaam-checken?domeinnaam=${data.domain}&ga=nieuw`;

    // load the url
    await window.loadURL(url);

    // Connect the electron with puppeeter
    const page = await pie.getPage(browser, window);

    // Click the cookiee button
    const cookieeBtn = await page.$("#dd_popup_container_side_acceptButton");

    if (cookieeBtn) {
      await Promise.all([
        page.waitForNavigation({ timeout: 0 }),
        cookieeBtn.click(),
      ]);
    }

    await page.waitFor(4000);
    // Click the add to cart button
    const addToCartBtn = await page.$("a.outlined");
    if (addToCartBtn) {
      addToCartBtn.click();
      await page.waitFor(4000);
    }

    // Click the Next Button
    const nextButton = await page.$("a.wide");
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      nextButton.click(),
    ]);
    await page.waitFor(8000);

    // Click Add to cart button
    await page.evaluateHandle(() => {
      const modalBtn = document.querySelector("a.md-modal__btn--close");
      modalBtn.click();
      const btns = document.querySelectorAll("button");
      return btns[8].click();
    });
    await page.waitFor(4000);

    // Click the Next Button
    const nextButtonPage2 = await page.$("a.wide");
    await Promise.all([
      page.waitForNavigation({ timeout: 0 }),
      nextButtonPage2.click(),
    ]);

    await page.waitFor(5000);

    // Login
    const username = await page.$("#_username");
    const password = await page.$("#_password");

    if (username && password) {
      await page.type("#_username", data.username);
      await page.type("#_password", data.password);
      await page.waitFor(5000);
      // Click the login button
      await Promise.all([
        page.waitForNavigation({ timeout: 0 }),
        page.click("button.btn-login"),
      ]);
    }

    // Select the Credit card method
    await page.click("#payment_method_type_payment_method_CC");

    // Fill in the credit card form
    await page.type("#adyen-encrypted-form-holder-name", data.name);
    await page.type("#adyen-encrypted-form-number", data.creditcard);
    await page.type("#adyen-encrypted-form-expiry-month", data.cardMonth);
    await page.type("#adyen-encrypted-form-expiry-year", data.cardYear);
    await page.type("#adyen-encrypted-form-cvc", data.cardCVC);

    // Agree to Terms and conditions and click the pay button
    await page.evaluateHandle(() => {
      const btns = document.querySelector("#payment_method_type_mandate");
      const payBtn = document.querySelector("button.wide");
      btns.click();
      return payBtn.click();
    });

    // Wait for navigation
    await page.waitForNavigation({ timeout: 0 });
    await page.waitFor(5000);

    // Confirm if the payment succeed
    const message = await page.$("a.wide");

    let value = await page.evaluate((el) => el.textContent, message);

    value = value.trim();

    // Take the screen shot
    await page.screenshot({ path: `confirm_payment.png` });

    console.log(value);

    // If payment failed throw an error
    if (value === "Probeer het nog eens" || value === "Try again") {
      await session.defaultSession.clearCache();
      // await session.defaultSession.clearStorageData();
      await session.defaultSession.clearAuthCache();
      await window.destroy();

      return new Error(
        "Error proccessing your payment. make sure you provide correct information"
      );
    }

    // Close the browser
    await session.defaultSession.clearCache();
    // await session.defaultSession.clearStorageData();
    await session.defaultSession.clearAuthCache();
    await window.destroy();

    return {
      payment_succeed: true,
      img: `${__dirname}/confirm_payment.png`,
    };
  } catch (error) {
    console.log("Some error occured during the registration procees");
    console.error(error);
    await session.defaultSession.clearCache();
    // await session.defaultSession.clearStorageData();
    await session.defaultSession.clearAuthCache();
    await window.destroy();
    return {
      payment_succeed: false,
    };
  }
}

module.exports = register;
