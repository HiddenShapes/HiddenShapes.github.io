import {colors} from './colors.js';

export function drawAndEvolve(grids, canvasContexts, updateFunctions, cellSizes, state) {
    // clear previous timeout
    clearTimeout(state.timeoutId);
    for (let i = 0; i < grids.length; i++) {
        let grid = grids[i];
        let ctx = canvasContexts[i];
        let canvas = ctx.canvas;
        let updateFunction = updateFunctions[i];
        let currentCellSize = i === 0 || i === 3 ? cellSizes[0] : cellSizes[1]; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < grid.data.length; i++) {
            for (let j = 0; j < grid.data[0].length; j++) {
                ctx.fillStyle = colors[grid.data[i][j]];
                ctx.fillRect(j * currentCellSize, i * currentCellSize, currentCellSize, currentCellSize);
            }
        }

        if (state.isPlaying || state.notInitialized) {
            if (i !== 2) { // For grids other than grid3
                let newGrid = new Array(grid.data.length);
                for (let i = 0; i < grid.data.length; i++) {
                    newGrid[i] = new Array(grid.data[0].length);
                    for (let j = 0; j < grid.data[0].length; j++) {
                        newGrid[i][j] = updateFunction(grid.data, i, j);
                    }
                }
                grid.data = newGrid;
            } else { // For grid3
                grid.data = updateFunction(); // Apply the custom update function
            }
            state.notInitialized = Math.max(0, state.notInitialized - 1);
        }
    }

    let updateSpeed = 300;
    if (state.isPlaying) {
        state.timeoutId = setTimeout(() => drawAndEvolve(grids, canvasContexts, updateFunctions, cellSizes, state), updateSpeed);
    }
    else {
        state.timeoutId = setTimeout(() => drawAndEvolve(grids, canvasContexts, updateFunctions, cellSizes, state), 300);
    }
}