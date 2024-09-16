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
    #dataSpan;
    #valueSpan;
    #rangeSpan;

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
        this.#inputElement.classList.add('slider');
        this.#inputElement.type = 'range';
        this.#inputElement.name = name;
        this.#inputElement.min = this.#min;
        this.#inputElement.max = this.#max;
        this.#inputElement.step = step;
        // Set the value _after_ min, max, and step have been set so that it renders
        // with the correct position.
        this.#inputElement.value = initialValue;
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
            console.log(`input ${name} got input event!`);
            this.#valueSpan.innerText = this.#inputElement.value;
        };

        this.#inputElement.onchange = (event) => {
            event.preventDefault();
            console.log(`input ${name} got change event!`);
            this.#valueSpan.innerText = this.#inputElement.value;
        };
    }
}

class PresetButton {
    #config;
    #container;
    #parentContainer;
    #button;

    constructor(parentContainer, name, config, form) {
        this.#parentContainer = parentContainer;
        this.#config = config;
        this.#container = document.createElement('div');
        this.#container.classList.add('present-button-container');
        this.#parentContainer.appendChild(this.#container);

        this.#button = document.createElement('button');
        this.#button.type = 'button';
        this.#button.setAttribute('form', form.id);
        this.#button.classList.add('present');
        this.#button.textContent = name;
        this.#button.onclick = (event) => {
            event.preventDefault();
            console.log(`button [${name}] clicked`);
            this.applyConfig();
        };
        this.#container.appendChild(this.#button);
    }

    applyConfig() {
        const form = this.#button.form;
        console.log('applyConfig: form', form, this.#config);
        for (const [name, value] of Object.entries(this.#config)) {
            const input = form.querySelector(`[name=${name}]`);
            console.assert(!!input, 'failed to get input with name ', name);
            input.value = value;
            // TODO: This is a hairball hack, we should probably just call a method on the slider object instead.
            // We should add some friendly modifier methods to the SliderInput class, like what was originally in
            // the LabelledSlider class.
            const valueSpan = form.querySelector(`[name=${name}] ~ span.data span.value`);
            valueSpan.innerText = value;
        }
        // TODO: I think only one of these is needed (input most likely).
        form.dispatchEvent(new Event('change'), { bubbles: true });
        form.dispatchEvent(new Event('input'), { bubbles: true });
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
    // TODO: We "discard" the SliderInput objects returned here,
    // but maybe we could do something useful with them?
    populateSliders(form, controlConfig);
}

function populatePresets(presetConfigs, presetParentContainer, form) {
    const presets = [];

    for (const [name, config] of Object.entries(presetConfigs)) {
        presets.push(
            new PresetButton(presetParentContainer, name, config, form)
        );
    }

    return presets;
}

function collectAndSubmitControls(form, channel) {
    channel.postMessage({
        'control': getFormData(form),
        'date': new Date(),
    });
}

function makeDefaultPreset(controlConfiguration) {
    const ret = {};

    for (const config of controlConfiguration) {
        ret[config.name] = config.value;
    }

    return ret;
}

const MAX_FRAME_RATE_BUFFER_SIZE = 120;

function main() {
    console.log('hello from control window');

    const params = new URLSearchParams(window.location.search);

    console.log('got params', params);

    const VARIABLE_DIMENSIONS = {
        windowWidth: +params.get('windowWidth'),
        windowHeight: +params.get('windowHeight'),
        canvasWidth: +params.get('canvasWidth'),
        canvasHeight: +params.get('canvasHeight'),
        camWidth: +params.get('camWidth'),
        camHeight: +params.get('camHeight'),
    }

    const CONTROL_CONFIGURATION = getControlConfiguration(VARIABLE_DIMENSIONS);

    const DEFAULT_PRESET = makeDefaultPreset(CONTROL_CONFIGURATION);
    const presetConfigs = {
        'Default': DEFAULT_PRESET,
        'Plain Video': plainVideoPreset(structuredClone(DEFAULT_PRESET)),
        'Peter Max': peterMaxPreset(structuredClone(DEFAULT_PRESET), VARIABLE_DIMENSIONS),
        'Dark Side': darkSidePreset(structuredClone(DEFAULT_PRESET), VARIABLE_DIMENSIONS),
        'Wave Zone': waveZonePreset(structuredClone(DEFAULT_PRESET), VARIABLE_DIMENSIONS),
        'Motorik': motorikPreset(structuredClone(DEFAULT_PRESET)),
        'Motorik Cyan': motorikCyanPreset(structuredClone(DEFAULT_PRESET)),
        'Echoes': echoesPreset(structuredClone(DEFAULT_PRESET)),
        'Red Sector': redSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Green Sector': greenSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Blue Sector': blueSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Yellow Sector': yellowSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Cyan Sector': cyanSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Magenta Sector': magentaSectorPreset(structuredClone(DEFAULT_PRESET)),
        'Block Print': blockPrintPreset(structuredClone(DEFAULT_PRESET)),
    };

    console.log('got control configuration?', CONTROL_CONFIGURATION);

    const form = document.getElementById('main-form');

    populateForm(form, CONTROL_CONFIGURATION);
    const presetContainer = document.getElementById('preset-container');
    populatePresets(presetConfigs, presetContainer, form);

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
