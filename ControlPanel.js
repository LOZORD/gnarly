'use strict';

class ControlPanel {
    #controls;

    constructor(controlObjects, x = 20, y = 20, yOffset = 25) {
        this.#controls = new Map();
        for (let obj of controlObjects.sort((a, b) => a.name.localeCompare(b.name))) {
            const {name, label, min, max, step, value } = obj;
            const slider = new LabelledSlider(label, x, y, min, max, value, step);
            y += yOffset;
            this.#controls.set(name, slider);
        }
    }

    draw() {
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