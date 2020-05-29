const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;
const path = require("path");
const PUBLIC_DIR_PATH = "public/";
const userService = require("./services/UserService");

app.use(express.static(__dirname + "/public"));

function onConnection(socket) {
  console.log("new user connected");
  socket.on("paint", (data) => socket.broadcast.emit("paint", data));
  socket.on("mark", (data) => socket.broadcast.emit("mark", data));
}

io.on("connection", onConnection);

http.listen(port, () => console.log("listening on port " + port));
