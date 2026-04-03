const player = document.getElementById('player');
const arena = document.getElementById('arena');
const gameContainer = document.getElementById('game-container');
const spawnMenu = document.getElementById('spawn-menu');
const spawnForm = document.getElementById('spawn-form');
const usernameInput = document.getElementById('username');
const usernameDisplay = document.getElementById('username-display');
const npcsContainer = document.getElementById('npcs');
const scoreDisplay = document.getElementById('score-display');
const npcChartCanvas = document.getElementById('npcChart');

let playerX = arena.offsetWidth / 2;
let playerY = arena.offsetHeight / 2;
let velocityX = 0;
let velocityY = 0;
const acceleration = 0.2;
const maxSpeed = 5;
const friction = 0.05;
const sqrt2 = Math.sqrt(2);
let score = 0;
let gameRunning = false;

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let selectedIcon = 'rock.png'; // Default icon

let rockCount = 0;
let paperCount = 0;
let scissorsCount = 0;

// Initialize Chart.js
const npcChart = new Chart(npcChartCanvas, {
    type: 'pie',
    data: {
        labels: ['Rocks', 'Papers', 'Scissors'],
        datasets: [{
            data: [rockCount, paperCount, scissorsCount],
            backgroundColor: ['#595957', '#FFCE56', '#FF893B']
        }]
    },
    options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                display: false
            },
        }
    }
});

// Size of each grid cell (spatial partitioning, nothing to do with visuals; 
// used to optimize collision checking to put npcs in some "buckets" (each
// shaped as an gridSize x gridSize square) and then only checking collisions
// within the same (or adjacent) buckets)
const gridSize = 100;
let grid = {};

// performance
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
    const now = performance.now();
    frameCount++;
    const delta = now - lastFrameTime;
    if (delta >= 1000) {
        fps = (frameCount / delta) * 1000;
        frameCount = 0;
        lastFrameTime = now;
        document.getElementById('fpsDisplay').textContent = `FPS: ${Math.round(fps)}`;
    }
}

function addToGrid(npc) {
    const x = Math.floor(parseFloat(npc.style.left) / gridSize);
    const y = Math.floor(parseFloat(npc.style.top) / gridSize);
    const key = `${x},${y}`;
    if (!grid[key]) {
        grid[key] = [];
    }
    grid[key].push(npc);
}

function clearGrid() {
    grid = {};
}

function createNPCs(num) {
    const icons = ['rock.png', 'paper.png', 'scissors.png'];
    for (let i = 0; i < num; i++) {
        const npc = document.createElement('img');
        const icon = icons[Math.floor(Math.random() * icons.length)];
        npc.src = `img/${icon}`;
        npc.classList.add('npc');
        npc.style.left = `${Math.random() * (arena.offsetWidth - 50)}px`;
        npc.style.top = `${Math.random() * (arena.offsetHeight - 50)}px`;
        npc.velocityX = (Math.random() - 0.5) * 4; // Random velocity between -2 and 2
        npc.velocityY = (Math.random() - 0.5) * 4; // Random velocity between -2 and 2

        // Update counters
        if (icon === 'rock.png') rockCount++;
        if (icon === 'paper.png') paperCount++;
        if (icon === 'scissors.png') scissorsCount++;

        npcsContainer.appendChild(npc);
    }
    updateStats();
}

function moveNPCs() {
    const npcs = document.querySelectorAll('.npc');
    npcs.forEach(npc => {
        let newX = parseFloat(npc.style.left) + npc.velocityX;
        let newY = parseFloat(npc.style.top) + npc.velocityY;

        // Check for collisions with arena boundaries and reverse direction if necessary
        if (newX <= 0 || newX >= arena.offsetWidth - npc.offsetWidth) {
            npc.velocityX *= -1;
        }
        if (newY <= 0 || newY >= arena.offsetHeight - npc.offsetHeight) {
            npc.velocityY *= -1;
        }

        // Update NPC position
        npc.style.left = `${newX}px`;
        npc.style.top = `${newY}px`;
    });

    handleNPCCollisions();
}

function updateStats() {
    // Update pie chart
    npcChart.data.datasets[0].data = [rockCount, paperCount, scissorsCount];
    npcChart.update();
}

function updatePlayerPosition() {
    player.style.left = `${playerX - player.offsetWidth / 2}px`;
    player.style.top = `${playerY - player.offsetHeight / 2}px`;
    usernameDisplay.style.left = `${playerX}px`;
    usernameDisplay.style.top = `${playerY + player.offsetHeight / 2}px`;
    arena.style.left = `${gameContainer.offsetWidth / 2 - playerX}px`;
    arena.style.top = `${gameContainer.offsetHeight / 2 - playerY}px`;
}

function handleKeyDown(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
}

function handleKeyUp(event) {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
    }
}

function updateVelocity() {
    let moveX = 0;
    let moveY = 0;

    if (keys.w) moveY -= 1;
    if (keys.a) moveX -= 1;
    if (keys.s) moveY += 1;
    if (keys.d) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
        moveX /= sqrt2;
        moveY /= sqrt2;
    }

    velocityX = Math.min(Math.max(velocityX + moveX * acceleration, -maxSpeed), maxSpeed);
    velocityY = Math.min(Math.max(velocityY + moveY * acceleration, -maxSpeed), maxSpeed);
}

function applyFriction() {
    if (velocityX > 0) {
        velocityX = Math.max(velocityX - friction, 0);
    } else if (velocityX < 0) {
        velocityX = Math.min(velocityX + friction, 0);
    }

    if (velocityY > 0) {
        velocityY = Math.max(velocityY - friction, 0);
    } else if (velocityY < 0) {
        velocityY = Math.min(velocityY + friction, 0);
    }
}

function handleNPCCollisions() {
    clearGrid();
    const npcs = document.querySelectorAll('.npc');
    npcs.forEach(npc => addToGrid(npc));

    for (const key in grid) {
        const [x, y] = key.split(',').map(Number);
        const bucketsToCheck = [
            `${x},${y}`, `${x+1},${y}`, `${x-1},${y}`,
            `${x},${y+1}`, `${x},${y-1}`, `${x+1},${y+1}`,
            `${x-1},${y-1}`, `${x+1},${y-1}`, `${x-1},${y+1}`
        ];

        bucketsToCheck.forEach(cellKey => {
            const bucket = grid[cellKey];
            if (bucket) {
                for (let i = 0; i < bucket.length; i++) {
                    for (let j = i + 1; j < bucket.length; j++) {
                        const npc1 = bucket[i];
                        const npc2 = bucket[j];
                        if (checkCollision(npc1, npc2)) {
                            const npc1Icon = npc1.src.split('/').pop();
                            const npc2Icon = npc2.src.split('/').pop();
                            const result = determineWinner(npc1Icon, npc2Icon);
                            if (result === 'player') {
                                npc2.src = npc1.src;
                                updateCounters(npc2Icon, npc1Icon);
                            } else if (result === 'npc') {
                                npc1.src = npc2.src;
                                updateCounters(npc1Icon, npc2Icon);
                            }
                            updateStats();

                            // Reverse velocities to simulate bounce
                            // but only if they are not the same type
                            // because this causes them to get stuck
                            if (npc1Icon !== npc2Icon) {
                                const tempVelocityX = npc1.velocityX;
                                const tempVelocityY = npc1.velocityY;
                                npc1.velocityX = npc2.velocityX;
                                npc1.velocityY = npc2.velocityY;
                                npc2.velocityX = tempVelocityX;
                                npc2.velocityY = tempVelocityY;
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateCounters(oldIcon, newIcon) {
    if (oldIcon === 'rock.png') rockCount--;
    if (oldIcon === 'paper.png') paperCount--;
    if (oldIcon === 'scissors.png') scissorsCount--;

    if (newIcon === 'rock.png') rockCount++;
    if (newIcon === 'paper.png') paperCount++;
    if (newIcon === 'scissors.png') scissorsCount++;
}

function checkCollision(npc1, npc2_or_player) {
    const npc1Rect = npc1.getBoundingClientRect();
    const npc2Rect = npc2_or_player.getBoundingClientRect();

    return !(
        npc1Rect.top > npc2Rect.bottom ||
        npc1Rect.bottom < npc2Rect.top ||
        npc1Rect.left > npc2Rect.right ||
        npc1Rect.right < npc2Rect.left
    );
}

function determineWinner(playerIcon, npcIcon) {
    if (playerIcon === npcIcon) return 'draw';
    if (
        (playerIcon === 'rock.png' && npcIcon === 'scissors.png') ||
        (playerIcon === 'paper.png' && npcIcon === 'rock.png') ||
        (playerIcon === 'scissors.png' && npcIcon === 'paper.png')
    ) {
        return 'player';
    }
    return 'npc';
}

function handleCollisions() {
    if (!gameRunning) return; // Exit if the game is not running

    const npcs = document.querySelectorAll('.npc');
    npcs.forEach(npc => {
        if (checkCollision(npc, player)) {
            const npcIcon = npc.src.split('/').pop();
            const result = determineWinner(selectedIcon, npcIcon);
            if (result === 'player') {
                score++;
                updateScore();
                npc.remove();

                // Update counters
                if (npcIcon === 'rock.png') rockCount--;
                if (npcIcon === 'paper.png') paperCount--;
                if (npcIcon === 'scissors.png') scissorsCount--;

                updateStats();
            } else if (result === 'npc') {
                if (gameRunning) {
                    resetGame();
                }
            }
        }
    });
}

function resetGame() {
    gameRunning = false;
    playerX = arena.offsetWidth / 2;
    playerY = arena.offsetHeight / 2;
    velocityX = 0;
    velocityY = 0;
    npcsContainer.innerHTML = '';
    spawnMenu.style.display = 'block';
    gameContainer.style.display = 'none';
    removeEventListeners();
    rockCount = 0;
    paperCount = 0;
    scissorsCount = 0;
    updateStats();
}

function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function gameLoop() {
    if (!gameRunning) return;
    updateVelocity();
    playerX = Math.min(Math.max(playerX + velocityX, player.offsetWidth / 2), arena.offsetWidth - player.offsetWidth / 2);
    playerY = Math.min(Math.max(playerY + velocityY, player.offsetHeight / 2), arena.offsetHeight - player.offsetHeight / 2);

    applyFriction();
    updatePlayerPosition();
    handleCollisions();
    moveNPCs();
    updateFPS();
    requestAnimationFrame(gameLoop);
}

function startGame(event) {
    event.preventDefault();
    let username = usernameInput.value;
    if (!username) {
        username = 'player #' + Math.floor(Math.random() * 1000);
    }
    const selectedIconInput = document.querySelector('input[name="player-icon"]:checked');
    if (selectedIconInput) {
        selectedIcon = selectedIconInput.value;
        console.log("Starting game with username:", username, "and icon:", selectedIcon);
        player.src = `img/${selectedIcon}`;
        usernameDisplay.textContent = username;
        spawnMenu.style.display = 'none';
        gameContainer.style.display = 'block';
        rockCount = 0;
        paperCount = 0;
        scissorsCount = 0;
        createNPCs(150);
        updatePlayerPosition();
        addEventListeners();
        updateStats();
        playerX = arena.offsetWidth / 2;
        playerY = arena.offsetHeight / 2;
        velocityX = 0;
        velocityY = 0;
        score = 0;
        updateScore();
        gameRunning = true;
        lastFrameTime = performance.now(); // Reset FPS counter
        frameCount = 0;
        fps = 0;
        gameLoop();
    } else {
        console.log("Username and icon selection are required");
    }
}

function addEventListeners() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function removeEventListeners() {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
}

spawnForm.addEventListener('submit', startGame);