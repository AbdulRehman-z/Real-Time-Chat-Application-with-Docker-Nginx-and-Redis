import ws from "websocket";
import { createClient } from "redis";
import http from "http";
const APPID = process.env.APPID;
const PORT = process.env.PORT;
const WebSocketServer = ws.server;

const connections: ws.connection[] = [];

console.log(`Server ${APPID} is starting...`);
console.log(`Server ${APPID} is connecting to redis...`);
console.log(`Server ${APPID} is listening on port ${PORT}...`);

const subscriber = createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

const publisher = createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

subscriber.on("subscribe", function (channel, count) {
  console.log(`Server ${APPID} subscribed successfully to livechat`);
  publisher.publish("livechat", "a message");
});

subscriber.on("message", function (channel, message) {
  try {
    //when we receive a message I want t
    console.log(
      `Server ${APPID} received message in channel ${channel} msg: ${message}`
    );

    connections.forEach((c) => c.send(APPID + ":" + message));
  } catch (ex) {
    console.log("ERR::" + ex);
  }
});

subscriber.subscribe("livechat", function (err, count) {
  if (err) {
    console.log(err);
  }
  console.log(`Subscribed to ${count} channels`);
});

//create a raw http server (this will help us create the TCP which will then pass to the websocket to do the job)
const httpserver = http.createServer();

//pass the httpserver object to the WebSocketServer library to do all the job, this class will override the req/res
const websocket = new WebSocketServer({
  httpServer: httpserver,
});

httpserver.listen(8080, () =>
  console.log("My server is listening on port " + 8080 + "...")
);

//when a legit websocket request comes listen to it and get the connection
websocket.on("request", (request) => {
  const con = request.accept(null, request.origin);
  con.on("message", (message) => {
    //publish the message to redis
    console.log(`${APPID} Received message ${message.toString()}`);
    publisher.publish("livechat", message.toString());
  });

  setTimeout(() => con.send(`Connected successfully to server ${APPID}`), 5000);
  connections.push(con);
});
