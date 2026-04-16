// js/camera.js
async function setupCamera() {
    const video = document.getElementById('camera-stream');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Usa la cámara trasera
        audio: false
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}
// js/camera.js
async function setupCamera() {
    const video = document.getElementById('camera-stream');
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Usa la cámara trasera
        audio: false
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}
