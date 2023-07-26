let num_states = 2;
let states = Array.from(Array(num_states).keys());

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
	    if (j == 39){
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


function calculateNewState(left, center, right) {
    let pattern = 4*left + 2*center + right;

    switch(pattern) {
        case 7: // 111
        case 4: // 100
        case 0: // 000
            return 0;
        case 6: // 110
        case 5: // 101
        case 3: // 011
        case 2: // 010
        case 1: // 001
            return 1;
    }
}

function update(grid, j, i) {
    let inputArray = grid[j]; 
    let left = i === 0 ? 0 : inputArray[i-1];
    let center = inputArray[i];
    let right = i === inputArray.length - 1 ? 0 : inputArray[i+1];

    return calculateNewState(left, center, right);
}


export {initialize, update, states, calculateNewState}
