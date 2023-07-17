// Zero CA

let num_states = 1;
let states = [0];

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
            grid[i][j] =0;
        }
    }
    return grid;
}

// Function to get the next state of a cell
function update(grid, i, j) {
    return 0
}

export {initialize, update, states};
