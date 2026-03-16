# IPC

## Usage

### Create an IPC Channel

```js
const myChannel = IPC.CreateChannel("yourChannelName", (data) => {
    // ...
})
```

### Connect to an IPC Channel

```js
IPC.ConnectTo("yourChannelName", (channel) => {
    channel.on("data", ...);
})
```
