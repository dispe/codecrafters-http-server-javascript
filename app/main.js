const net = require("net");

const getTimestamp = () => {
  const date = new Date();
  return date.toISOString();
}

const server = net.createServer((socket) => {
  // Closing the server when the client disconnects
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  // Sending a message to the client
  socket.on("data", (data) => {
    console.log("[", getTimestamp(), "] - Data received: ", data.toString());
    socket.write("HTTP/1.1 200 OK\r\n\r\n");
  });
});

server.listen(4221, "localhost");
