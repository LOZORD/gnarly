'use strict';


// TODO: consider incorporating a WebGL view like
// https://editor.p5js.org/ljrudberg/sketches/3hM21zJVU.

// Blend modes defined by P5 for this 2D canvas.
// It's declared in setup since the variables might not exist at the global
// scope.
let BLEND_MODES;
let cam;
let cameraRunning = false;
let canvas;
let imageBuffer;

/** The BroadcastChannel for control window communication. */
let channel;
let currentControlPayload = {};

function setup() {
    // Set up the webcam.
    cam = createCapture(VIDEO, CAMERA_OPTS, (stream) => {
        print('got stream: ', !!stream);
        cameraRunning = true;
    });
    cam.hide();

    canvas = createCanvas(windowWidth, windowHeight);

    // Set up the image buffer.
    imageBuffer = [];

    BLEND_MODES = [
        BLEND,      // 0
        ADD,        // 1
        DARKEST,    // 2
        LIGHTEST,   // 3
        EXCLUSION,  // 4
        MULTIPLY,   // 5
        SCREEN,     // 6
        REPLACE,    // 7
        REMOVE,     // 8
        DIFFERENCE, // 9
        OVERLAY,    // 10
        HARD_LIGHT, // 11
        SOFT_LIGHT, // 12
        DODGE,      // 13
        BURN,       // 14
    ];

    // Clear the background.
    // Since we like having older image artifacts remain,
    // this should be the only `background` call that is not controlled/enabled
    // elsewhere.
    background(0);

    channel = new BroadcastChannel('gnarly');

    channel.onmessage = (event) => {
        console.log('got channel event: ', event);
        currentControlPayload = structuredClone(event.data);
        console.log('current control payload: ', currentControlPayload);
    };

    openControlPanelWindow();
}

function openControlPanelWindow() {
    const searchParams = new URLSearchParams();
    searchParams.set('windowWidth', windowWidth);
    searchParams.set('windowHeight', windowHeight);
    searchParams.set('canvasWidth', width);
    searchParams.set('canvasHeight', height);
    searchParams.set('camWidth', cam.width);
    searchParams.set('camHeight', cam.height);

    const newWindow = window.open(`./control.html?${searchParams.toString()}`, null, 'popup=true');
    console.log('got new window: ', newWindow);
    return newWindow;
}


function draw() {
    // Just alias the variable to a const.
    const FRAME_COUNT = frameCount;
    channel.postMessage({
        'frameRate': frameRate(),
    });

    // Just show something while the camera is getting ready.
    if (!cameraRunning) {
        fill('indigo');
        circle(width / 2, height / 2, 10);
        return;
    }

    if (!('control' in currentControlPayload)) {
        if (frameCount % 200 == 0) {
            console.warn('current control payload has no `control` key');
        }
    }

    const {
        BLEND_MODE,
        BW_CLAMPING,
        CAMERA_SCALE,
        COLOR_CHANGE_SPEED,
        DO_EMPTY_BUFFER,
        DUPLICATE_AMOUNT,
        DUPLICATE_COLS,
        DUPLICATE_MARGIN,
        DUPLICATE_MODE,
        DUPLICATE_OFFSET_X,
        DUPLICATE_OFFSET_Y,
        DUPLICATE_PADDING,
        DUPLICATE_ROWS,
        DUPLICATE_SCALE_FACTOR,
        FADE_BACKGROUND,
        FADE_BLEND_MODE,
        FILTER_BLUR_AMOUNT,
        FILTER_DILATE_ENABLED,
        FILTER_ERODE_ENABLED,
        FILTER_INVERT_ENABLED,
        FILTER_POSTERIZE_ENABLED,
        FRAME_CAPTURE_RATE,
        HOLD_PHOTOS,
        HUE_SECTOR_ANGLE,
        HUE_SECTOR_WIDTH,
        LISSAJOUS_CONSTANT_BIG_A,
        LISSAJOUS_CONSTANT_BIG_B,
        LISSAJOUS_CONSTANT_DELTA,
        LISSAJOUS_CONSTANT_LIL_A,
        LISSAJOUS_CONSTANT_LIL_B,
        LISSAJOUS_ENABLED,
        LISSAJOUS_TIME_DILATION,
        MAX_BUFFER_SIZE,
        MAX_SHRINK_PERCENTAGE,
        MIN_SHRINK_PERCENTAGE,
        PIXELATION_DENSITY,
        PIXELATION_ENABLED,
        REDRAW_BACKGROUND,
        ROTATION_OFFSET,
        ROTATION_SPEED,
        SATURATION,
        TINT_IMAGES,
        USE_HSB,
        WOBBLE_ENABLED,
        WOBBLE_X,
        WOBBLE_Y,
    } = (currentControlPayload.control || {});

    // Use `else if` for the capture rate vs REDRAW_BACKGROUND because it will make the
    // image drawing choppy otherwise.
    if (REDRAW_BACKGROUND) {
        background(0);
    } else if (FADE_BACKGROUND) {
        // Use blend modes to remove any sort of "ghost" images
        // that might otherwise remain.
        // See https://stackoverflow.com/a/68979818 for context. 
        // REMOVE and BURN seem to do the best at this.     
        blendMode(blendModeName(FADE_BLEND_MODE));
        // Incorporate some noise for fun :)
        const alpha = noise(FRAME_COUNT) * FADE_BACKGROUND;
        // Also color the background!
        // Some blend mode allow you to see the changing background color
        // better than others.
        colorMode(HSB, 360, 100, 100, 100);
        const hue = map(cos(FRAME_COUNT / 36), -1, 1, 0, 360);
        background(hue, 100, 100, alpha);
        // Reset to the default. It may be modified below.
        blendMode(BLEND);
    } else if (frameCount % FRAME_CAPTURE_RATE != 0) {
        return;
    }

    blendMode(blendModeName(BLEND_MODE));

    if (DO_EMPTY_BUFFER) {
        imageBuffer = [];
    }

    // Push a new image to the front of the buffer if we're not paused.
    if (!HOLD_PHOTOS) {
        let newImage = captureImage(
            PIXELATION_ENABLED,
            PIXELATION_DENSITY,
            BW_CLAMPING,
            {
                invert: FILTER_INVERT_ENABLED,
                posterize: FILTER_POSTERIZE_ENABLED,
                blurAmount: FILTER_BLUR_AMOUNT,
                erode: FILTER_ERODE_ENABLED,
                dilate: FILTER_DILATE_ENABLED,
            });
        imageBuffer.unshift(newImage);
    }

    // Regardless of whether we're "holding photos" (pausing adding new images), let the older images decay.
    while (imageBuffer.length > MAX_BUFFER_SIZE) {
        imageBuffer.pop();
    }

    const NUM_IMAGES = imageBuffer.length;
    const USE_RGB = !USE_HSB;
    for (let i = 0; i < NUM_IMAGES; i++) {
        if (ROTATION_SPEED) {
            const indexFactor = map(i, 0, NUM_IMAGES - 1, 0, TWO_PI, WITHIN_BOUNDS);
            const speedFactor = map(sin(FRAME_COUNT / (MAX_ROTATION_SPEED - ROTATION_SPEED + 60)), -1, 1, 0, TWO_PI, WITHIN_BOUNDS);
            const rot = map(indexFactor + speedFactor + ROTATION_OFFSET, 0, TWO_PI + TWO_PI + PI / 2, 0, TWO_PI, WITHIN_BOUNDS);
            rotate(rot);
        } else {
            rotate(0);
        }

        const opacity = calculateOpacity(i, NUM_IMAGES, USE_HSB);

        if (USE_HSB && TINT_IMAGES) {
            colorMode(HSB, 360, 100, 100, 100);
            const tintColor = calculateHsbColor(
                i,
                NUM_IMAGES,
                FRAME_COUNT,
                SATURATION,
                COLOR_CHANGE_SPEED,
                HUE_SECTOR_ANGLE,
                HUE_SECTOR_WIDTH,
            );
            tint(tintColor.h, tintColor.s, tintColor.b, opacity);
        } else if (USE_RGB && TINT_IMAGES) {
            colorMode(RGB, 255, 255, 255, 255);
            const tintColor = calculateRgbColor(
                i,
                NUM_IMAGES,
                FRAME_COUNT,
                COLOR_CHANGE_SPEED,
            );
            tint(tintColor.r, tintColor.g, tintColor.b, opacity);
        } else {
            colorMode(HSB, 360, 100, 100, 100);
            tint(100, opacity);
        }

        const img = imageBuffer[i];
        const offsets = calculateImageOffsets(WOBBLE_ENABLED, i, FRAME_COUNT, WOBBLE_X, WOBBLE_Y);
        const xOffset = offsets.x;
        const yOffset = offsets.y;
        const shrinkOffset = map(i, 0, NUM_IMAGES, MIN_SHRINK_PERCENTAGE, MAX_SHRINK_PERCENTAGE, WITHIN_BOUNDS);
        const imageWidth = (cam.width * (shrinkOffset / 100.0)) * CAMERA_SCALE;
        const imageHeight = (cam.height * (shrinkOffset / 100.0)) * CAMERA_SCALE;

        // Lissajous curve: https://en.m.wikipedia.org/wiki/Lissajous_curve.
        let ljOffsetX = 0;
        let ljOffsetY = 0;
        if (LISSAJOUS_ENABLED) {
            ljOffsetX = LISSAJOUS_CONSTANT_BIG_A * sin(LISSAJOUS_CONSTANT_LIL_A * (FRAME_COUNT / LISSAJOUS_TIME_DILATION) + LISSAJOUS_CONSTANT_DELTA);
            ljOffsetY = LISSAJOUS_CONSTANT_BIG_B * sin(LISSAJOUS_CONSTANT_LIL_B * (FRAME_COUNT / LISSAJOUS_TIME_DILATION));
        }

        const imageX = (width / 2) + xOffset + ljOffsetX;
        const imageY = (height / 2) + yOffset + ljOffsetY;

        imageMode(CENTER);

        // TODO: We probably don't need margin AND padding.
        if (DUPLICATE_MODE == DUPLICATE_MODES.TILES) {
            const dupeScalar = DUPLICATE_SCALE_FACTOR;
            for (let x = 0; x < DUPLICATE_ROWS; x++) {
                for (let y = 0; y < DUPLICATE_COLS; y++) {
                    // Shout out to Patt Vira: https://www.youtube.com/watch?v=iUOmjiA0FiY.
                    const scaledWidth = imageWidth / dupeScalar;
                    const scaledHeight = imageHeight / dupeScalar;
                    const dupeX = (x * (scaledWidth + DUPLICATE_MARGIN + DUPLICATE_PADDING)) +
                        (width - (scaledWidth + DUPLICATE_MARGIN + DUPLICATE_PADDING) * DUPLICATE_COLS) / 2 + xOffset + ljOffsetX +
                        (scaledWidth / 2) + DUPLICATE_MARGIN - DUPLICATE_PADDING;
                    const dupeY = (y * (scaledHeight + DUPLICATE_MARGIN + DUPLICATE_PADDING)) +
                        (height - (scaledHeight + DUPLICATE_MARGIN + DUPLICATE_PADDING) * DUPLICATE_ROWS) / 2 + yOffset + ljOffsetY +
                        (scaledHeight / 2) + DUPLICATE_MARGIN - DUPLICATE_PADDING;

                    image(img, dupeX, dupeY, (imageWidth - DUPLICATE_MARGIN - DUPLICATE_PADDING) / dupeScalar, (imageHeight - DUPLICATE_MARGIN - DUPLICATE_PADDING) / dupeScalar);
                }
            }
        } else if (DUPLICATE_MODE == DUPLICATE_MODES.PANES) {
            // Avoid div-by-zero. We also only wobble in the vertical direction.
            const nonZeroWobbleY = WOBBLE_Y || 0.001;
            for (let dupe = 1; dupe < DUPLICATE_AMOUNT; dupe++) {
                const dupeWobble = map(
                    cos(FRAME_COUNT * dupe / nonZeroWobbleY),
                    -1, 1,
                    -height / 20, height / 20
                );
                image(img,
                    imageX + (dupe * DUPLICATE_OFFSET_X),
                    imageY + (dupe * DUPLICATE_OFFSET_Y) + dupeWobble,
                    imageWidth,
                    imageHeight);
            }
        }

        // Draw the main image.
        image(img, imageX, imageY, imageWidth, imageHeight);
    }
}

// For future investigation:
// fade background amnt 9
// fade background mode 11 - rainbow changing background

function captureImage(pixelationEnabled, pixelationDensity, bwClamingAmount, filters) {
    let newImage = cam.get(0, 0, CAMERA_DIMS.width, CAMERA_DIMS.height);

    // Apply filters on image capture instead of image drawing to improve
    // performance (no need to copy the image).

    if (bwClamingAmount < 100) {
        newImage.filter(THRESHOLD, 1.0 - bwClamingAmount / 100.0);
    }

    if (filters.posterize) {
        newImage.filter(POSTERIZE);
    }

    if (filters.erode) {
        newImage.filter(ERODE);
    }

    if (filters.dilate) {
        newImage.filter(DILATE);
    }

    if (filters.invert) {
        newImage.filter(INVERT);
    }

    if (filters.blurAmount) {
        newImage.filter(BLUR, filter.blurAmount);
    }

    // We need the `enabled` control so that background images are persisted.
    // Setting `pixelDensity` regardless will unfortunately clear the background.
    if (pixelationEnabled && pixelationDensity > 0) {
        noSmooth();
        pixelDensity(pixelationDensity);
    }

    return newImage;
}

function calculateOpacity(imageIndex, numImages, useHsb) {
    // Lower index => more recent image => higher opacity.

    const MAX_OPACITY_PERCENTAGE = 99;
    const MIN_OPACITY_PERCENTAGE = 1;

    // Some number within [10, 90].
    const mappedPercentage = map(
        imageIndex,
        0, numImages,
        MIN_OPACITY_PERCENTAGE, MAX_OPACITY_PERCENTAGE,
        WITHIN_BOUNDS
    );

    const indexAdjustedPercentage = MAX_OPACITY_PERCENTAGE - mappedPercentage;
    const MODE_MAX_OPACITY = useHsb ? 100 : 255;
    return map(indexAdjustedPercentage, 0, 100, 0, MODE_MAX_OPACITY, WITHIN_BOUNDS);
}

function calculateHsbColor(
    imageIndex,
    numImages,
    frameCount,
    saturation,
    colorChangeSpeed,
    hueSectorAngle,
    hueSectorWidth,
) {
    const speed = MAX_COLOR_CHANGE_SPEED + 1 - colorChangeSpeed; // +1 to avoid div by 0.
    const frameCountFactor = map(sin(frameCount / speed), -1, 1, 0, numImages, WITHIN_BOUNDS);

    const minHue = 0;
    const maxHue = hueSectorWidth || 360;
    const hueWithoutOffset = map((imageIndex + frameCountFactor) % numImages, 0, numImages - 1, minHue, maxHue, WITHIN_BOUNDS);
    let angleOffset = 0;
    // If the width is positive, then allow the angle to be set.
    if (hueSectorWidth) {
        angleOffset = hueSectorAngle;
    }
    // Since the angle offset bisects the sector defined by the width, move the chosen angle
    // by the offset, but also adjust the offset so that it bisects that sector.
    const hue = positiveMod(hueWithoutOffset + (angleOffset - hueSectorWidth / 2), 360);

    return {
        h: hue,
        s: saturation,
        b: 100000, // Might this SUPER bright!
    }
}

function calculateRgbColor(
    imageIndex,
    numImages,
    frameCount,
    colorChangeSpeed,
) {
    return {
        // The following is just some "fun with math".
        // I personally like HSB mode better than this RGB stuff.
        r: map(numImages - imageIndex, 0, numImages, (255 / 4) * (frameCount / colorChangeSpeed), FULL_COLOR, WITHIN_BOUNDS),
        g: map(imageIndex, 0, numImages, 100, FULL_COLOR, WITHIN_BOUNDS),
        b: map(sin(frameCount / colorChangeSpeed), -1, 1, 100, FULL_COLOR, WITHIN_BOUNDS),
    };
}

// https://stackoverflow.com/a/17323608
function positiveMod(a, m) {
    return ((a % m) + m) % m;
}

function calculateImageOffsets(doWobble, imageIndex, frameCount, wobbleX, wobbleY) {
    if (!doWobble) {
        return { x: 0, y: 0 };
    }

    const nonZeroX = wobbleX || 0.001;
    const nonZeroY = wobbleY || 0.001;

    return {
        x: imageIndex * sin(frameCount / nonZeroX),
        y: imageIndex * cos(frameCount / nonZeroY),
    }
}

function blendModeName(blendModeNumber) {
    console.assert(NUM_BLEND_MODES == BLEND_MODES.length, `expected ${NUM_BLEND_MODES} to be ${BLEND_MODES.length}`);
    const index = blendModeNumber < BLEND_MODES.length ? blendModeNumber : BLEND;
    return BLEND_MODES[index];
}

function keyPressed() {
    switch (key) {
        case 'r': {
            // TODO: This might not work well with the control window setup now.
            // Since the control uses values based on canvas size for min/max.
            print('resizing');
            resizeCanvas(windowWidth, windowHeight);
            return;
        }
        case 's': {
            print('saving canvas');
            saveCanvas(`canvas-${Date.now()}.png`);
            return;
        }
    }
}
