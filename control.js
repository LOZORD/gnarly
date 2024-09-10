/* Logic for the control panel window. */
'use strict';

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

    constructor(parentForm, name, label, min, max, initialValue, step, enabled) {
        this.#max = max;
        this.#min = min;

        this.#parentForm = parentForm;
        this.#container = document.createElement('div');
        this.#container.classList.add('input-container');
        this.#parentForm.appendChild(this.#container);

        this.#labelSpan = document.createElement('span');
        this.#labelSpan.classList.add('label');
        this.#labelSpan.innerText = label;
        this.#container.appendChild(this.#labelSpan);

        this.#inputElement = document.createElement('input');
        this.#inputElement.type = 'range';
        this.#inputElement.name = name;
        this.#inputElement.value = initialValue;
        this.#inputElement.min = this.#min;
        this.#inputElement.max = this.#max;
        this.#inputElement.step = step;
        this.#inputElement.disabled = !enabled;
        this.#container.appendChild(this.#inputElement);
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

function main() {
    console.log('hello from control window');

    const params = new URLSearchParams(window.location.search);

    console.log('got params', params);


    const CONTROL_CONFIGURATION = getControlConfiguration(
        +params.get('windowWidth'),
        +params.get('windowHeight'),
        +params.get('camWidth'),
        +params.get('camHeight'),
    );

    console.log('got control configuration?', !!getControlConfiguration());

    const form = document.getElementById('main-form');

    populateForm(form, CONTROL_CONFIGURATION);

    const channel = new BroadcastChannel('gnarly');

    channel.postMessage({
        'date': new Date(),
        'active': true,
    });

    const btn = document.getElementById('broadcast-button');

    btn.addEventListener('click', () => {
        channel.postMessage({
            'control': getFormData(form),
            'date': new Date(),
        });
    });

    form.oninput = (event) => {
        event.preventDefault();
        channel.postMessage({
            'control': getFormData(form),
            'date': new Date(),
        });
    };

    const MAX_FRAME_RATE_BUFFER_SIZE = 120;
    const frameRateBuffer = [];
    const frameRateSpan = document.getElementById('frame-rate-value');

    channel.onmessage = (event) => {
        // console.log(event.data);

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