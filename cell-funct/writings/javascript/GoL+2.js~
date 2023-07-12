// CA2.js Game of Life on [2,3]

let num_states = 2;
let states = [2,3];

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
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
            count += (grid[x][y] === 3) ? 1 : 0;  // Only count if the neighbor is alive (3)
        }
    }
    count -= (grid[i][j] === 3) ? 1 : 0;  // Reduce the count by one if the cell itself is alive
    return count;
}

// Function to get the next state of a cell
function update(grid, i, j) {
    let aliveNeighbors = countAliveNeighbors(grid, i, j);
    if (grid[i][j] === 3) {
        if (aliveNeighbors < 2 || aliveNeighbors > 3) {
            return 2;  // The cell dies
        } else {
            return 3;  // The cell stays alive
        }
    } else {
        if (aliveNeighbors === 3) {
            return 3;  // The cell becomes alive
        } else {
            return 2;  // The cell stays dead
        }
    }
}

export {initialize, update, states};
