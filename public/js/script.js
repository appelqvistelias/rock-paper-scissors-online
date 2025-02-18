document.addEventListener("DOMContentLoaded", () => {
    const socket = io(); // Connect to WebSocket server
    const choices = ["rock", "paper", "scissors"];
    let playerChoice = null;

    function updateUI(message) {
        document.getElementById("result").textContent = message;
    }

    function playGame(choice) {
        playerChoice = choice;
        socket.emit("playerChoice", choice); // Send choice to server
        updateUI("Waiting for opponent...");
    }

    // Event listeners for player choices
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

    // Receive game result from server
    socket.on("gameResult", ({ playerChoice, opponentChoice, result }) => {
        document.getElementById("computer-choice").textContent = `Opponent chose: ${opponentChoice}`;
        updateUI(result);
    });

    // UI setup
    const container = document.querySelector(".container");
    const computerChoiceDisplay = document.createElement("p");
    computerChoiceDisplay.id = "computer-choice";
    const resultDisplay = document.createElement("p");
    resultDisplay.id = "result";

    container.appendChild(computerChoiceDisplay);
    container.appendChild(resultDisplay);
});