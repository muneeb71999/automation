const start = document.getElementById("start");
const stop = document.getElementById("stop");
const save = document.getElementById("save");
const form = document.getElementById("form");
let inputs = document.querySelectorAll("input");
let selects = document.querySelectorAll("select");
const logo = document.querySelector(".brand-logo");
const port = 6535;

// Event Listeners
start.addEventListener("click", function () {
  logo.innerHTML = "DropCatcher";
  logo.innerHTML = "Searching for domains";

  const inputsWithIds = {};

  inputs.forEach((el) => {
    if (el.hasAttribute("id")) {
      inputsWithIds[el.getAttribute("id")] = el.value;
    }
  });

  selects.forEach((el) => {
    if (el.hasAttribute("id")) {
      inputsWithIds[el.getAttribute("id")] = el.value;
    }
  });

  const data = inputsWithIds;

  startChecker(data.domain, data);
});

save.addEventListener("click", function () {
  inputs.forEach((el) => {
    if (el.value == "") {
      M.toast({
        html: `Please fill in the ${el.getAttribute("id")} field`,
        classes: "red darken-1",
      });
    } else {
      localStorage.setItem(el.getAttribute("id"), el.value);
      M.toast({
        html: `${el.getAttribute("id")} is saved locally`,
        classes: "green darken-1",
      });
    }
  });
});

stop.addEventListener("click", async function () {
  logo.innerHTML = "DropCatcher";
  M.toast({ html: "Stoping the programe", classes: "blue darken-1" });
  for (let i = 0; i < 9999999; i++) {
    clearInterval(i);
  }

  await axios({
    url: `http://localhost:${port}/stop`,
    method: "GET",
  });

  M.toast({ html: "Program Stopped", classes: "green darken-1" });
});

async function startChecker(domainName, registerData) {
  M.toast({
    html: "Program Started Checking for domain....",
    classes: "green darken-1",
  });

  const intervale = setInterval(async () => {
    try {
      const res = await axios({
        method: "post",
        url: `http://localhost:${port}/check`,
        data: {
          domain: domainName,
        },
      });

      const data = res.data;

      if (!data.is_active && data.status == "success") {
        // Domain is Free
        M.toast({ html: data.message, classes: "green darken-1" });

        // Clear  the interval
        clearInterval(intervale);
        M.toast({
          html: "Stoping the program and registering the domain",
          classes: "red darken-1",
        });

        // Stoping the interval to go
        for (let i = 0; i < 9999999; i++) {
          clearInterval(i);
        }

        await axios({
          url: `http://localhost:${port}/stop`,
          method: "GET",
        });

        // Regsiter the domain
        register(registerData);
      } else {
        // Domain is active
        M.toast({ html: data.message, classes: "red darken-1" });

        // Rechking again
        M.toast({ html: "Recheking for domain in a few seconds" });
      }
    } catch (error) {
      console.log(error);
    }
  }, randomNumber(40, 80));
}

async function register(data) {
  try {
    logo.innerHTML = "Registering Domain....";

    const res = await axios({
      method: "POST",
      url: `http://localhost:${port}/register`,
      data: data,
    });

    const resData = res.data;
    console.log(resData);

    if (resData.status === "success") {
      logo.innerHTML = "Domain Registered";
      M.toast({ html: resData.message });
    }
    if (resData.status === "fail") {
      logo.innerHTML = "Error Registering Domain";
      M.toast({ html: resData.message });
      stop.click();
      setTimeout(() => startChecker(), 3000);
    }
  } catch (err) {
    logo.innerHTML = "Error registering domain please try again";
    console.error(err);
  }
}

function randomNumber(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

document.addEventListener("DOMContentLoaded", function () {
  inputs.forEach((el) => {
    if (localStorage.getItem(el.getAttribute("id"))) {
      el.value = localStorage.getItem(el.getAttribute("id"));
    }
  });
});
