/**
 * AI Janken - Main Logic
 *
 * セキュリティ方針:
 *   - 外部APIキー不使用。手の認識はMediaPipeによりブラウザ内で完結。
 *   - カメラ映像・ランドマークデータはサーバーに送信しない。
 *   - すべての入力値は使用前にバリデーションする。
 */

'use strict';

/* ---------- DOM 参照 ---------- */
const videoElement    = document.getElementById('user-video');
const badge           = document.getElementById('ai-badge');
const gestureElement  = document.getElementById('player-gesture');
const playButton      = document.getElementById('play-button');
const cpuHandDisplay  = document.querySelector('#cpu-hand-display .hand-icon');
const gameStatus      = document.getElementById('game-status');
const playerScoreEl   = document.getElementById('player-score');
const cpuScoreEl      = document.getElementById('cpu-score');

/* ---------- ゲーム状態 ---------- */
let playerScore = 0;
let cpuScore    = 0;

/** 有効なじゃんけんの手の定義 */
const HANDS = Object.freeze([
    { name: 'Rock',     emoji: '✊', label: 'グー' },
    { name: 'Scissors', emoji: '✌️', label: 'チョキ' },
    { name: 'Paper',    emoji: '✋', label: 'パー' },
]);

const VALID_GESTURES = new Set(HANDS.map(h => h.name));

/* ---------- 手の認識 ---------- */

/**
 * MediaPipe のランドマーク座標からじゃんけんの手を推定する
 * @param {Array} landmarks - 21点のランドマーク配列
 * @returns {string} 'Rock' | 'Scissors' | 'Paper' | 'Searching...'
 */
function detectJanken(landmarks) {
    // 入力の簡易バリデーション
    if (!Array.isArray(landmarks) || landmarks.length < 21) return 'Searching...';

    const indexOpen  = landmarks[8].y  < landmarks[6].y;
    const middleOpen = landmarks[12].y < landmarks[10].y;
    const ringOpen   = landmarks[16].y < landmarks[14].y;
    const pinkyOpen  = landmarks[20].y < landmarks[18].y;

    const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

    if (openCount === 0)                             return 'Rock';
    if (openCount === 4)                             return 'Paper';
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) return 'Scissors';
    return 'Searching...';
}

/* ---------- MediaPipe 初期化 ---------- */

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        badge.textContent = 'Hand Detected';
        badge.style.backgroundColor = '#16a34a'; // green-600

        const gesture = detectJanken(results.multiHandLandmarks[0]);

        // テキストコンテンツのみ更新（XSSリスクなし）
        const found = HANDS.find(h => h.name === gesture);
        gestureElement.textContent       = found ? `${found.label} ${found.emoji}` : '認識中...';
        gestureElement.dataset.gesture   = found ? found.name : '';  // 判定用生データ
    } else {
        badge.textContent = '検出中...';
        badge.style.backgroundColor = '#2563eb'; // blue-600
        gestureElement.textContent     = '待機中...';
        gestureElement.dataset.gesture = '';
    }
});

/* ---------- 勝敗判定 ---------- */

/**
 * @param {string} player - プレイヤーの手
 * @param {string} cpu    - CPUの手
 * @returns {'Win'|'Lose'|'Draw'}
 */
function judge(player, cpu) {
    if (player === cpu) return 'Draw';
    if (
        (player === 'Rock'     && cpu === 'Scissors') ||
        (player === 'Scissors' && cpu === 'Paper')    ||
        (player === 'Paper'    && cpu === 'Rock')
    ) return 'Win';
    return 'Lose';
}

/* ---------- ゲームラウンド ---------- */

function playRound() {
    const playerHand = gestureElement.dataset.gesture;

    // 入力バリデーション
    if (!playerHand || !VALID_GESTURES.has(playerHand)) {
        setStatus('手をカメラに映してください！', '#dc2626');
        return;
    }

    // CPUの手をランダムに選択（Math.random() はゲーム用途で問題なし）
    const cpuChoice = HANDS[Math.floor(Math.random() * HANDS.length)];

    // textContent で更新（innerHTML 不使用）
    cpuHandDisplay.textContent = cpuChoice.emoji;
    cpuHandDisplay.setAttribute('aria-label', `CPUの手: ${cpuChoice.label}`);

    const result = judge(playerHand, cpuChoice.name);

    if (result === 'Win') {
        setStatus('あなたの勝ち！ 🎉', '#16a34a');
        playerScoreEl.textContent = ++playerScore;
    } else if (result === 'Lose') {
        setStatus('CPUの勝ち... 🤖', '#dc2626');
        cpuScoreEl.textContent = ++cpuScore;
    } else {
        setStatus('あいこ！ 🤝', '#4b5563');
    }
}

function setStatus(text, color) {
    gameStatus.textContent = text; // textContent で XSS 防止
    gameStatus.style.color = color;
}

/* ---------- カメラ起動 ---------- */

async function startCamera() {
    try {
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 1280,
            height: 720,
        });
        await camera.start();
        badge.textContent = 'AI Ready ✅';
    } catch (err) {
        // カメラエラーは console に留め、スタックトレースをユーザーに露出しない
        console.error('[Camera] 起動失敗:', err.name, err.message);
        badge.textContent = 'カメラエラー ⚠️';
        badge.style.backgroundColor = '#dc2626';
        setStatus('カメラへのアクセスを許可してください。', '#dc2626');
    }
}

/* ---------- イベント登録 ---------- */

playButton.addEventListener('click', playRound);
window.addEventListener('DOMContentLoaded', startCamera);
