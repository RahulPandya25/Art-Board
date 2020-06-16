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
  socket.on("broadcast", broadcast);
  function broadcast(data) {
    if (data.type === "NEW CONNECTION") {
      if (!userService.getUserList().includes(data.user)) {
        userService.addUser(data.user);
        socket.broadcast.emit("new connection", data);
        socket.emit("okay login", userService.getUserList());
      } else socket.emit("username exists");
    } else if (data.type === "USER DISCONNECTED") {
      //  remove user from user list
      userService.removeUser(data.user);
      // broadcast others
      socket.broadcast.emit("user disconnected", data);
    }
  }
}

io.on("connection", onConnection);

http.listen(port, () => console.log("listening on port " + port));
