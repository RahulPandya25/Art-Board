var socket = io();
var canvas = document.getElementsByClassName("whiteboard")[0];
var cursor = document.getElementsByClassName("cursor")[0];
var context = canvas.getContext("2d");

// variables for paint

let painting = false;
var current = {
  color: "black",
};

// functions

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

// for window resize

window.addEventListener("resize", onResize, false);
// make the canvas fill its parent
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

onResize();
