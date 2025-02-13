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
