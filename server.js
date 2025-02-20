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
let waitingPlayer = null;

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

    socket.on("playerChoice", (choice) => {
        if (players[socket.id]) {
            players[socket.id].choice = choice;
            checkGameResult(socket);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Player disconnected: ${socket.id}`);

        if (waitingPlayer === socket) {
            waitingPlayer = null;
            return;
        }

        if (players[socket.id]) {
            const opponentId = players[socket.id].opponent;
            const room = players[socket.id].room;

            if (opponentId && players[opponentId]) {
                // Notify opponent and give them 30 seconds to reconnect
                io.to(opponentId).emit("opponentDisconnected", "Opponent disconnected. Waiting for reconnection...");

                // Store room info for potential reconnection
                const roomInfo = {
                    players: [socket.id, opponentId],
                    room: room,
                    disconnectTime: Date.now()  
                };

                // Keep room alive for 30 seconds
                setTimeout(() => {
                    // If opponent hasn't reconnected, clean up
                    if (players[opponentId]) {
                        io.to(opponentId).emit("opponentLeft", "Opponent left the game");
                        delete players[opponentId];
                    }
                }, 30000);
            }

            delete players[socket.id];
        }
    });
});

function checkGameResult(socket) {
    const player = players[socket.id];
    if (!player) return;

    const opponent = players[player.opponent];
    if (!opponent) return;

    if (player.choice && opponent.choice) {
        io.to(player.room).emit("gameResult", {
            player1: {
                id: socket.id,
                choice: player.choice,
                opponentChoice: opponent.choice,
                result: determineWinner(player.choice, opponent.choice)
            },
            player2: {
                id: player.opponent,
                choice: opponent.choice,
                opponentChoice: player.choice,
                result: determineWinner(opponent.choice, player.choice)
            }
        });

        player.choice = null;
        opponent.choice = null;

        io.to(player.room).emit("roundComplete", "Round complete! Choose again for the next round.");
    } else {
        socket.emit("waitingForChoice", "Waiting for opponent to choose...");
    }
}

function determineWinner(playerChoice, opponentChoice) {
   if (playerChoice === opponentChoice) {
        return "Draw!";
   }

   if (
        (playerChoice === "rock" && opponentChoice === "scissors") ||
        (playerChoice === "paper" && opponentChoice === "rock") ||
        (playerChoice === "scissors" && opponentChoice === "paper")
    ) {
        return "You won!"; 
    } else {
        return "You lost!";
    }
}

const PORT = process.env.PORT || 3000; // Use Render's dynamic port or fallback to 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});