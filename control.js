/* Logic for the control panel window. */
'use strict';

// TODO: consider adding some presets to the control panel.

function getFormData(form) {
    const formData = {};
    for (const input of form.elements) {
        formData[input.name] = parseFloat(input.value);
    }
    return formData;
}

class SliderInput {
    #parentForm;
    #labelSpan;
    #inputElement;
    #container;
    #min;
    #max;
    #dataSpan;
    #valueSpan;
    #rangeSpan;

    constructor(parentForm, name, label, min, max, initialValue, step, enabled) {
        this.#max = max;
        this.#min = min;

        if (isNaN(this.#max)) {
            console.error(`${name} produced bad max ${max} min ${min}`);
        }

        this.#parentForm = parentForm;
        this.#container = document.createElement('div');
        this.#container.classList.add('input-container');
        this.#parentForm.appendChild(this.#container);

        this.#labelSpan = document.createElement('span');
        this.#labelSpan.classList.add('label');
        this.#labelSpan.innerText = label;
        this.#container.appendChild(this.#labelSpan);

        this.#inputElement = document.createElement('input');
        this.#inputElement.classList.add('slider');
        this.#inputElement.type = 'range';
        this.#inputElement.name = name;
        this.#inputElement.min = this.#min;
        this.#inputElement.max = this.#max;
        // Set the value _after_ min and max have been set so that it renders
        // with the correct position.
        this.#inputElement.value = initialValue;
        this.#inputElement.step = step;
        this.#inputElement.disabled = !enabled;
        this.#container.appendChild(this.#inputElement);

        this.#dataSpan = document.createElement('span');
        this.#dataSpan.classList.add('data');
        this.#container.appendChild(this.#dataSpan);

        this.#valueSpan = document.createElement('span');
        this.#valueSpan.classList.add('value');
        this.#valueSpan.innerText = initialValue;
        this.#dataSpan.appendChild(this.#valueSpan);

        this.#rangeSpan = document.createElement('span');
        this.#rangeSpan.classList.add('range');
        this.#rangeSpan.innerText = `[${this.#min}, ${this.#max}] @ ${step}`;
        this.#dataSpan.appendChild(this.#rangeSpan);

        this.#inputElement.oninput = () => {
            this.#valueSpan.innerText = this.#inputElement.value;
        };
    }
}

function populateSliders(form, controlConfig) {
    const sliders = [];

    const sortedConfigObjs = controlConfig.sort((a, b) => a.name.localeCompare(b.name));

    for (const config of sortedConfigObjs) {
        sliders.push(
            new SliderInput(form,
                config.name, config.label,
                config.min, config.max,
                config.value, config.step,
                !config.disabled)
        );
    }

    return sliders;
}

function populateForm(form, controlConfig) {
    populateSliders(form, controlConfig);
}

function collectAndSubmitControls(form, channel) {
    channel.postMessage({
        'control': getFormData(form),
        'date': new Date(),
    });
}

const MAX_FRAME_RATE_BUFFER_SIZE = 120;

function main() {
    console.log('hello from control window');

    const params = new URLSearchParams(window.location.search);

    console.log('got params', params);


    const CONTROL_CONFIGURATION = getControlConfiguration({
        windowWidth: +params.get('windowWidth'),
        windowHeight: +params.get('windowHeight'),
        canvasWidth: +params.get('canvasWidth'),
        canvasHeight: +params.get('canvasHeight'),
        camWidth: +params.get('camWidth'),
        camHeight: +params.get('camHeight'),
    });

    console.log('got control configuration?', CONTROL_CONFIGURATION);

    const form = document.getElementById('main-form');

    populateForm(form, CONTROL_CONFIGURATION);

    const channel = new BroadcastChannel('gnarly');

    channel.postMessage({
        'date': new Date(),
        'active': true,
    });

    form.oninput = (event) => {
        event.preventDefault();
        collectAndSubmitControls(form, channel);
    };

    // Send an initial control submission to get things started in the canvas.
    collectAndSubmitControls(form, channel);

    const frameRateBuffer = [];
    const frameRateSpan = document.getElementById('frame-rate-value');

    channel.onmessage = (event) => {
        if ('frameRate' in event.data) {
            frameRateBuffer.push(event.data['frameRate']);
            if (frameRateBuffer.length > MAX_FRAME_RATE_BUFFER_SIZE) {
                frameRateBuffer.shift();
            }

            const averageFrameRate = frameRateBuffer.reduce((prev, curr) => prev + curr, 0) / frameRateBuffer.length;
            frameRateSpan.innerText = `${averageFrameRate.toFixed(2)} FPS`;
        }
    };
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('page is ready', event);
    main();
});