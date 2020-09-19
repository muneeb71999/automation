const { app, BrowserWindow } = require("electron");
const express = require("express");
const axios = require("axios");
const pie = require("puppeteer-in-electron");
const path = require("path");
const register = require("./register");
const port = 6535;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

function startExpressServer() {
  const expressApp = express();

  expressApp.use(express.static(path.resolve(__dirname, "")));

  // Middlewares
  expressApp.use(
    express.json({
      limit: "10kb",
    })
  );

  // Define Routes
  // Home page
  expressApp.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  expressApp.get("/stop", (req, res) => {
    for (let i = 0; i < 9999999; i++) {
      clearInterval(i);
    }
    res.status(200).json({
      status: "success",
      message: "process stoped",
    });
  });

  // Register the domain
  expressApp.post("/register", async (req, res) => {
    try {
      console.log(req.body);
      const data = await register({ ...req.body }, app);
      console.log(data);

      if (data.payment_succeed) {
        return res.status(200).json({
          status: "success",
          message: `${req.body.domain} Domain registered successfully`,
        });
      } else {
        return res.status(200).json({
          status: "fail",
          message:
            "error registering domain please make sure you provide correct data",
        });
      }
    } catch (err) {
      console.error(err);
      return res.status(200).json({
        status: "fail",
        message: "error registering your domain",
      });
    }
  });

  // Check the Domain
  expressApp.post("/check", async (req, res) => {
    try {
      const domain = req.body.domain;

      console.log(req.body);

      if (!req.body.domain) {
        throw new Error("Pleas provide a domain name");
        return;
      }

      const url = `https://api.sidn.nl/rest/whois?domain=${domain}`;

      const response = await axios.get(url);

      const data = response.data;

      const isActive = data.details.state.type;

      if (isActive === "ACTIVE") {
        res.status(200).json({
          status: "success",
          is_active: true,
          message: `${domain} is active`,
          domain: domain,
        });
      } else if (isActive === "FREE") {
        res.status(200).json({
          status: "success",
          is_active: false,
          message: `${domain} is free`,
          domain,
        });
      } else if (isActive === "QUARANTINE") {
        res.status(200).json({
          status: "success",
          is_active: true,
          message: `${domain} is in QUARANTINE`,
          domain,
        });
      }
    } catch (err) {
      res.status(200).json({
        status: "fail",
        message: err.message,
      });
    }
  });

  // Create the server
  expressApp.listen(port, () => console.log("Server has started..."));
}

async function main() {
  await pie.initialize(app);
}

const createWindow = async () => {
  // Start the server
  startExpressServer();

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.loadURL(`http://localhost:${port}`);

  // register(
  //   {
  //     domain: "muneeb.nl",
  //     username: "Catch@sentelmedia.nl",
  //     password: "Niekenglenn123!",
  //     name: "Muneeb Akram",
  //     creditcard: "4539516688159281",
  //     cardYear: "2021",
  //     cardMonth: "12",
  //     cardCVC: "456",
  //   },
  //   app
  // );

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

/**
 *
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 *
 */
main();
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
