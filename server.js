import express from "express";
import { createServer } from "http"; // Required for Socket.io compatibility
import { Server } from "socket.io"; // Enables real-time communication for the game
import path from "path";
import { fileURLToPath } from "url"; // Converts import.meta.url to a file path

// Creating a functional __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server setup
const app = express();
const server = createServer(app);
const io = new Server(server); // Connecting Socket.io to the server

// Serving static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Pairing players
const players = {};
const waitingPlayer = null;

io.on("connection", (socket) => {
    console.log(`New player connected:  ${socket.id}`);

    if (!waitingPlayer) {
        waitingPlayer = socket;
        socket.emit("waiting", "Waiting for opponent...");
    } else {
        const player1 = waitingPlayer;
        const player2 = socket;
        const room = player1.id + "#" + player2.id;

        player1.join(room);
        player2.join(room);

        players[player1.id] = {opponent: player2.id, choice: null, room};
        players[player2.id] = {opponent: player1.id, choice: null, room};

        io.to(room).emit("startGame", "Game starting! Make your choice!");
        waitingPlayer = null;
    }

    socket.on("disconnect", () => {
        console.log(`Player disconnected from ${socket.id}`);

        if (players[socket.id]) {
            const opponentId = players[socket.id].opponent;
            if (opponentId && players[opponentId]) {
                io.to(players[socket.id].room).emit("opponentLeft", "Opponent left the game");
                delete players[opponentId];
            }
            delete players[socket.id];
        }
    });
});

