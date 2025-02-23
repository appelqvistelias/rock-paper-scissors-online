import express from "express";
import { createServer } from "http"; // Required for Socket.io compatibility
import { Server } from "socket.io"; // Enables real-time communication for the game
import path from "path";
import { fileURLToPath } from "url"; // Converts import.meta.url to a file path
import validator from 'validator';

// Creating a functional __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server setup
const app = express();
const server = createServer(app);
const io = new Server(server); // Connecting Socket.io to the server

// Serving static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Functions
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

// Pairing players and game logic
const players = {};
let waitingPlayer = null;

io.on("connection", (socket) => {
    console.log(`New player connected: ${socket.id}`);

    socket.on("setUsername", (username) => {
        const sanitizedUsername = validator.escape(username.trim());
        if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
            socket.emit("error", "Invalid username! Only alphanumeric characters and underscores are allowed.");
            return;
        }
        
        socket.username = sanitizedUsername;

        if (!waitingPlayer) {
            waitingPlayer = socket;
            socket.emit("waiting", "Waiting for opponent...");
        } else {
            const player1 = waitingPlayer;
            const player2 = socket;
            const room = player1.id + "#" + player2.id;

            try {
                player1.join(room);
                player2.join(room);
            } catch (error) {
                socket.emit("gameError", "Failed to join the game. Please try again.");
                return;
            }

            players[player1.id] = { opponent: player2.id, choice: null, room, username: player1.username };
            players[player2.id] = { opponent: player1.id, choice: null, room, username: player2.username };

            io.to(room).emit("startGame", "Game starting! Make your choice!");

            io.to(player1.id).emit("opponentUsername", player2.username);
            io.to(player2.id).emit("opponentUsername", player1.username);

            waitingPlayer = null;
        }
    });

    socket.on("playerChoice", (choice) => {
        if (!["rock", "paper", "scissors"].includes(choice)) {
            socket.emit("error", "Invalid choice. Please choose rock, paper, or scissors.");
            return;
        }
        
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
                io.to(opponentId).emit("opponentDisconnected", "Opponent left, reload to play again");
            }
    
            delete players[socket.id];
        }
    });

    // Error handling
    socket.on("error", (error) => {
        console.error(`Socket error: ${error.message}`);
        socket.emit("gameError", "An unexpected error occurred. Please try again.");
    });

});

const PORT = process.env.PORT || 3000; // Use Render's dynamic port or fallback to 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});