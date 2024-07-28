import { IncomingMessage, ServerResponse, createServer } from "http";
import WebSocket, { RawData, WebSocketServer } from "ws";

const rooms: {
  [key: string]: WebSocket[];
} = {};

const port: number = 8080;
const server = createServer(
  (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage> & { req: IncomingMessage },
  ): void => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ARNNVV\n");
  },
);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket): void => {
  ws.on("error", (): never => {
    throw new Error("Unexpected error");
  });

  ws.on("message", (data: RawData): void => {
    const message = JSON.parse(data.toString());
    const { type, roomId, state } = message;
    switch (type) {
      case "join":
        if (!rooms[roomId]) {
          rooms[roomId] = [];
        }
        if (rooms[roomId].length === 0 || rooms[roomId].length === 1)
          rooms[roomId].push(ws);
        break;
      case "move":
        rooms[roomId].forEach((client): void => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "move", state }));
          }
        });
        break;
    }
  });
  ws.on("close", (): void => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((client): boolean => client !== ws);
    }
  });
});

server.listen(port, (): void => {
  console.log(`Server running at http://localhost:${port}/`);
});
