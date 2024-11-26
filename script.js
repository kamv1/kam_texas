const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let playerHand = [];
let dealerHand = [];
let communityCards = [];
let phase = 0;
let playerName = 'Player'; // Varsayılan isim

// Poker hand rankings
const handRanks = {
    "High Card": 1,
    "Pair": 2,
    "Two Pair": 3,
    "Three of a Kind": 4,
    "Straight": 5,
    "Flush": 6,
    "Full House": 7,
    "Four of a Kind": 8,
    "Straight Flush": 9,
    "Royal Flush": 10
};

// Create and shuffle deck
function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push(`${rank}${suit}`);
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

// Oyuncu adı alındıktan sonra oyunu başlatmak için
function startGameSetup() {
    const input = document.getElementById('username-input').value.trim();
    if (input) playerName = input; // Oyuncu adı alındı
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('buttons').style.display = 'block';
    document.getElementById('player-name').textContent = `${playerName}'s Hand`; // Oyuncu adı güncellenir
    startGame();
}

// Start a new game
function startGame() {
    deck = createDeck();
    playerHand = deck.splice(0, 2);
    dealerHand = deck.splice(0, 2);
    communityCards = [];
    phase = 0;
    updateUI();
}

// Advance to the next phase
function nextPhase() {
    if (phase === 0) {
        // Flop (3 cards)
        communityCards.push(...deck.splice(0, 3));
    } else if (phase === 1) {
        // Turn (1 card)
        communityCards.push(...deck.splice(0, 1));
    } else if (phase === 2) {
        // River (1 card)
        communityCards.push(...deck.splice(0, 1));
    } else {
        revealWinner();
        return;
    }
    phase++;
    updateUI();
}

// Evaluate hand
function evaluateHand(hand, community) {
    const allCards = [...hand, ...community];
    const rankCount = {};
    const suitCount = {};

    // Count card ranks and suits
    allCards.forEach(card => {
        const rank = card.slice(0, -1);
        const suit = card.slice(-1);
        rankCount[rank] = (rankCount[rank] || 0) + 1;
        suitCount[suit] = (suitCount[suit] || 0) + 1;
    });

    const rankValues = Object.entries(rankCount)
        .sort((a, b) => b[1] - a[1] || ranks.indexOf(b[0]) - ranks.indexOf(a[0])); // Sort by count then rank
    const flush = Object.values(suitCount).some(count => count >= 5);
    const sortedRanks = Object.keys(rankCount).sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b));
    const straight = sortedRanks.some((_, i, arr) =>
        i <= arr.length - 5 &&
        ranks.indexOf(arr[i + 4]) - ranks.indexOf(arr[i]) === 4
    );

    let handType = "High Card";
    let kicker = [];

    // Determine hand ranking
    if (flush && straight) {
        handType = "Straight Flush";
        kicker = [sortedRanks.slice(-1)];
    } else if (rankValues[0][1] === 4) {
        handType = "Four of a Kind";
        kicker = [rankValues[0][0], rankValues[1][0]];
    } else if (rankValues[0][1] === 3 && rankValues[1][1] === 2) {
        handType = "Full House";
        kicker = [rankValues[0][0], rankValues[1][0]];
    } else if (flush) {
        handType = "Flush";
        kicker = sortedRanks.slice(-5).reverse();
    } else if (straight) {
        handType = "Straight";
        kicker = [sortedRanks.slice(-1)];
    } else if (rankValues[0][1] === 3) {
        handType = "Three of a Kind";
        kicker = [rankValues[0][0], ...sortedRanks.slice(-2)];
    } else if (rankValues[0][1] === 2 && rankValues[1][1] === 2) {
        handType = "Two Pair";
        kicker = [rankValues[0][0], rankValues[1][0], rankValues[2][0]];
    } else if (rankValues[0][1] === 2) {
        handType = "Pair";
        kicker = [rankValues[0][0], ...sortedRanks.slice(-3)];
    } else {
        handType = "High Card";
        kicker = sortedRanks.slice(-5).reverse();
    }

    return { handType, kicker };
}

// Reveal winner
function revealWinner() {
    const playerBestHand = evaluateHand(playerHand, communityCards);
    const dealerBestHand = evaluateHand(dealerHand, communityCards);

    const playerScore = handRanks[playerBestHand.handType];
    const dealerScore = handRanks[dealerBestHand.handType];

    let resultMessage = `${playerName}: ${playerBestHand.handType} vs KAM: ${dealerBestHand.handType}. `;

    if (playerScore > dealerScore) {
        resultMessage += `${playerName} wins!`;
    } else if (dealerScore > playerScore) {
        resultMessage += "KAM wins!";
    } else {
        // Tie-breaking by kicker
        for (let i = 0; i < playerBestHand.kicker.length; i++) {
            const playerKickerRank = ranks.indexOf(playerBestHand.kicker[i]);
            const dealerKickerRank = ranks.indexOf(dealerBestHand.kicker[i]);

            if (playerKickerRank > dealerKickerRank) {
                resultMessage += `${playerName} wins by kicker!`;
                break;
            } else if (dealerKickerRank > playerKickerRank) {
                resultMessage += "KAM wins by kicker!";
                break;
            }
        }

        if (!resultMessage.includes("wins")) {
            resultMessage += "It's a tie!";
        }
    }

    // Show result in the result panel
    document.getElementById('result').textContent = resultMessage;

    // Reveal dealer's cards
    updateUI(true);
}

// Update the UI
function updateUI(showDealerHand = false) {
    const getCardHTML = (card) => {
        const suit = card.slice(-1); // Kartın sembolü
        const rank = card.slice(0, -1); // Kartın rank'ı
        const colorClass = suit === '♥' || suit === '♦' ? 'red' : ''; // Kupa ve Karo için kırmızı

        // Kart HTML'si
        return `
            <div class="card front ${colorClass}">
                <div class="top-left">${rank}${suit}</div>
                <div class="bottom-right">${rank}${suit}</div>
            </div>
        `;
    };

    document.getElementById('player-cards').innerHTML = playerHand.map(getCardHTML).join('');

    if (showDealerHand) {
        document.getElementById('dealer-cards').innerHTML = dealerHand.map(getCardHTML).join('');
    } else {
        document.getElementById('dealer-cards').innerHTML = `
            <div class="card back"></div>
            <div class="card back"></div>`;
    }

    document.getElementById('community').innerHTML = communityCards.map(getCardHTML).join('');
    if (!showDealerHand) {
        document.getElementById('result').textContent = '';
    }
}

// Reset the game
function resetGame() {
    playerHand = [];
    dealerHand = [];
    communityCards = [];
    phase = 0;
    updateUI();
}

// Copy to clipboard function
function copyToClipboard(address) {
    navigator.clipboard.writeText(address).then(() => {
        const copyMessage = document.getElementById('copy-message');
        copyMessage.style.display = 'block';
        setTimeout(() => {
            copyMessage.style.display = 'none';
        }, 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Toggle donate options visibility
function toggleDonateOptions() {
    const cryptoLogos = document.getElementById('crypto-logos');
    const button = document.getElementById('show-donate');
    if (cryptoLogos.style.display === 'none') {
        cryptoLogos.style.display = 'flex';
        button.textContent = 'Hide Donate Options';
    } else {
        cryptoLogos.style.display = 'none';
        button.textContent = 'Show Donate Options';
    }
}
