// cellularAutomaton.js

import {initialize as initialize1, update as update1, states as states1} from './CA1.js';
import {update as update2, states as states2} from './GoL.js';
import {cellFunctor} from './cellFunctor.js';
import {colors} from './colors.js'; // new import

let width = 50;
let height = 50;

let grid1 = {data: initialize1(width, height)};
let grid2 = {data: cellFunctor(grid1.data)}; // Initial grid of CA2 is obtained by applying cellFunctor to grid1
let grid3 = {data: cellFunctor(grid1.data)};
let grid4 = {data: JSON.parse(JSON.stringify(grid1.data))};
let grid5 = {data: JSON.parse(JSON.stringify(grid2.data))};

let canvas1, ctx1;
let canvas2, ctx2;
let canvas3, ctx3;
let canvas4, ctx4;
let canvas5, ctx5;
let speedSlider, updateSpeed, evolveCheckbox, stepButton;

let cellSize = 6; // Size of a cell in pixels

let notInitialized = 3; 

let grids, canvasContexts, updateFunctions;

let syncPercentageElement; 
let totalCells = grid2.data.length * grid2.data[0].length; // calculate total cells

function computeSyncPercentage() {
    let matchingCells = 0;
    for (let i = 0; i < grid2.data.length; i++) {
        for (let j = 0; j < grid2.data[i].length; j++) {
            if (grid2.data[i][j] === grid3.data[i][j]) {
                matchingCells++;
            }
        }
    }
    let syncPercentage = (matchingCells / totalCells) * 100;
    
    // Change color based on syncPercentage
    if (syncPercentage === 100) {
        syncPercentageElement.style.color = "darkgreen";
    } else {
        syncPercentageElement.style.color = "black";
    }

    return syncPercentage;
}


function drawAndEvolve() {
    for (let i = 0; i < grids.length; i++) {
        let grid = grids[i];
        let ctx = canvasContexts[i];
        let canvas = ctx.canvas;
        let updateFunction = updateFunctions[i];

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < grid.data.length; i++) {
            for (let j = 0; j < grid.data[0].length; j++) {
                ctx.fillStyle = colors[grid.data[i][j]];
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }

        if (evolveCheckbox.checked || notInitialized) {
            if (i !== 2) { // For grids other than grid3
                let newGrid = new Array(height);
                for (let i = 0; i < height; i++) {
                    newGrid[i] = new Array(width);
                    for (let j = 0; j < width; j++) {
                        newGrid[i][j] = updateFunction(grid.data, i, j);
                    }
                }
                grid.data = newGrid;
            } else { // For grid3
                grid.data = updateFunction(); // Apply the custom update function
            }
            notInitialized = Math.max(0, notInitialized - 1);
        }
    }

    updateSpeed = Math.max(10, 1000 - speedSlider.value);
    if (evolveCheckbox.checked) {
	setTimeout(drawAndEvolve, updateSpeed);
    }
    else {
	setTimeout(drawAndEvolve, 300);
    }
    let syncPercentage = computeSyncPercentage();
    syncPercentageElement.textContent = "Synchronization: " + syncPercentage.toFixed(2) + "%";
}

window.onload = function() {
    canvas1 = document.getElementById("canvas1");
    ctx1 = canvas1.getContext("2d");

    canvas2 = document.getElementById("canvas2");
    ctx2 = canvas2.getContext("2d");

    canvas3 = document.getElementById("canvas3");
    ctx3 = canvas3.getContext("2d");

    canvas4 = document.getElementById("canvas4");
    ctx4 = canvas4.getContext("2d");

    canvas5 = document.getElementById("canvas5");
    ctx5 = canvas5.getContext("2d");

    syncPercentageElement = document.getElementById("syncPercentage");
    syncPercentageElement.style.fontWeight = "bold";
    
    speedSlider = document.getElementById("speedSlider");
    evolveCheckbox = document.getElementById("evolveCheckbox");
    evolveCheckbox.checked = false; // ensure checkbox is unchecked when page loads
    stepButton = document.getElementById("stepButton");

    grids = [grid1, grid2, grid3, grid4, grid5];
    canvasContexts = [ctx1, ctx2, ctx3, ctx4, ctx5];
    updateFunctions = [update1, update2, () => cellFunctor(grid1.data), update1, update2];

    drawAndEvolve();

    stepButton.onclick = function() {
        if (!evolveCheckbox.checked) {
            notInitialized = 5;
            drawAndEvolve();
        }
    };
};
