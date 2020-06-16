var socket = io();
var canvas = document.getElementsByClassName("whiteboard")[0];
var cursor = document.getElementsByClassName("my-cursor")[0];
var context = canvas.getContext("2d");

//specific to user
let user = "";
$("#user-modal").show();

// variables for paint

var colorArr = [
  "black",
  "red",
  "green",
  "blue",
  "purple",
  "teal",
  "limegreen",
  "aquamarine",
];

let painting = false;
var current = {
  color: colorArr[Math.floor(Math.random() * colorArr.length)],
};

// fill color pallete
(function fillColorPallete() {
  colorArr.forEach((element) => {
    $(".color-pallete").append(
      `<div class="clr-option" style="  background: ${element};    "></div>`
    );
  });
})();

// color selection
document.querySelectorAll(".clr-option").forEach((item) => {
  item.addEventListener("click", function (event) {
    current.color = event.target.style.backgroundColor;
    $(".my-cursor").css("--base-clr", current.color);
    toggleNavbar();
  });
});

function toggleNavbar() {
  var burger = $(".burger");
  var navMenu = $(".nav-menu");
  if (burger.hasClass("menu-open")) {
    // menu already open, close it
    burger.removeClass("menu-open");
    navMenu.css("top", "-100vh");
  } else {
    // meni is closed, open it
    burger.addClass("menu-open");
    navMenu.css("top", "0");
  }
}

// functions

function closeModal() {
  user = $("#user").val().trim();
  if (user && user !== "") {
    localStorage.setItem("user", user);
    // todo: and already user scenario - use api
    socket.emit("broadcast", {
      user: user,
      message: "new connection",
      type: "NEW CONNECTION",
    });
  } else {
    $(".no-user-error").show();
  }
}

function eraseAll() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  toggleNavbar();
}

function logout() {
  socket.emit("broadcast", {
    user: user,
    message: "user disconnected",
    type: "USER DISCONNECTED",
  });
  toggleNavbar();
  // cleaning up storage
  localStorage.removeItem("user");

  // show user modal
  $("#user-modal").show();
  setTimeout(function () {
    $("#user-modal").css("top", "0");
  }, 1000);

  // cleaning up convo
  $(".conversation").empty();
}

function mouseDown(e) {
  painting = true;
  current.x = e.clientX || e.touches[0].clientX;
  current.y = e.clientY || e.touches[0].clientY;
}

function mouseUp(e) {
  if (!painting) {
    return;
  }
  painting = false;
  paint(
    current.x,
    current.y,
    e.clientX || e.touches[0].clientX,
    e.clientY || e.touches[0].clientY,
    current.color,
    true
  );
}

function mouseMove(e) {
  var w = canvas.width;
  var h = canvas.height;
  cursor.style.left = (e.clientX / w) * 100 + "%";
  cursor.style.top = (e.clientY / h) * 100 + "%";

  socket.emit("mark", {
    x1: e.clientX / w || e.touches[0].clientX / w,
    y1: e.clientY / h || e.touches[0].clientY / h,
    color: current.color,
    user: user,
  });

  if (!painting) {
    return;
  }
  paint(
    current.x,
    current.y,
    e.clientX || e.touches[0].clientX,
    e.clientY || e.touches[0].clientY,
    current.color,
    true
  );
  current.x = e.clientX || e.touches[0].clientX;
  current.y = e.clientY || e.touches[0].clientY;
}

function paint(x0, y0, x1, y1, color, emit) {
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
  context.closePath();

  if (!emit) {
    return;
  }
  var w = canvas.width;
  var h = canvas.height;

  socket.emit("paint", {
    x0: x0 / w,
    y0: y0 / h,
    x1: x1 / w,
    y1: y1 / h,
    color: color,
  });
}

function mark(x, y, color, user) {
  var node = document.getElementById(user);
  node.style.backgroundColor = color;
  node.style.borderColor = color;
  node.style.left = x + "%";
  node.style.top = y + "%";
  node.style.zIndex = 2;
}

// limit the number of events per second
function throttle(callback, delay) {
  var previousCall = new Date().getTime();
  return function () {
    var time = new Date().getTime();

    if (time - previousCall >= delay) {
      previousCall = time;
      callback.apply(null, arguments);
    }
  };
}

// EventListeners

// for desktop
canvas.addEventListener("mousedown", mouseDown);
canvas.addEventListener("mouseup", mouseUp);
canvas.addEventListener("mouseout", mouseUp);
canvas.addEventListener("mousemove", throttle(mouseMove, 10));
// for touch screen devices
canvas.addEventListener("touchstart", mouseDown);
canvas.addEventListener("touchend", mouseUp);
canvas.addEventListener("touchcancel", mouseUp);
canvas.addEventListener("touchmove", throttle(mouseMove, 10));

// socket EventListeners

socket.on("paint", (data) => {
  var w = canvas.width;
  var h = canvas.height;
  paint(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
});

socket.on("mark", (data) => {
  var w = canvas.width;
  var h = canvas.height;
  mark(data.x1 * 100, data.y1 * 100, data.color, data.user);
});

// user login sockets
socket.on("username exists", () => {
  $(".user-taken-error").show();
});
socket.on("okay login", (data) => {
  cursor.style.setProperty("--base-clr", current.color);

  data.forEach((element) => {
    $("body").append(`<div id="${element}" class="cursor"></div>`);
  });

  // removing from view port by moving it up - out of the screen
  $("#user-modal").css("top", "-100vh");
  setTimeout(function () {
    $("#user-modal").hide();
  }, 1000);
});
socket.on("new connection", (data) => {
  $("body").append(`<div id="${data.user}" class="cursor"></div>`);
});
socket.on("user disconnected", (data) => {
  $(`#${data.user}`).remove();
});

// for window resize

// fixing height for mobile devices
// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener("resize", onResize, false);
// make the canvas fill its parent
function onResize() {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

onResize();
