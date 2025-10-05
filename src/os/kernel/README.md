# Examples

## Kernel APIs

### IPC

```js
// --- Server Side ---
const server = IPC.listen("MyPipe");
server.broadcast("Welcome");
server.on("connect", (msg) => {
  const clientId = msg.data;
  console.log("[Server] Client <" + clientId + "> connected!");
  server.send("Welcome Client!", clientId);
})
server.on("disconnect", (msg) => {
  console.log("[Server] Client <" + clientId + "> disconnected!");
  server.send("Goodbye Client!", clientId);
})
server.on("data", (msg) => {
  console.log("[Server] got:", msg.data);
})

// --- Client Side ---
const clientChannel = IPC.connect("MyPipe");
clientChannel.on("data", (msg) => {
  console.log("%c[Client] %cMsg from server:", "color:rgb(122 176 255)", "", msg.data);
})
clientChannel.send("Hello Server!");
clientChannel.send("How are you?");
clientChannel.send("Bye Server!");
clientChannel.disconnect();
```
