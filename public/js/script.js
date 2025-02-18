document.addEventListener("DOMContentLoaded", () => {
    const choices = ["rock", "paper", "scissors"];

    function getWinner(playerChoice, computerChoice) {
        if (playerChoice === computerChoice) {
            return "It's a tie!";
        }
        if (
            (playerChoice === "rock" && computerChoice === "scissors") ||
            (playerChoice === "paper" && computerChoice === "rock") ||
            (playerChoice === "scissors" && computerChoice === "paper")
        ) {
            return "You win!";
        }
        return "Computer wins!";
    }

    function playGame(playerChoice) {
        const computerChoice = choices[Math.floor(Math.random() * choices.length)];
        document.getElementById("computer-choice").textContent = `Computer chose: ${computerChoice}`;
        document.getElementById("result").textContent = getWinner(playerChoice, computerChoice);
    }

    // Event listeners using IDs
    document.getElementById("rock").addEventListener("click", () => playGame("rock"));
    document.getElementById("paper").addEventListener("click", () => playGame("paper"));
    document.getElementById("scissors").addEventListener("click", () => playGame("scissors"));

    // Display results
    const container = document.querySelector(".container");
    const computerChoiceDisplay = document.createElement("p");
    computerChoiceDisplay.id = "computer-choice";
    const resultDisplay = document.createElement("p");
    resultDisplay.id = "result";
    
    container.appendChild(computerChoiceDisplay);
    container.appendChild(resultDisplay);
});