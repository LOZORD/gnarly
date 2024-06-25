'use strict';

class ControlPanel {
    #SHOW_FRAME_RATE = true;
    #MAX_FRAME_RATE_BUFFER_SIZE = 120;

    #container;
    #frameRateContainer;
    #frameRateSpan;
    #frameRateBuffer;
    #controls;

    #visible;

    constructor(controlObjects, x = 20, y = 20, yOffset = 25) {
        this.#visible = true;
        this.#container = createDiv();
        this.#frameRateContainer = createDiv();
        this.#frameRateContainer.position(x, y);
        this.#frameRateContainer.parent(this.#container);
        this.#frameRateSpan = createSpan();
        this.#frameRateSpan.style('background-color', 'indigo');
        this.#frameRateSpan.style('color', 'white');
        this.#frameRateSpan.style('font-family', 'monospace');
        this.#frameRateSpan.parent(this.#frameRateContainer);
        this.#frameRateBuffer = [];
        this.#controls = new Map();
        let sliderY = y + yOffset; 
        for (let obj of controlObjects.sort((a, b) => a.name.localeCompare(b.name))) {
            const { name, label, min, max, step, value, disabled } = obj;
            const slider = new LabelledSlider(this.#container, label, x, sliderY, min, max, value, step, disabled || false);
            sliderY += yOffset;
            this.#controls.set(name, slider);
        }
    }

    draw() {
        if (!this.#visible) {
            this.#container.style('display', 'none');
        } else {
            this.#container.style('display', 'initial');
        }

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

    toggleVisibility() {
        this.#visible = !this.#visible;
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