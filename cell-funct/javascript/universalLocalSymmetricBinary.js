// 1D case
import {cantorTriple} from './cantorBijection.js';

let num_states = 2;
let states = Array.from(Array(num_states).keys());

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
	    if (Math.random() > 0.8){
		grid[i][j] = 1
	    }
	    else {
		grid[i][j] = 0
	    }	    
        //grid[i][j] = states[Math.floor(Math.random() * states.length)];  // Assigns a random state
        }
    }
    return grid;
}

// Function to get the next state of a cell
function update(grid, j, i) {
    let inputArray = grid[j];
    let left = i === 0 ? 0 : inputArray[i-1];
    let center = inputArray[i];
    let right = i === inputArray.length - 1 ? 0 : inputArray[i+1];
    return cantorTriple(left,center, right);
}

export {initialize, update, states};

