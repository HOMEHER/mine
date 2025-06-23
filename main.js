// main.js

const boardElement = document.getElementById('game-board');
const messageElement = document.getElementById('game-message');
const startBtn = document.getElementById('start-btn');
const rowsInput = document.getElementById('rows');
const colsInput = document.getElementById('cols');
const minesInput = document.getElementById('mines');
const seeBtn = document.getElementById('see-btn');
const timerElement = document.getElementById('timer');
const bestTimeElement = document.getElementById('best-time');

let board = [];
let revealed = [];
let flagged = [];
let mineLocations = [];
let rows = 9;
let cols = 9;
let mines = 10;
let gameOver = false;
let seeMode = false;
let startTime = null;
let timerInterval = null;

seeBtn.addEventListener('mousedown', () => {
    seeMode = true;
    renderBoard();
});
seeBtn.addEventListener('mouseup', () => {
    seeMode = false;
    renderBoard();
});
seeBtn.addEventListener('mouseleave', () => {
    seeMode = false;
    renderBoard();
});

function initGame() {
    rows = parseInt(rowsInput.value);
    cols = parseInt(colsInput.value);
    mines = parseInt(minesInput.value);
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    mineLocations = [];
    gameOver = false;
    messageElement.textContent = '';
    placeMines();
    calculateNumbers();
    renderBoard();
    startTimer();
}

function placeMines() {
    let placed = 0;
    while (placed < mines) {
        let r = Math.floor(Math.random() * rows);
        let c = Math.floor(Math.random() * cols);
        if (board[r][c] !== 'M') {
            board[r][c] = 'M';
            mineLocations.push([r, c]);
            placed++;
        }
    }
}

function calculateNumbers() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 'M') continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    let nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === 'M') {
                        count++;
                    }
                }
            }
            board[r][c] = count;
        }
    }
}

function renderBoard() {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateRows = `repeat(${rows}, 32px)`;
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 32px)`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (seeMode && board[r][c] === 'M' && !revealed[r][c]) {
                cell.classList.add('mine');
                cell.textContent = '💣';
                cell.style.opacity = '0.5';
            } else if (revealed[r][c]) {
                cell.classList.add('revealed');
                if (board[r][c] === 'M') {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (board[r][c] > 0) {
                    cell.textContent = board[r][c];
                    cell.style.color = getNumberColor(board[r][c]);
                }
            } else if (flagged[r][c]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            }
            cell.addEventListener('click', (e) => handleCellClick(r, c));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleCellRightClick(r, c);
            });
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(r, c) {
    if (gameOver || revealed[r][c] || flagged[r][c]) return;
    if (board[r][c] === 'M') {
        stopTimer();
        revealAllMines();
        messageElement.textContent = '遊戲結束！你踩到地雷了！';
        gameOver = true;
        return;
    }
    revealCell(r, c);
    if (checkWin()) {
        stopTimer();
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        updateBestTime(seconds);
        messageElement.textContent = `恭喜你贏了！用時 ${seconds} 秒`;
        gameOver = true;
        revealAllMines(true);
    }
}

function handleCellRightClick(r, c) {
    if (gameOver || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    renderBoard();
}

function revealCell(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr !== 0 || dc !== 0) {
                    revealCell(r + dr, c + dc);
                }
            }
        }
    }
    renderBoard();
}

function revealAllMines(win = false) {
    for (const [r, c] of mineLocations) {
        revealed[r][c] = true;
    }
    renderBoard();
}

function checkWin() {
    let safeCells = rows * cols - mines;
    let revealedCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (revealed[r][c] && board[r][c] !== 'M') revealedCount++;
        }
    }
    return revealedCount === safeCells;
}

function getNumberColor(num) {
    const colors = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#fbc02d', '#0097a7', '#c2185b', '#616161'];
    return colors[num - 1] || '#333';
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = `時間: ${seconds}秒`;
}

function updateBestTime(seconds) {
    const currentConfig = `${rows}x${cols}-${mines}`;
    const bestTimes = JSON.parse(localStorage.getItem('minesweeperBestTimes') || '{}');
    const currentBest = bestTimes[currentConfig];
    
    if (!currentBest || seconds < currentBest) {
        bestTimes[currentConfig] = seconds;
        localStorage.setItem('minesweeperBestTimes', JSON.stringify(bestTimes));
        showBestTime();
    }
}

function showBestTime() {
    const currentConfig = `${rows}x${cols}-${mines}`;
    const bestTimes = JSON.parse(localStorage.getItem('minesweeperBestTimes') || '{}');
    const bestTime = bestTimes[currentConfig];
    bestTimeElement.textContent = bestTime ? `最佳紀錄: ${bestTime}秒` : '最佳紀錄: 尚無紀錄';
}

startBtn.addEventListener('click', () => {
    initGame();
    showBestTime();
});

// 初始化時顯示最佳紀錄
showBestTime();
initGame();
