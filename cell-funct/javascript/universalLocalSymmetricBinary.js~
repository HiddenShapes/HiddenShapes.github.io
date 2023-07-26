// Game of Life

let num_states = 8;
let states = Array.from(Array(num_states).keys());

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
	    if (Math.random()<0.7){
		grid[i][j] = 0
	    }
	    else {
		grid[i][j] = 1
	    }
	   grid[i][j] = states[Math.floor(Math.random() * states.length)];  // Assigns a random state
        }
    }
    return grid;
}

// Function to count the alive neighbors of a cell
function countAliveNeighbors(grid, i, j) {
    let count = 0;
    for (let x = Math.max(i-1, 0); x <= Math.min(i+1, grid.length-1); x++) {
        for (let y = Math.max(j-1, 0); y <= Math.min(j+1, grid[0].length-1); y++) {
            count += min(grid[x][y],1);
        }
    }
    count -= grid[i][j]; // Reduce the count by one if the cell itself is alive
    return count;
}

// Function to get the next state of a cell
function update(grid, i, j) {
    let aliveNeighbors = countAliveNeighbors(grid, i, j);
    if (grid[i][j] === 1) {
        if (aliveNeighbors < 2 || aliveNeighbors > 3) {
            return 0;  // The cell dies
        } else {
            return 1;  // The cell stays alive
        }
    } else {
        if (aliveNeighbors === 3) {
            return 1;  // The cell becomes alive
        } else {
            return 0;  // The cell stays dead
        }
    }
}

export {initialize, update, states};
