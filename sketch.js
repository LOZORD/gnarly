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

let BLEND_MODES;

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
        disabled: true,
    }, {
        name: 'WOBBLE_ENABLED',
        label: 'Wobble Images',
        min: 0, max: 1, value: 0, step: 1,
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
        min: 1, max: 180, value: 20, step: 1,
    }, {
        name: 'WOBBLE_X',
        label: 'Horizontal Wobble',
        min: -10, max: 10, value: 0, step: 0.1,
    }, {
        name: 'WOBBLE_Y',
        label: 'Vertical Wobble',
        min: -10, max: 10, value: 0, step: 0.1,
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
        min: 0, max: 8, value: 0, step: null,
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
    }]);
}


function draw() {
    const FRAME_COUNT = frameCount;
    controlPanel.draw();

    if (!cameraRunning) {
        background('indigo');
        return;
    }

    const panelValueMap = controlPanel.valuesMap();
    const {
        BLEND_MODE,
        BW_CLAMPING,
        COLOR_CHANGE_SPEED,
        DO_EMPTY_BUFFER,
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
        PIXELATION_DENSITY_PERCENTAGE,
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
        background(15);
    } else if (frameCount % FRAME_CAPTURE_RATE != 0) {
        return;
    }

    blendMode(blendModeName(BLEND_MODE));

    if (DO_EMPTY_BUFFER) {
        imageBuffer = [];
    }

    if (!HOLD_PHOTOS) {
        // FIXME(ljr): pixel density %.
        let newImage = captureImage(0 & PIXELATION_DENSITY_PERCENTAGE,
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
    for (let i = 0; i < NUM_IMAGES; i++) {
        const opacity = calculateOpacity(i, NUM_IMAGES, USE_HSB);
        const tintColor = calculateColor(i,
            NUM_IMAGES,
            FRAME_COUNT,
            USE_HSB,
            SATURATION,
            COLOR_CHANGE_SPEED,
            HUE_SECTOR_ANGLE,
            HUE_SECTOR_WIDTH,
        );

        if (USE_HSB && TINT_IMAGES) {
            colorMode(HSB, 360, 100, 100, 100);
            tint(tintColor.h, tintColor.s, tintColor.b, opacity);
        } else {
            colorMode(RGB, 255, 255, 255, 255); // FIXME(ljr): Get color calculation for RGB working again.
            tint(tintColor.r, tintColor.g, tintColor.b, opacity);
        }

        const img = imageBuffer[i];
        const offsets = calculateImageOffsets(WOBBLE_ENABLED, i, FRAME_COUNT, WOBBLE_X, WOBBLE_Y);
        const xOffset = offsets.x;
        const yOffset = offsets.y;
        const shrinkOffset = map(i, 0, NUM_IMAGES, MIN_SHRINK_PERCENTAGE, MAX_SHRINK_PERCENTAGE, WITHIN_BOUNDS);
        const imageWidth = cam.width * (shrinkOffset / 100.0) + xOffset;
        const imageHeight = cam.height * (shrinkOffset / 100.0) + yOffset;

        let ljOffsetX = 0;
        let ljOffsetY = 0;
        if (LISSAJOUS_ENABLED) {
            ljOffsetX = LISSAJOUS_CONSTANT_BIG_A * sin(LISSAJOUS_CONSTANT_LIL_A * (FRAME_COUNT / LISSAJOUS_TIME_DILATION) + LISSAJOUS_CONSTANT_DELTA);
            ljOffsetY = LISSAJOUS_CONSTANT_BIG_B * sin(LISSAJOUS_CONSTANT_LIL_B * (FRAME_COUNT / LISSAJOUS_TIME_DILATION));
        }

        const imageX = (width / 2) + xOffset + ljOffsetX;
        const imageY = (height / 2) + yOffset + ljOffsetY;

        imageMode(CENTER);
        image(img, imageX, imageY, imageWidth, imageHeight);
    }
}

function captureImage(pixelationDensityPercentage, bwClamingAmount, filters) {
    let newImage = cam.get(0, 0, CAMERA_DIMS.width, CAMERA_DIMS.height);

    if (bwClamingAmount < 100) {
        // TODO(ljr): Look into more filter types.
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

function calculateColor(
    imageIndex,
    numImages,
    frameCount,
    useHsb,
    saturation,
    colorChangeSpeed,
    hueSectorAngle,
    hueSectorWidth) {
    if (useHsb) {
        const fcFactor = map(sin(frameCount / colorChangeSpeed), -1, 1, 0, numImages / 2);

        let minHue = 0;
        let maxHue = 360;
        if (hueSectorWidth) {
            const a = positiveMod(hueSectorAngle - (hueSectorWidth / 2), 360);
            const b = positiveMod(hueSectorAngle + (hueSectorWidth / 2), 360);
            minHue = min(a, b);
            maxHue = max(a, b);
        }

        return {
            h: map(imageIndex + fcFactor, 0, numImages, minHue, maxHue),
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
    // TODO(ljr): Implement image (png) saving functionality.
    // if (key == 's') {
    //     print('saving!');
    //     saveGif(`video-delay-${new Date().toISOString()}.gif`, 5);
    // }
}

function blendModeName(blendModeNumber) {
    const index = blendModeNumber < BLEND_MODES.length ? blendModeNumber : BLEND;
    return BLEND_MODES[index];
}