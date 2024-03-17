const net = require("net");
const path = require('path');

// Utility function to get the timestamp
const getTimestamp = () => {
  const date = new Date();
  return date.toISOString();
}

// Parse the request
const parseRequest = (data) => {
  const request = data.toString();
  const lines = request.split("\r\n");
  const firstLine = lines[0];
  const [method, path, version] = firstLine.split(" ");
  const headers = lines.slice(1, lines.length - 2);
  const body = lines[lines.length - 1];
  
  return { method, path, version, headers, body };
}

const server = net.createServer((socket) => {
  // Closing the server when the client disconnects
  socket.on("close", () => {
    socket.end();
    server.close();
  });

  // Sending a message to the client
  socket.on("data", (data) => {
    console.log("[", getTimestamp(), "] - Data received: <<Start>>");
    console.log(data.toString());
    console.log("[", getTimestamp(), "] - Data received: <<End>>");

    // Parse the request and create an object
    const request = parseRequest(data);
    console.log("[", getTimestamp(), "] - Request object:", request);

    if (request.path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

  });
});

server.listen(4221, "localhost");
