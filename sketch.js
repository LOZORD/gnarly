// gnarsh.js
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
const MAX_BUFFER_SIZE = 15;
const MAX_OPACITY = 255 * 0.9; // Just below _full_ opacity so things are actually visible behind.
const WITHIN_BOUNDS = true;
const ATTACK_RATE = 2;
const IMAGE_SHRINK_FACTOR = 0.98;// 0.90;
const REDRAW_BACKGROUND = false;
const TINT_IMAGES = true;
const USE_HSB = false;
const DO_WOBBLE = false;
const PIXELATION_DENSITY = 0.5;


let testSlider;
let testSlider2;

let cam;
let imageBuffer;

function setup() {
    cam = createCapture(VIDEO, CAMERA_OPTS);
    cam.hide();

    const canvas = createCanvas(CAMERA_DIMS.width*CAMERA_SCALE, CAMERA_DIMS.height*CAMERA_SCALE);
    // // createCanvas(windowWidth, windowHeight);
    // background(220);

    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    canvas.position(x, y);

    imageBuffer = [];

    // testSlider = createSlider(0, 1, 0.2, 0.1);
    // testSlider.position(50, 20);
    // fill ('pink');
    // textSize(40);
    // text('hello world', testSlider.x + 2 + testSlider.width, 2);
    testSlider = new LabelledSlider('Test Slider', 20, 20, 0, 25, 2, 1);
    testSlider2 = new LabelledSlider('Another Slider', 20, 40, 0, 3, 0.1, 0.1);
}


function draw() {
    // resizeCanvas(CA);

    // fill('pink');
    // text('hello world', testSlider.x * 2 + testSlider.width, 2);
    testSlider.draw();
    testSlider2.draw();
    print(testSlider2.value());

    if (REDRAW_BACKGROUND) {
        background('black');
    } else if (frameCount % ATTACK_RATE != 0) {
        return;
    }

    // fill ('white');
    // textSize(40);
    // const t =text('test slider', 200, 5);
    // print(t);

    print(`capturing! ${new Date().toTimeString()}`)

    let newImage = captureImage();
    imageBuffer.unshift(newImage);

    if (imageBuffer.length > MAX_BUFFER_SIZE) {
        imageBuffer.pop();
    }

    // print(`got ${imageBuffer.length} images: ${imageBuffer}`);
    const MAX_IMAGE_PLACEMENT_OFFSET = 75;
    const NUM_IMAGES = imageBuffer.length;
    for (let i = 0; i < NUM_IMAGES; i++) {
        // const opacity = MAX_OPACITY - map(i, 0, MAX_BUFFER_SIZE, 0);
        const opacity = calculateOpacity(i, NUM_IMAGES);
        // print(`got opacity ${opacity} for index ${i}`);
        const tintColor = calculateColor(i, NUM_IMAGES, frameCount);

        if (USE_HSB && TINT_IMAGES) {
            colorMode(HSB, 360, 100, 100, 100);
            tint(tintColor.h, tintColor.s, tintColor.b, opacity);
        } else {
            colorMode(RGB, 255, 255, 255, 255);
            tint(tintColor.r, tintColor.g, tintColor.b, opacity);
        }

        const xOffset = DO_WOBBLE ? i * sin(frameCount / 15) : 0; // i*5;// map(sin(frameCount * i), -1, 1, 0, MAX_IMAGE_PLACEMENT_OFFSET);
        const yOffset = DO_WOBBLE ? i * cos(frameCount / 20) : 0; // i*7.5// NUM_IMAGES - (i *5);//map(cos(frameCount * i), -1, 1, 0, MAX_IMAGE_PLACEMENT_OFFSET);
        const img = imageBuffer[i];

        if (IMAGE_SHRINK_FACTOR > 0) {
            img.resize(img.width * IMAGE_SHRINK_FACTOR, 0);
        }

        image(img, 0 + xOffset, 0 + yOffset, width + xOffset, height + yOffset);
    }
}

function captureImage() {
    // let newImage = createImage(width, height);
    // newImage.loadPixels(cam);
    // return newImage;
    let newImage = cam.get(0, 0, CAMERA_DIMS.width, CAMERA_DIMS.height);
    // print(`got image: ${newImage}`);
    // print(newImage);
    // cam = createCapture(VIDEO, CAMERA_OPTS);
    // cam.hide();
    if (PIXELATION_DENSITY > 0) { // FIXME(ljr).
        const density = constrain(PIXELATION_DENSITY, 0.0, displayDensity());
        pixelDensity(density);
        noSmooth();
    }

    return newImage;
}

function calculateOpacity(imageIndex, numImages) {
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
    const MODE_MAX_OPACITY = USE_HSB ? 10 : 255;
    return map(indexAdjustedPercentage, 0, 100, 0, MODE_MAX_OPACITY, WITHIN_BOUNDS);
}

function calculateColor(imageIndex, numImages, frameCount) {
    if (USE_HSB) {
        const fcFactor = map(sin(frameCount / 17), -1, 1, 0, numImages / 2);
        return {
            h: map(imageIndex + fcFactor, 0, numImages, 0, 360, WITHIN_BOUNDS),
            s: 100,
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
    if (key == 's') {
        print('saving!');
        saveGif(`video-delay-${new Date().toISOString()}.gif`, 5);
    }
}