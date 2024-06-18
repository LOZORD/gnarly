'use strict';

const CAMERA_OPTS = {
    flipped: false,
};

const CAMERA_SCALE = 1.3;
const CAMERA_DIMS = {
    width: 640,
    height: 480,
};
const FULL_COLOR = 255;
const MAX_OPACITY = 255 * 0.9; // Just below _full_ opacity so things are actually visible behind.
const WITHIN_BOUNDS = true;
// const MIN_SHRINK_PERCENTAGE = 25;

let controlPanel;

let cameraRunning = false;

let cam;
let imageBuffer;

function setup() {
    // Set up the webcam.
    cam = createCapture(VIDEO, CAMERA_OPTS, (stream) => {
        print('got stream: ', !!stream);
        cameraRunning = true;
    });
    cam.hide();

    // Create and center the canvas.
    const canvas = createCanvas(CAMERA_DIMS.width * CAMERA_SCALE, CAMERA_DIMS.height * CAMERA_SCALE);
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    canvas.position(x, y);
    background(15);

    // Set up the image buffer.
    imageBuffer = [];

    controlPanel = new ControlPanel([{
        name: 'REDRAW_BACKGROUND',
        label: 'Redraw Background',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'FRAME_CAPTURE_RATE',
        label: 'Frame Capture (Attack) Rate',
        min: 1, max: 20, value: 1, step: 1,
    }, {
        name: 'MAX_BUFFER_SIZE',
        label: 'Max Image Buffer Size',
        min: 2, max: 50, value: 15, step: 1,
    }, {
        name: 'MAX_SHRINK_PERCENTAGE',
        label: 'Max Image Shrink Factor (%)',
        min: 1, max: 100, value: 100, step: 1,
    }, {
        name: 'TINT_IMAGES',
        label: 'Tint Images',
        min: 0, max: 1, value: 1, step: 1,
    }, {
        name: 'USE_HSB',
        label: 'Use HSB/HSV Colorspace',
        min: 0, max: 1, value: 1, step: 1,
        disabled: true,
    }, {
        name: 'DO_WOBBLE',
        label: 'Wobble Images',
        min: 0, max: 1, value: 1, step: 1,
    }, {
        name: 'PIXELATION_DENSITY_PERCENTAGE',
        label: 'Pixelation Density (%)',
        min: 10, max: 100, value: 50, step: 1,
    }, {
        name: 'MIN_SHRINK_PERCENTAGE',
        label: 'Min Image Shrink Factor (%)',
        min: 20, max: 100, value: 95, step: 1,
    }, {
        name: 'BW_CLAMPING',
        label: 'Black/White Clamping (%)',
        min: 0, max: 100, value: 100, step: 1,
    }, {
        name: 'INVERT_FILTER',
        label: 'Invert Image',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'DO_EMPTY_BUFFER',
        label: 'Empty Buffer',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'SATURATION',
        label: 'Saturation',
        min: 0, max: 100, value: 100, step: 1,
    }, {
        name: 'COLOR_CHANGE_SPEED',
        label: 'Color Change Speed',
        min: 1, max: 180, value: 20, step: 1,
    }]);
}


function draw() {
    const FRAME_COUNT = frameCount;
    controlPanel.draw();

    if (!cameraRunning) {
        background('red');
        return;
    }

    const panelValueMap = controlPanel.valuesMap();
    const {
        REDRAW_BACKGROUND,
        FRAME_CAPTURE_RATE,
        MAX_BUFFER_SIZE,
        MAX_SHRINK_PERCENTAGE,
        TINT_IMAGES,
        USE_HSB,
        DO_WOBBLE,
        PIXELATION_DENSITY_PERCENTAGE,
        MIN_SHRINK_PERCENTAGE,
        BW_CLAMPING,
        INVERT_FILTER,
        DO_EMPTY_BUFFER,
        SATURATION,
        COLOR_CHANGE_SPEED,
    } = Object.fromEntries(panelValueMap);


    if (REDRAW_BACKGROUND) {
        background(15);
    } else if (frameCount % FRAME_CAPTURE_RATE != 0) {
        return;
    }

    if (DO_EMPTY_BUFFER) {
        imageBuffer = [];
    }

    // FIXME(ljr): pixel density %.
    let newImage = captureImage(0 & PIXELATION_DENSITY_PERCENTAGE, BW_CLAMPING, INVERT_FILTER);
    imageBuffer.unshift(newImage);
    while (imageBuffer.length > MAX_BUFFER_SIZE) {
        imageBuffer.pop();
    }

    const MAX_IMAGE_PLACEMENT_OFFSET = 75;
    const NUM_IMAGES = imageBuffer.length;
    for (let i = 0; i < NUM_IMAGES; i++) {
        const opacity = calculateOpacity(i, NUM_IMAGES, USE_HSB);
        const tintColor = calculateColor(i,
            NUM_IMAGES,
            FRAME_COUNT,
            USE_HSB,
            SATURATION,
            COLOR_CHANGE_SPEED,
        );

        if (USE_HSB && TINT_IMAGES) {
            colorMode(HSB, 360, 100, 100, 100);
            tint(tintColor.h, tintColor.s, tintColor.b, opacity);
        } else {
            colorMode(RGB, 255, 255, 255, 255); // FIXME(ljr): Get color calculation for RGB working again.
            tint(tintColor.r, tintColor.g, tintColor.b, opacity);
        }

        const xOffset = DO_WOBBLE ? i * sin(frameCount / 15) : 0; // i*5;// map(sin(frameCount * i), -1, 1, 0, MAX_IMAGE_PLACEMENT_OFFSET);
        const yOffset = DO_WOBBLE ? i * cos(frameCount / 20) : 0; // i*7.5// NUM_IMAGES - (i *5);//map(cos(frameCount * i), -1, 1, 0, MAX_IMAGE_PLACEMENT_OFFSET);
        const img = imageBuffer[i];
        const shrinkOffset = map(i, 0, NUM_IMAGES, MIN_SHRINK_PERCENTAGE, MAX_SHRINK_PERCENTAGE, WITHIN_BOUNDS);

        imageMode(CENTER);
        image(
            img,
            width / 2 + xOffset,
            height / 2 + yOffset,
            width * (shrinkOffset / 100.0) + xOffset,
            height * (shrinkOffset / 100.0) + yOffset
        );
    }
}

function captureImage(pixelationDensityPercentage, bwClamingAmount, invertFilter) {
    let newImage = cam.get(0, 0, CAMERA_DIMS.width, CAMERA_DIMS.height);

    if (bwClamingAmount < 100) {
        // TODO(ljr): Look into more filter types.
        newImage.filter(THRESHOLD, 1.0 - bwClamingAmount / 100.0);
    }

    if (invertFilter) {
        newImage.filter(INVERT);
    }

    if (pixelationDensityPercentage > 0 && false) { // FIXME(ljr).
        const density = constrain(pixelationDensityPercentage / 100, 0.0, displayDensity());
        pixelDensity(density);
        noSmooth();
    }

    return newImage;
}

function calculateOpacity(imageIndex, numImages, useHsb) {
    // Lower index => more recent image => higher opacity.

    const MAX_OPACITY_PERCENTAGE = 90;
    const MIN_OPACITY_PERCENTAGE = 10;

    // Some number within [10, 90].
    const mappedPercentage = map(
        imageIndex,
        0, numImages,
        MIN_OPACITY_PERCENTAGE, MAX_OPACITY_PERCENTAGE,
        WITHIN_BOUNDS
    );

    const indexAdjustedPercentage = MAX_OPACITY_PERCENTAGE - mappedPercentage;
    const MODE_MAX_OPACITY = useHsb ? 10 : 255;
    return map(indexAdjustedPercentage, 0, 100, 0, MODE_MAX_OPACITY, WITHIN_BOUNDS);
}

function calculateColor(imageIndex, numImages, frameCount, useHsb, saturation, colorChangeSpeed) {
    if (useHsb) {
        const fcFactor = map(sin(frameCount / colorChangeSpeed), -1, 1, 0, numImages / 2);
        return {
            h: map(imageIndex + fcFactor, 0, numImages, 0, 360, WITHIN_BOUNDS),
            s: saturation,
            b: 100,
        }
    }


    return {
        r: FULL_COLOR, // 255 - imageIndex, // map(numImages - imageIndex, 0, numImages, 100, FULL_COLOR, WITHIN_BOUNDS),
        g: FULL_COLOR, // 100 + imageIndex, //map(imageIndex, 0, numImages, 100, FULL_COLOR, WITHIN_BOUNDS),
        b: FULL_COLOR, // 0, // map(sin(frameCount), -1, 1, 100, FULL_COLOR, WITHIN_BOUNDS),
    };
}

function keyPressed() {
    // TODO(ljr): Implement image (png) saving functionality.
    // if (key == 's') {
    //     print('saving!');
    //     saveGif(`video-delay-${new Date().toISOString()}.gif`, 5);
    // }
}