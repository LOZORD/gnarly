'use strict';

class ControlPanel {
    #SHOW_FRAME_RATE = false;

    #frameRateSpan;
    #controls;

    constructor(controlObjects, x = 20, y = 20, yOffset = 25) {
        this.#frameRateSpan = createSpan();
        this.#frameRateSpan.style('background-color', 'indigo');
        this.#frameRateSpan.style('color', 'white');
        this.#frameRateSpan.style('font-family', 'monospace');
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
            this.#frameRateSpan.html(`Frame Rate: ${frameRate()} fps`);
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
}