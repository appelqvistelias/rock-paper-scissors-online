document.addEventListener("DOMContentLoaded", () => {
    const socket = io(); // Connect to WebSocket server
    let playerChoice = null;

    function updateUI(message) {
        document.getElementById("result").textContent = message;
    }

    function playGame(choice) {
        playerChoice = choice;
        socket.emit("playerChoice", choice); // Send choice to server
        updateUI("Waiting for opponent...");
    }
    
    function disableButtons(disable) {
        document.querySelectorAll('.buttons button').forEach(button => {
        button.disabled = disable;
        });
    }

    socket.on("waiting", (message) => {
        updateUI(message);
        disableButtons(false); // Keep buttons enabled while waiting for opponent
    });
    
    socket.on("startGame", (message) => {
        updateUI(message);
        disableButtons(false);
    });
    
    socket.on("waitingForChoice", (message) => {
        updateUI(message);
        disableButtons(true); // Disable buttons while waiting for opponent's choice
    });

    // Alert when opponent leaves the game.
    socket.on("opponentLeft", (message) => {
        updateUI(message);
        alert("Your opponent has left the game.");
    });

    // Event listeners for player choices
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

    // Receive game result from server
    socket.on("gameResult", (data) => {
        const playerData = socket.id === data.player1.id ? data.player1 : data.player2;

        document.getElementById("computer-choice").textContent = `Opponent chose: ${playerData.opponentChoice}`;
        updateUI(playerData.result);
    });

    socket.on("roundComplete", (message) => {
        setTimeout(() => {
            updateUI(message);
            enableButtons();
        }, 5000); // Wait 5 seconds before allowing new choices
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