const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const duckImg = new Image();
duckImg.src = '/static/res/duck.png';

let score = 0;
let wasFist = false;
let ducks = [
    { x: -100, y: 100, speed: 3, size: 60 },
    { x: -300, y: 250, speed: 2, size: 60 }
];

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7 });
hands.onResults(onResults);

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        let minX = canvasElement.width, maxX = 0, minY = canvasElement.height, maxY = 0;

        landmarks.forEach(point => {
            const x = (1 - point.x) * canvasElement.width;
            const y = point.y * canvasElement.height;
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        });

        const isFist = landmarks[12].y > landmarks[9].y;

        if (isFist && !wasFist) {
            ducks.forEach(duck => {
                if (!(maxX < duck.x || minX > duck.x + duck.size || maxY < duck.y || minY > duck.y + duck.size)) {
                    score++;
                    document.getElementById('score').innerText = score;
                    duck.x = -100;
                    duck.y = Math.random() * (canvasElement.height - 100) + 50;
                }
            });
        }
        wasFist = isFist;

        canvasCtx.strokeStyle = isFist ? "#ff0000" : "#00f2ff";
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }

    ducks.forEach(duck => {
        duck.x += duck.speed;
        if (duck.x > canvasElement.width) duck.x = -100;
        if (duckImg.complete) {
            canvasCtx.drawImage(duckImg, duck.x, duck.y, duck.size, duck.size);
        }
    });
}

const camera = new Camera(videoElement, {
    onFrame: async () => { await hands.send({image: videoElement}); },
    width: 640, height: 480
});
camera.start();