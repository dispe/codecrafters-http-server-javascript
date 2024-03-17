const net = require("net");
const fs = require('fs');

// Utility function to get the timestamp
const getTimestamp = () => {
  const date = new Date();
  return date.toISOString();
}

// Parse the HTTP Message of type request according to the HTTP protocol:
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses
const parseRequest = (data) => {
  const http_request = data.toString();
  const lines = http_request.split("\r\n");

  // Split the request as per the HTTP protocol
  const start_line = lines[0];
  let http_headers = lines.slice(1, lines.length - 3);
  http_headers = http_headers.map(header => {
    const [name, value] = header.split(": ");
    return { name, value };
  });

  // const blank_line = lines[lines.length - 2];  // Not used
  const body = lines[lines.length - 1];
  
  // Split the start line into its components
  let [http_method, request_target, http_version] = start_line.split(" ");

  // TBD: Handle the case when request_target is "*"
  // TBD: Handle all the cases: https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_requests
  const [absolute_path, query_string] = request_target.split("?");
  const resource = absolute_path.split("/")[1];
  // treat the rest of the path as the resource data
  const resource_data = absolute_path.substring(1 + resource.length + 1);

  return { 
    http_method: http_method, 
    request_target: request_target,
    absolute_path: absolute_path,
    query_string: query_string,
    resource: resource,
    resource_data: resource_data,
    http_version: http_version, 
    http_headers: http_headers, 
    body 
  };
}

const return404 = (socket) => {
  socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
  socket.end();
}

const server = net.createServer((socket) => {
  // Closing the server when the client disconnects
  socket.on("close", () => {
    socket.end();
    // server.close();
  });

  // Sending a message to the client
  socket.on("data", (data) => {
    console.log("[", getTimestamp(), "] - Data received: <<Start>>");
    console.log(data.toString());
    console.log("[", getTimestamp(), "] - Data received: <<End>>");

    // Parse the request and create an object
    const request = parseRequest(data);
    console.log("[", getTimestamp(), "] - Request object:", request);

    // TBD: Split into functions
    if (request.resource === "") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (request.resource === "echo") {
      const response_first_line = "HTTP/1.1 200 OK";
      let response_headers = "Content-Type: text/plain";
      response_headers += "\r\n" + "Content-Length: " + request.resource_data.length;
      console.log("[", getTimestamp(), "] - Response headers:", response_headers);
      socket.write(response_first_line + "\r\n" + response_headers + "\r\n\r\n" + request.resource_data);
    } else if (request.resource === "user-agent") {
      const response_first_line = "HTTP/1.1 200 OK";
      let response_headers = "Content-Type: text/plain";

      const user_agent = request.http_headers.filter(header => header.name === 'User-Agent')[0].value;
      const response_body = user_agent;
      
      response_headers += "\r\n" + "Content-Length: " + response_body.length;

      console.log("[", getTimestamp(), "] - Response headers:", response_headers);
      console.log("[", getTimestamp(), "] - Response body:", response_body);

      socket.write(response_first_line + "\r\n" + response_headers + "\r\n\r\n" + response_body);
    } else if (request.http_method === 'GET' && request.resource === "files") {

      // get directory from the first argument of bash npm server command
      const directory = process.argv[3];
      const file_path = directory + "/" + request.resource_data;
      console.log("[", getTimestamp(), "] - File path: ", file_path);
      
      // check if the file exists
      if (!fs.existsSync(file_path)) {
        return404(socket);
        return;
      }

      const response_first_line = "HTTP/1.1 200 OK";
      let response_headers = "Content-Type: application/octet-stream";

      const user_agent = request.http_headers.filter(header => header.name === 'User-Agent')[0].value;
      const response_body = fs.readFileSync(file_path);
      
      response_headers += "\r\n" + "Content-Length: " + response_body.length;

      console.log("[", getTimestamp(), "] - Response headers:", response_headers);
      console.log("[", getTimestamp(), "] - Response body:", response_body);

      socket.write(response_first_line + "\r\n" + response_headers + "\r\n\r\n" + response_body);
    } else if (request.http_method === 'POST' && request.resource === "files") {

      // get directory from the first argument of bash npm server command
      const directory = process.argv[3];
      const file_path = directory + "/" + request.resource_data;
      console.log("[", getTimestamp(), "] - File path: ", file_path);
      
      // check if the directory exists
      if (!fs.existsSync(directory)) {
        return404(socket);
        return;
      }

      // write the file
      fs.writeFileSync(file_path, request.body);

      const response_first_line = "HTTP/1.1 201 OK";
      let response_headers = "";
      const response_body = "";

      socket.write(response_first_line + "\r\n" + response_headers + "\r\n\r\n" + response_body);

      socket.end();
    } else {
      return404(socket);
    }

  });
});

server.listen(4221, "localhost");
