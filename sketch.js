'use strict';

const CAMERA_OPTS = {
    flipped: false,
};

const CAMERA_DIMS = {
    width: 640,
    height: 480,
};
const FULL_COLOR = 255;
const MAX_OPACITY = 255 * 0.9; // Just below _full_ opacity so things are actually visible behind.
const WITHIN_BOUNDS = true;
// const MIN_SHRINK_PERCENTAGE = 25;
const DUPLICATE_MODES = {
    OFF: 0,
    PANES: 1,
    TILES: 2,
};
const MAX_COLOR_CHANGE_SPEED = 180;

let BLEND_MODES;

let controlPanel;

let cameraRunning = false;

let cam;
let imageBuffer;
let canvas;

// TODO: clean up comments and organize `const`s and `let`s.

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
        disabled: false,
    }, {
        name: 'WOBBLE_ENABLED',
        label: 'Wobble Images',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'PIXELATION_ENABLED',
        label: 'Pixelation Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'PIXELATION_DENSITY',
        label: 'Pixelation Density',
        min: 0.01, max: 5.00, value: 3, step: 0.01,
    }, {
        name: 'MIN_SHRINK_PERCENTAGE',
        label: 'Min Image Shrink Factor (%)',
        min: 20, max: 100, value: 95, step: 1,
    }, {
        name: 'BW_CLAMPING',
        label: 'Black/White Clamping (%)',
        min: 0, max: 100, value: 100, step: 1,
    }, {
        name: 'FILTER_INVERT_ENABLED',
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
        min: 1, max: MAX_COLOR_CHANGE_SPEED, value: 155, step: 1,
    }, {
        name: 'WOBBLE_X',
        label: 'Horizontal Wobble',
        min: -10, max: 10, value: -10, step: 0.1,
    }, {
        name: 'WOBBLE_Y',
        label: 'Vertical Wobble',
        min: -10, max: 10, value: -10, step: 0.1,
    }, {
        name: 'LISSAJOUS_ENABLED',
        label: 'Lissajous Curve Tracing: Engaged',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'LISSAJOUS_CONSTANT_BIG_A',
        label: 'Lissajous Constant `A`',
        min: -windowWidth, max: windowWidth, value: 0, step: 0.1,
    }, {
        name: 'LISSAJOUS_CONSTANT_LIL_A',
        label: 'Lissajous Constant `a`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: 'LISSAJOUS_CONSTANT_BIG_B',
        label: 'Lissajous Constant `B`',
        min: -windowHeight, max: windowHeight, value: 0, step: 0.1,
    }, {
        name: 'LISSAJOUS_CONSTANT_LIL_B',
        label: 'Lissajous Constant `b`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: 'LISSAJOUS_CONSTANT_DELTA',
        label: 'Lissajous Constant `d`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: 'LISSAJOUS_TIME_DILATION',
        label: 'Lissajous Time Dilation',
        min: 1, max: 180, value: 60, step: 1,
    }, {
        name: 'BLEND_MODE',
        label: 'Blend Mode',
        min: 0, max: BLEND_MODES.length - 1, value: 0, step: 1,
    }, {
        name: 'FILTER_POSTERIZE_ENABLED',
        label: 'Posterize Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'FILTER_BLUR_AMOUNT',
        label: 'Blur Amount',
        min: 0, max: 8, value: 0, step: 0.1,
    }, {
        name: 'FILTER_ERODE_ENABLED',
        label: 'Erode Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'FILTER_DILATE_ENABLED',
        label: 'Dilate Enabled',
        min: 0, max: 1, value: 0, step: 1,
    },
    // Constrains the tinting to a certain HSB hue sector.
    {
        name: 'HUE_SECTOR_WIDTH',
        label: 'Hue Sector Width (Degrees)',
        min: 0, max: 180, value: 0, step: 0.1,
    }, {
        name: 'HUE_SECTOR_ANGLE',
        label: 'Hue Sector Angle (Degrees)',
        min: 0, max: 359, value: 0, step: 0.1,
    }, {
        name: 'HOLD_PHOTOS',
        label: 'Hold Photo Buffer',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: 'DUPLICATE_AMOUNT',
        label: 'Duplicate Amount',
        min: 0, max: 16, value: 0, step: 1,
    }, {
        name: 'DUPLICATE_OFFSET_X',
        label: 'Duplicate Offset X',
        min: -cam.width / 2, max: cam.width / 2, value: 0, step: 0.1,
    }, {
        name: 'DUPLICATE_OFFSET_Y',
        label: 'Duplicate Offset Y',
        min: -cam.height / 2, max: cam.height / 2, value: 0, step: 0.1,
    }, {
        name: 'DUPLICATE_PADDING',
        label: 'Duplicate Padding',
        min: 0, max: min(width, height) / 16, value: 15, step: 0.1,
    }, {
        name: 'DUPLICATE_MARGIN',
        label: 'Duplicate Margin',
        min: 0, max: min(width, height) / 8, value: 50, step: 0.1,
    }, {
        name: 'DUPLICATE_ROWS',
        label: 'Duplicate Rows',
        min: 0, max: 10, value: 2, step: 1,
    }, {
        name: 'DUPLICATE_COLS',
        label: 'Duplicate Columns',
        min: 0, max: 10, value: 2, step: 1,
    }, {
        name: 'DUPLICATE_SCALE_FACTOR',
        label: 'Duplicate Scale Factor',
        min: 1, max: 8, value: 1, step: 0.1,
    }, {
        name: 'DUPLICATE_MODE',
        label: 'Duplicate Mode',
        min: 0, max: 2, value: 0, step: 1,
    }, {
        name: 'CAMERA_SCALE',
        label: 'Camera Scale',
        min: 0.25, max: 5, value: 1, step: 0.01,
    }]);

    background(0);
}


function draw() {
    const FRAME_COUNT = frameCount;
    controlPanel.draw();

    if (!cameraRunning) {
        fill('indigo');
        circle(width / 2, height / 2, 10);
        return;
    }

    const panelValueMap = controlPanel.valuesMap();
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
        PIXELATION_ENABLED,
        PIXELATION_DENSITY,
        REDRAW_BACKGROUND,
        SATURATION,
        TINT_IMAGES,
        USE_HSB,
        WOBBLE_ENABLED,
        WOBBLE_X,
        WOBBLE_Y,
    } = Object.fromEntries(panelValueMap);

    // Use `else if` for the capture rate vs REDRAW_BACKGROUND because it will make the
    // image drawing choppy otherwise.
    if (REDRAW_BACKGROUND) {
        background(0);
    } else if (frameCount % FRAME_CAPTURE_RATE != 0) {
        return;
    }

    blendMode(blendModeName(BLEND_MODE));

    if (DO_EMPTY_BUFFER) {
        imageBuffer = [];
    }

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
            // for (let dupe = 0; dupe < DUPLICATE_AMOUNT; dupe++) {
            //     // let dupeX = (dupe * DUPLICATE_PADDING) + xOffset + ljOffsetX;
            //     // let dupeY = (dupe * DUPLICATE_PADDING) + yOffset + ljOffsetY;
            //     image(img, dupeX, dupeY, imageWidth / DUPLICATE_PADDING, imageHeight / DUPLICATE_PADDING);
            // }
            // print(`p: ${DUPLICATE_PADDING}; m: ${DUPLICATE_MARGIN}; tM ${typeof DUPLICATE_MARGIN}; c: ${DUPLICATE_COLS}; r: ${DUPLICATE_ROWS}`);
            // print(`xo ${xOffset}; yo ${yOffset}; lx: ${ljOffsetX}; ly: ${ljOffsetY}`);
            const dupeScalar = DUPLICATE_SCALE_FACTOR;
            for (let x = 0; x < DUPLICATE_ROWS; x++) {
                for (let y = 0; y < DUPLICATE_COLS; y++) {
                    // print(`x: ${x}; y: ${y}`);
                    // imageMode(CORNERS);
                    // const dupeX = ((width - (imageWidth/dupeScalar * DUPLICATE_COLS))/ 2) + x * (imageWidth / dupeScalar) + xOffset + ljOffsetX;
                    // const dupeY = ((height - (imageHeight/dupeScalar * DUPLICATE_ROWS)) / 2) + y * (imageHeight / dupeScalar) + yOffset + ljOffsetY;
                    const scaledWidth = imageWidth / dupeScalar;
                    const scaledHeight = imageHeight / dupeScalar;
                    const dupeX = (x * (scaledWidth + DUPLICATE_MARGIN + DUPLICATE_PADDING)) +
                        (width - (scaledWidth + DUPLICATE_MARGIN + DUPLICATE_PADDING) * DUPLICATE_COLS) / 2 + xOffset + ljOffsetX +
                        (scaledWidth / 2) + DUPLICATE_MARGIN - DUPLICATE_PADDING;
                    const dupeY = (y * (scaledHeight + DUPLICATE_MARGIN + DUPLICATE_PADDING)) +
                        (height - (scaledHeight + DUPLICATE_MARGIN + DUPLICATE_PADDING) * DUPLICATE_ROWS) / 2 + yOffset + ljOffsetY +
                        (scaledHeight / 2) + DUPLICATE_MARGIN - DUPLICATE_PADDING;

                    // print(`image at ${dupeX}, ${dupeY}`);
                    image(img, dupeX, dupeY, (imageWidth - DUPLICATE_MARGIN - DUPLICATE_PADDING) / dupeScalar, (imageHeight - DUPLICATE_MARGIN - DUPLICATE_PADDING) / dupeScalar);
                }
            }
        } else if (DUPLICATE_MODE == DUPLICATE_MODES.PANES) {
            const nonZeroWobbleY = WOBBLE_Y || 0.001;
            for (let dupe = 1; dupe < DUPLICATE_AMOUNT; dupe++) {
                const dupeWobble = map(cos(FRAME_COUNT * dupe / nonZeroWobbleY),
                    -1, 1, -height / 20, height / 20);
                image(img,
                    imageX + (dupe * DUPLICATE_OFFSET_X),
                    imageY + (dupe * DUPLICATE_OFFSET_Y) + dupeWobble,
                    imageWidth,
                    imageHeight);
            }
        }

        image(img, imageX, imageY, imageWidth, imageHeight);
    }
}

function captureImage(pixelationEnabled, pixelationDensity, bwClamingAmount, filters) {
    let newImage = cam.get(0, 0, CAMERA_DIMS.width, CAMERA_DIMS.height);

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
    if (pixelationEnabled && pixelationDensity > 0) {
        noSmooth();
        pixelDensity(pixelationDensity);
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

    let minHue = 0;
    let maxHue = 360;
    if (hueSectorWidth) {
        const a = positiveMod(hueSectorAngle - (hueSectorWidth / 2), 360);
        const b = positiveMod(hueSectorAngle + (hueSectorWidth / 2), 360);
        minHue = min(a, b);
        maxHue = max(a, b);
    }

    return {
        h: map((imageIndex + frameCountFactor) % numImages, 0, numImages, minHue, maxHue, WITHIN_BOUNDS),
        s: saturation,
        b: 1000,
    }
}

function calculateRgbColor(
    imageIndex,
    numImages,
    frameCount,
    colorChangeSpeed,
) {
    return {
        // The following is just some "fun with math". I personally like HSB mode better than this RGB stuff.
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

function keyPressed() {
    switch (key) {
        case 'r': {
            print('resizing');
            // canvas.size(window.innerWidth, window.innerHeight);
            // resizeCanvas(windowWidth, windowHeight);
        }
        case 'c': {
            print('togging visibility');
            controlPanel.toggleVisibility();
        }
        case 's': {
            print('saving pngs');
        }
    }
}

function blendModeName(blendModeNumber) {
    const index = blendModeNumber < BLEND_MODES.length ? blendModeNumber : BLEND;
    return BLEND_MODES[index];
}