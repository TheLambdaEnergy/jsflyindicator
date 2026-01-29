
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext(`2d`);

const compassCanvas = document.getElementById('compass');
const compassCtx = compassCanvas.getContext('2d');

let w = canvas.width;
let h = canvas.height;

let currentPitch = 0;
let currentRoll = 0;
let currentYaw = 0;

let config = {
    lineWidth: 3,
    rollScaleWidth: 100,
    tailSize: 15,
    strokeStyle: "#17ff06",
    pitchPadding: 140,
    pitchLine: 20,
    pitchTextPadding: 10,
    pitchMaxRange: 180,
    pitchStep: 20,
    stringHeightCenterCorrection: 3,
}

let flyBySelf = false;

ctx.translate(w/2, h/2);
compassCtx.translate(w/2, h/2);

ctx.font = "10px OCR";
ctx.fillStyle = config.strokeStyle;

compassCtx.font = "20px Consolas";
compassCtx.fillStyle = config.strokeStyle;
compassCtx.strokeStyle = config.strokeStyle;
compassCtx.textAlign = "center";
compassCtx.textBaseline = "middle";

function drawAll(roll, pitch, yaw) {
    draw(roll, pitch);
    drawCompass(yaw);
}

function draw(roll, pitch) {
    clearCtx();
    drawPitch(pitch);
    drawRollLine(roll);
    // ctx.fillRect(-350,0,700,1);
} 

function clearCtx() {
    ctx.rotate(Math.PI * (-currentRoll)/180);
    ctx.clearRect(-w/2, -h/2, w, h);
}

function drawPitch(pitch) {
    const currentCenter = Math.trunc(pitch/config.pitchStep)* config.pitchStep;
    const allStepsCount = config.pitchMaxRange / config.pitchStep;

    const values = []

    let calculatedSteps = -allStepsCount;
    let currentCount = currentCenter - config.pitchMaxRange - config.pitchStep;

    while(calculatedSteps < allStepsCount + 1) {
        if (currentCount === 180) {
            currentCount = currentCount - 360;
        } 
        currentCount = currentCount + config.pitchStep;
        
        values.push({
            coords: pitch - currentCenter - (calculatedSteps) * config.pitchStep,
            value: currentCount > -180 ? currentCount : currentCount + 360,
        });
        calculatedSteps++;
    }




    ctx.fillStyle = config.strokeStyle;
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();

    values.forEach(value => {
        // left side
        ctx.fillText(value.value, -config.pitchPadding - config.pitchTextPadding * 2, value.coords + config.stringHeightCenterCorrection);
        ctx.fill();
        if (value.value % 60 === 0) {
            ctx.moveTo(-config.pitchPadding - config.pitchTextPadding * 3, value.coords);
        } else {
            ctx.moveTo(-config.pitchPadding - config.pitchTextPadding * 3 - config.pitchLine*2/3, value.coords);
        }
        ctx.lineTo(-config.pitchPadding - config.pitchTextPadding * 3 - config.pitchLine , value.coords);
        ctx.stroke();


        // right side
        ctx.fillText(value.value, config.pitchPadding, value.coords + config.stringHeightCenterCorrection);
        ctx.fill();
        if (value.value % 60 === 0) {
            ctx.moveTo(config.pitchPadding + config.pitchTextPadding * 3, value.coords);
        } else {
            ctx.moveTo(config.pitchPadding + config.pitchTextPadding * 3 + config.pitchLine*2/3, value.coords);
        }
        ctx.lineTo(config.pitchPadding + config.pitchTextPadding * 3 + config.pitchLine , value.coords);
        ctx.stroke();
    })
}

function drawRollLine(roll) {
    ctx.rotate(Math.PI * roll/180);
    currentRoll = roll;
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();
    ctx.moveTo(-config.rollScaleWidth - config.tailSize, 0);
    ctx.lineTo(-config.tailSize, 0);
    ctx.lineTo(0, config.tailSize);
    ctx.lineTo(config.tailSize, 0);
    ctx.lineTo(config.rollScaleWidth + config.tailSize, 0);
    ctx.stroke();
    ctx.closePath();
}

function drawCompass(yaw) {
    // Reset previous rotation
    compassCtx.rotate(Math.PI * (currentYaw)/180);
    compassCtx.clearRect(-w/2, -h/2, w, h);

    // Draw Yaw text (fixed at top center)
    compassCtx.fillStyle = config.strokeStyle;
    compassCtx.fillText(yaw, 0, -270);

    // Rotate to current Yaw (negative because compass card moves opposite to turn)
    compassCtx.rotate(Math.PI * (-yaw)/180);
    
    // Config values
    const r = 250;
    const tickLenShort = 10;
    const tickLenLong = 20;

    compassCtx.strokeStyle = config.strokeStyle;
    compassCtx.lineWidth = 2; // Slightly thinner for compass
    
    // Draw Circle
    compassCtx.beginPath();
    compassCtx.arc(0, 0, r, 0, Math.PI * 2);
    compassCtx.stroke();

    // Draw Ticks and Labels
    for (let i = 0; i < 360; i += 15) {
        compassCtx.save();
        // Rotate to the tick position
        // Subtract 90 degrees because 0 degrees on canvas is right (3 o'clock), 
        // but we want 0 degrees (North) to be up (12 o'clock).
        compassCtx.rotate((i - 90) * Math.PI / 180);
        
        compassCtx.beginPath();
        if (i % 90 === 0) {
            // Long tick
            compassCtx.moveTo(r, 0);
            compassCtx.lineTo(r - tickLenLong, 0);
            compassCtx.stroke();
            
            // Label
            compassCtx.translate(r - tickLenLong - 35, 0); 
            // Rotate text to be tangent to the circle (readable when at top)
            compassCtx.rotate(Math.PI / 2);
            
            let label = "";
            if (i === 0) label = "N";
            else if (i === 90) label = "E";
            else if (i === 180) label = "S";
            else if (i === 270) label = "W";
            
            compassCtx.fillText(label, 0, 0);

        } else {
            // Short tick
            compassCtx.moveTo(r, 0);
            compassCtx.lineTo(r - tickLenShort, 0);
            compassCtx.stroke();
        }
        compassCtx.restore();
    }

    currentYaw = yaw;
}

function handleKeyDown(event) {
    switch (event.code) {
        case 'ArrowLeft':
            draw(currentRoll - 1, currentPitch);
            break;
        case 'ArrowRight':
            draw(currentRoll + 1, currentPitch);
            break;
        case 'ArrowUp':
            currentPitch = getNewPitch(true);
            draw(currentRoll, currentPitch);
            break;
        case 'ArrowDown':
            currentPitch = getNewPitch(false);
            draw(currentRoll, currentPitch);
            break;
        case 'PageUp':
            let newYawUp = currentYaw + 1;
            if (newYawUp >= 360) newYawUp -= 360;
            drawCompass(newYawUp);
            break;
        case 'PageDown':
            let newYawDown = currentYaw - 1;
            if (newYawDown < 0) newYawDown += 360;
            drawCompass(newYawDown);
            break;
        case 'KeyA':
            flyBySelf = !flyBySelf;
            requestAnimationFrame(tick);
            break;
        default:
            break;
    }
}

function getNewPitch(increment) {
    if (currentPitch === 180 && increment) {
        return currentPitch - 359;
    } else if (currentPitch === -179 && !increment) {
        return currentPitch + 359;
    }

    return increment ? currentPitch + 1 : currentPitch - 1;
}

function tick() {
    if (flyBySelf) {
        requestAnimationFrame(tick);
    }

    currentPitch = getNewPitch(Math.random() > 0.5);
    
    draw((Math.random() > 0.5 && currentRoll < 40 || currentRoll < -40 ? currentRoll + 1 : currentRoll - 1), currentPitch);
}

document.addEventListener('keydown', handleKeyDown);

// Draw overlay reference lines
const overlayCanvas = document.getElementById('overlay');
drawAll(0, 0, 0);

const overlayCtx = overlayCanvas.getContext('2d');
const overlayW = overlayCanvas.width;
const overlayH = overlayCanvas.height;

overlayCtx.strokeStyle = "#17ff06"; // Green for high visibility
overlayCtx.lineWidth = 2;

// Draw center crosshair
overlayCtx.beginPath();

const lineLength = 200;
const halfLen = lineLength / 2;
const centerX = overlayW / 2;
const centerY = overlayH / 2;

// Horizontal line
overlayCtx.moveTo(centerX - halfLen, centerY);
overlayCtx.lineTo(centerX + halfLen, centerY);

// Vertical line
overlayCtx.moveTo(centerX, centerY - halfLen);
overlayCtx.lineTo(centerX, centerY + halfLen);

overlayCtx.stroke();