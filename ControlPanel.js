'use strict';

class ControlPanel {
    #SHOW_FRAME_RATE = true;
    #MAX_FRAME_RATE_BUFFER_SIZE = 120;

    #frameRateSpan;
    #frameRateBuffer;
    #controls;

    constructor(controlObjects, x = 20, y = 20, yOffset = 25) {
        this.#frameRateSpan = createSpan();
        this.#frameRateSpan.style('background-color', 'indigo');
        this.#frameRateSpan.style('color', 'white');
        this.#frameRateSpan.style('font-family', 'monospace');
        this.#frameRateBuffer = [];
        this.#controls = new Map();
        for (let obj of controlObjects.sort((a, b) => a.name.localeCompare(b.name))) {
            const { name, label, min, max, step, value, disabled } = obj;
            const slider = new LabelledSlider(label, x, y, min, max, value, step, disabled || false);
            y += yOffset;
            this.#controls.set(name, slider);
        }
    }

    draw() {
        if (this.#SHOW_FRAME_RATE) {
            this.#captureFrameRateAndUpdateSpan();
        }
        this.#controls.forEach(value => value.draw());
    }

    valuesMap() {
        const ret = new Map();
        for (let [k, v] of this.#controls.entries()) {
            ret.set(k, v.value());
        }
        return ret;
    }

    #captureFrameRateAndUpdateSpan() {
        this.#frameRateBuffer.push(frameRate());
        while (this.#frameRateBuffer.length > this.#MAX_FRAME_RATE_BUFFER_SIZE) {
            this.#frameRateBuffer.shift();
        }

        const average = (this.#frameRateBuffer.reduce((acc, val) => acc + (+val.toFixed(2)), 0) /
            this.#frameRateBuffer.length);

        this.#frameRateSpan.html(`Frame Rate: ${average.toFixed(2)} fps`);
    }
}