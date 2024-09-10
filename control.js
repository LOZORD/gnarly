/* Logic for the control panel window. */
'use strict';

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

function getFormData() {
    const formData = {};
    for (const input of form.elements) {
        formData[input.name] = parseFloat(input.value);
    }
    return formData;
}

const channel = new BroadcastChannel('gnarly');

channel.postMessage({
    'date': new Date(),
    'active': true,
});

const btn = document.getElementById('broadcast-button');

btn.addEventListener('click', () => {
    channel.postMessage({
        'control': getFormData(),
        'date': new Date(),
    });
});

form.oninput = (event) => {
    event.preventDefault();
    channel.postMessage({
        'control': getFormData(),
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