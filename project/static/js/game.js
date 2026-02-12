const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const duckImg = new Image();
duckImg.src = '/static/res/duck.png';

let score = 0;
let ducks = [];
let lastSpawn = 0;
const spawnRate = 2000;
const maxHandSize = 200;
const duckSize = 100;

let handStates = { 0: false, 1: false, 2: false, 3: false };

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 4,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

function createDuck() {
    const fromLeft = Math.random() > 0.5;
    ducks.push({
        x: fromLeft ? -duckSize : canvasElement.width + duckSize,
        y: Math.random() * (canvasElement.height - 150) + 50,
        speed: (Math.random() * 6 + 5) * (fromLeft ? 1 : -1),
        size: duckSize,
        isMirrored: !fromLeft
    });
}

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    if (Date.now() - lastSpawn > spawnRate) {
        createDuck();
        lastSpawn = Date.now();
    }

    if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
            let minX = canvasElement.width, maxX = 0, minY = canvasElement.height, maxY = 0;

            landmarks.forEach(p => {
                const px = (1 - p.x) * canvasElement.width;
                const py = p.y * canvasElement.height;
                if (px < minX) minX = px; if (px > maxX) maxX = px;
                if (py < minY) minY = py; if (py > maxY) maxY = py;
            });

            let centerX = (minX + maxX) / 2;
            let centerY = (minY + maxY) / 2;
            let w = maxX - minX;
            let h = maxY - minY;

            if (w > maxHandSize || h > maxHandSize) {
                minX = centerX - maxHandSize / 2;
                maxX = centerX + maxHandSize / 2;
                minY = centerY - maxHandSize / 2;
                maxY = centerY + maxHandSize / 2;
            }

            const isCurrentlyFist = landmarks[12].y > landmarks[9].y;

            if (isCurrentlyFist && handStates[index] === false) {
                for (let i = ducks.length - 1; i >= 0; i--) {
                    const d = ducks[i];
                    if (!(maxX < d.x || minX > d.x + d.size || maxY < d.y || minY > d.y + d.size)) {
                        score++;
                        document.getElementById('score').innerText = score;
                        ducks.splice(i, 1);
                    }
                }
            }
            handStates[index] = isCurrentlyFist;

            canvasCtx.strokeStyle = isCurrentlyFist ? "#ff0000" : "#00f2ff";
            canvasCtx.lineWidth = 3;
            canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        });
    }

    ducks.forEach((duck, index) => {
        duck.x += duck.speed;

        if (duckImg.complete) {
            canvasCtx.save();
            if (duck.isMirrored) {
                canvasCtx.translate(duck.x + duck.size, duck.y);
                canvasCtx.scale(-1, 1);
                canvasCtx.drawImage(duckImg, 0, 0, duck.size, duck.size);
            } else {
                canvasCtx.drawImage(duckImg, duck.x, duck.y, duck.size, duck.size);
            }
            canvasCtx.restore();
        }

        if (duck.x < -200 || duck.x > canvasElement.width + 200) {
            ducks.splice(index, 1);
        }
    });
}

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 1280,
    height: 720
});
camera.start();