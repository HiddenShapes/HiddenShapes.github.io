import {drawAndEvolve} from './drawAndEvolve.js';

export function initApp(canvasIds, playButtonId, canvasContainerId, grids, updateFunctions, cellSizes) {
    let canvasContexts = canvasIds.map(id => {
        let canvas = document.getElementById(id);
        return canvas.getContext("2d");
    });

    let playButton = document.getElementById(playButtonId);
    let state = {isPlaying: false, notInitialized: 3, timeoutId: null};

    playButton.addEventListener("click", function() {
	state.isPlaying = !state.isPlaying;
    });

    let canvasContainer = document.getElementById(canvasContainerId);
    canvasContainer.onclick = function() {
        if (!state.isPlaying) {
            state.notInitialized = 5;
            clearTimeout(state.timeoutId);
            drawAndEvolve(grids, canvasContexts, updateFunctions, cellSizes, state);
        }
    };

    drawAndEvolve(grids, canvasContexts, updateFunctions, cellSizes, state);
}
