'use strict';

class LabelledSlider {
    #container;
    #slider;
    #label;
    #labelContainer;
    #min;
    #max;

    constructor(label, x, y, min, max, value, step, disabled) {
        this.#label = label;
        this.#min = min;
        this.#max = max;

        this.#container = createDiv();
        this.#container.position(x, y);
        this.#container.style('display', 'flex');
        this.#container.style('justify-content', 'space-between');
        this.#container.style('margin', '5px');
        this.#container.style('padding', '5px');
        this.#container.style('background-color', 'black');
        
        this.#slider = createSlider(min, max, value, step || 'auto');
        this.#slider.parent(this.#container);
        this.#slider.style('accent-color', 'grey');
        if (disabled) {
            this.#slider.attribute('disabled', true);
        }
        
        this.#labelContainer = createDiv(label);
        this.#labelContainer.position(this.#slider.x * 2 + this.#slider.width, y);
        this.#labelContainer.parent(this.#container);
        this.#labelContainer.style('background-color', 'black');
        this.#labelContainer.style('color', 'grey');
        // this.#labelContainer.style('color', 'grey');
        this.#labelContainer.style('font-family', 'monospace');
        this.#labelContainer.style('font-size', 16);
        this.#labelContainer.style('left', 0);
        this.#labelContainer.style('position', 'initial');
        // this.#labelContainer.style('veritcal-align', 'middle');

        this.#container.style('width', 'auto');
    }

    draw() {
        const valueSpan = `<span class='slider-value'>${this.#slider.value()}</span>`;
        this.#labelContainer.html(`${this.#label}: ${valueSpan} [${this.#min}, ${this.#max}]`);
    }

    value() {
        return this.#slider.value();
    }

    min() {
        return this.#min;
    }

    max() {
        return this.#max;
    }
}