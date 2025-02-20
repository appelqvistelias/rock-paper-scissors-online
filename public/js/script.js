document.addEventListener("DOMContentLoaded", () => {
    // UI setup
    const playerChoiceFeedback = document.querySelector(".player-choice");
    const opponentChoiceFeedback = document.querySelector(".opponent-choice");
    const resultFeedback = document.querySelector(".result");
    const gameStatusFeedback = document.querySelector(".game-status");

    const socket = io("https://your-app-name.onrender.com"); // Connect to WebSocket server
    let playerChoice = null;

    function updateUI(element, message) {
        element.textContent = message;
    }

    function playGame(choice) {
        playerChoice = choice;
        socket.emit("playerChoice", choice); // Send choice to server
        updateUI(gameStatusFeedback, "Waiting for opponent...");
    }
    
    function disableButtons(disable) {
        document.querySelectorAll('.buttons button').forEach(button => {
        button.disabled = disable;
        });
    }

    function enableButtons(enable) {
        document.querySelectorAll('.buttons button').forEach(button => {
        button.disabled = enable;
        });
    }

    socket.on("waiting", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(false); // Keep buttons enabled while waiting for opponent
    });
    
    socket.on("startGame", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(false);
    });
    
    socket.on("waitingForChoice", (message) => {
        updateUI(gameStatusFeedback, message);
        disableButtons(true); // Disable buttons while waiting for opponent's choice
    });

    socket.on("")

    // Alert when opponent leaves the game.
    socket.on("opponentLeft", (message) => {
        updateUI(gameStatusFeedback, message);
    });

    // Event listeners for player choices
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

    // Receive game result from server
    socket.on("gameResult", (data) => {
        const playerData = socket.id === data.player1.id ? data.player1 : data.player2;

        document.querySelector(".opponent-choice").textContent = `Opponent chose: ${playerData.opponentChoice}`;
        updateUI(opponentChoiceFeedback, playerData.result);
    });

    socket.on("roundComplete", (message) => {
        setTimeout(() => {
            updateUI(resultFeedback, message);
            enableButtons();
        }, 5000); // Wait 5 seconds before allowing new choices
    });
});