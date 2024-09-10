'use strict';

/* GLOBAL SETTINGS */

const CAMERA_OPTS = {
    flipped: true, // More natural for humans...
};
// It works on my computer...
const CAMERA_DIMS = {
    width: 640,
    height: 480,
};
const FULL_COLOR = 255;
const MAX_OPACITY = 255 * 0.999; // Just below _full_ opacity so things are actually visible behind.
const WITHIN_BOUNDS = true; // For better readability in `map` calls.
const DUPLICATE_MODES = {
    OFF: 0,
    PANES: 1,
    TILES: 2,
};
const MAX_COLOR_CHANGE_SPEED = 180;
const MAX_ROTATION_SPEED = 20;
const TWO_PI = Math.PI * 2.0;
const NUM_BLEND_MODES = 15;

/* KEYS FOR CONTROL NAMES */

const BLEND_MODE = 'BLEND_MODE';
const BW_CLAMPING = 'BW_CLAMPING';
const CAMERA_SCALE = 'CAMERA_SCALE';
const COLOR_CHANGE_SPEED = 'COLOR_CHANGE_SPEED';
const DO_EMPTY_BUFFER = 'DO_EMPTY_BUFFER';
const DUPLICATE_AMOUNT = 'DUPLICATE_AMOUNT';
const DUPLICATE_COLS = 'DUPLICATE_COLS';
const DUPLICATE_MARGIN = 'DUPLICATE_MARGIN';
const DUPLICATE_MODE = 'DUPLICATE_MODE';
const DUPLICATE_OFFSET_X = 'DUPLICATE_OFFSET_X';
const DUPLICATE_OFFSET_Y = 'DUPLICATE_OFFSET_Y';
const DUPLICATE_PADDING = 'DUPLICATE_PADDING';
const DUPLICATE_ROWS = 'DUPLICATE_ROWS';
const DUPLICATE_SCALE_FACTOR = 'DUPLICATE_SCALE_FACTOR';
const FADE_BACKGROUND = 'FADE_BACKGROUND';
const FADE_BLEND_MODE = 'FADE_BLEND_MODE';
const FILTER_BLUR_AMOUNT = 'FILTER_BLUR_AMOUNT';
const FILTER_DILATE_ENABLED = 'FILTER_DILATE_ENABLED';
const FILTER_ERODE_ENABLED = 'FILTER_ERODE_ENABLED';
const FILTER_INVERT_ENABLED = 'FILTER_INVERT_ENABLED';
const FILTER_POSTERIZE_ENABLED = 'FILTER_POSTERIZE_ENABLED';
const FRAME_CAPTURE_RATE = 'FRAME_CAPTURE_RATE';
const HOLD_PHOTOS = 'HOLD_PHOTOS';
const HUE_SECTOR_ANGLE = 'HUE_SECTOR_ANGLE';
const HUE_SECTOR_WIDTH = 'HUE_SECTOR_WIDTH';
const LISSAJOUS_CONSTANT_BIG_A = 'LISSAJOUS_CONSTANT_BIG_A';
const LISSAJOUS_CONSTANT_BIG_B = 'LISSAJOUS_CONSTANT_BIG_B';
const LISSAJOUS_CONSTANT_DELTA = 'LISSAJOUS_CONSTANT_DELTA';
const LISSAJOUS_CONSTANT_LIL_A = 'LISSAJOUS_CONSTANT_LIL_A';
const LISSAJOUS_CONSTANT_LIL_B = 'LISSAJOUS_CONSTANT_LIL_B';
const LISSAJOUS_ENABLED = 'LISSAJOUS_ENABLED';
const LISSAJOUS_TIME_DILATION = 'LISSAJOUS_TIME_DILATION';
const MAX_BUFFER_SIZE = 'MAX_BUFFER_SIZE';
const MAX_SHRINK_PERCENTAGE = 'MAX_SHRINK_PERCENTAGE';
const MIN_SHRINK_PERCENTAGE = 'MIN_SHRINK_PERCENTAGE';
const PIXELATION_DENSITY = 'PIXELATION_DENSITY';
const PIXELATION_ENABLED = 'PIXELATION_ENABLED';
const REDRAW_BACKGROUND = 'REDRAW_BACKGROUND';
const ROTATION_OFFSET = 'ROTATION_OFFSET';
const ROTATION_SPEED = 'ROTATION_SPEED';
const SATURATION = 'SATURATION';
const TINT_IMAGES = 'TINT_IMAGES';
const USE_HSB = 'USE_HSB';
const WOBBLE_ENABLED = 'WOBBLE_ENABLED';
const WOBBLE_X = 'WOBBLE_X';
const WOBBLE_Y = 'WOBBLE_Y';

/* THE MAIN CONTROL CONFIGURATION */

/** Returns the control configuration. We use a function here so that we can delay usage of p5 constants. */
function getControlConfiguration(
    {
        windowWidth,
        windowHeight,
        canvasWidth,
        canvasHeight,
        camWidth,
        camHeight,
    }
) {
    const CONTROLS = [{
        name: REDRAW_BACKGROUND,
        label: 'Redraw Background',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: FRAME_CAPTURE_RATE,
        label: 'Frame Capture (Attack) Rate',
        min: 1, max: 20, value: 1, step: 1,
    }, {
        name: MAX_BUFFER_SIZE,
        label: 'Max Image Buffer Size',
        min: 1, max: 50, value: 15, step: 1,
    }, {
        name: MAX_SHRINK_PERCENTAGE,
        label: 'Max Image Shrink Factor (%)',
        min: 1, max: 100, value: 100, step: 1,
    }, {
        name: TINT_IMAGES,
        label: 'Tint Images',
        min: 0, max: 1, value: 1, step: 1,
    }, {
        name: USE_HSB,
        label: 'Use HSB/HSV Colorspace',
        min: 0, max: 1, value: 1, step: 1,
        disabled: false,
    }, {
        name: WOBBLE_ENABLED,
        label: 'Wobble Images',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: PIXELATION_ENABLED,
        label: 'Pixelation Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: PIXELATION_DENSITY,
        label: 'Pixelation Density',
        min: 0.01, max: 5.00, value: 3, step: 0.01,
    }, {
        name: MIN_SHRINK_PERCENTAGE,
        label: 'Min Image Shrink Factor (%)',
        min: 20, max: 100, value: 95, step: 1,
    }, {
        name: BW_CLAMPING,
        label: 'Black/White Clamping (%)',
        min: 0, max: 100, value: 100, step: 1,
    }, {
        name: FILTER_INVERT_ENABLED,
        label: 'Invert Image',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: DO_EMPTY_BUFFER,
        label: 'Empty Buffer',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: SATURATION,
        label: 'Saturation',
        min: 0, max: 100, value: 100, step: 1,
    }, {
        name: COLOR_CHANGE_SPEED,
        label: 'Color Change Speed',
        min: 1, max: MAX_COLOR_CHANGE_SPEED, value: 155, step: 1,
    }, {
        name: WOBBLE_X,
        label: 'Horizontal Wobble',
        min: -10, max: 10, value: -10, step: 0.1,
    }, {
        name: WOBBLE_Y,
        label: 'Vertical Wobble',
        min: -10, max: 10, value: -10, step: 0.1,
    }, {
        name: LISSAJOUS_ENABLED,
        label: 'Lissajous Curve Tracing: Engaged',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: LISSAJOUS_CONSTANT_BIG_A,
        label: 'Lissajous Constant `A`',
        min: -windowWidth, max: windowWidth, value: 0, step: 0.1,
    }, {
        name: LISSAJOUS_CONSTANT_LIL_A,
        label: 'Lissajous Constant `a`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: LISSAJOUS_CONSTANT_BIG_B,
        label: 'Lissajous Constant `B`',
        min: -windowHeight, max: windowHeight, value: 0, step: 0.1,
    }, {
        name: LISSAJOUS_CONSTANT_LIL_B,
        label: 'Lissajous Constant `b`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: LISSAJOUS_CONSTANT_DELTA,
        label: 'Lissajous Constant `d`',
        min: 0, max: TWO_PI, value: 0, step: 0.1,
    }, {
        name: LISSAJOUS_TIME_DILATION,
        label: 'Lissajous Time Dilation',
        min: 1, max: 180, value: 60, step: 1,
    }, {
        name: BLEND_MODE,
        label: 'Blend Mode',
        min: 0, max: NUM_BLEND_MODES - 1, value: 0, step: 1,
    }, {
        name: FILTER_POSTERIZE_ENABLED,
        label: 'Posterize Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: FILTER_BLUR_AMOUNT,
        label: 'Blur Amount',
        min: 0, max: 8, value: 0, step: 0.1,
    }, {
        name: FILTER_ERODE_ENABLED,
        label: 'Erode Enabled',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: FILTER_DILATE_ENABLED,
        label: 'Dilate Enabled',
        min: 0, max: 1, value: 0, step: 1,
    },
    {
        // Constrains the tinting to a certain HSB hue sector.
        name: HUE_SECTOR_WIDTH,
        label: 'Hue Sector Width (Degrees)',
        min: 0, max: 359, value: 0, step: 0.01,
    }, {
        name: HUE_SECTOR_ANGLE,
        label: 'Hue Sector Angle (Degrees)',
        min: 0, max: 359, value: 0, step: 0.01,
    }, {
        name: HOLD_PHOTOS,
        label: 'Hold Photo Buffer',
        min: 0, max: 1, value: 0, step: 1,
    }, {
        name: DUPLICATE_AMOUNT,
        label: 'Duplicate Amount',
        min: 0, max: 16, value: 0, step: 1,
    }, {
        name: DUPLICATE_OFFSET_X,
        label: 'Duplicate Offset X',
        min: -camWidth / 2, max: camWidth / 2, value: 0, step: 0.1,
    }, {
        name: DUPLICATE_OFFSET_Y,
        label: 'Duplicate Offset Y',
        min: camHeight / 2, max: camHeight / 2, value: 0, step: 0.1,
    }, {
        name: DUPLICATE_PADDING,
        label: 'Duplicate Padding',
        min: 0, max: Math.min(canvasWidth, canvasHeight) / 16, value: 15, step: 0.1,
    }, {
        name: DUPLICATE_MARGIN,
        label: 'Duplicate Margin',
        min: 0, max: Math.min(canvasWidth, canvasHeight) / 8, value: 50, step: 0.1,
    }, {
        name: DUPLICATE_ROWS,
        label: 'Duplicate Rows',
        min: 0, max: 10, value: 2, step: 1,
    }, {
        name: DUPLICATE_COLS,
        label: 'Duplicate Columns',
        min: 0, max: 10, value: 2, step: 1,
    }, {
        name: DUPLICATE_SCALE_FACTOR,
        label: 'Duplicate Scale Factor',
        min: 1, max: 8, value: 1, step: 0.1,
    }, {
        name: DUPLICATE_MODE,
        label: 'Duplicate Mode',
        min: 0, max: 2, value: 0, step: 1,
    }, {
        name: CAMERA_SCALE,
        label: 'Camera Scale',
        min: 0.25, max: 5, value: 1, step: 0.01,
    }, {
        name: ROTATION_OFFSET,
        label: 'Rotation Offset',
        min: -1.6, max: 1.6, value: 0, step: 0.1,
    }, {
        name: ROTATION_SPEED,
        label: 'Rotation Speed',
        min: 0, max: MAX_ROTATION_SPEED, value: 0, step: 1,
    }, {
        name: FADE_BACKGROUND,
        label: 'Fade Background Amount',
        min: 0, max: 15, value: 0, step: 1,
    }, {
        name: FADE_BLEND_MODE,
        label: 'Fade Background Blend Mode',
        min: 0, max: NUM_BLEND_MODES - 1,
        value: /* BURN */ 14, step: 1,
    }];

    return CONTROLS;
}