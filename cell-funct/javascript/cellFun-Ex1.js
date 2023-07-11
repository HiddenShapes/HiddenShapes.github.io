// cellFunctor.js Functor between GoF and GoF+2

// The cellFunctor function
function cellFunctor(grid) {
    // Go through each cell in the grid and add 2
    let newGrid = grid.map(row => row.map(cell => cell !== 0 ? 1 : 0));
    // Sabotage!
    // newGrid[3][3] = 1 - newGrid[3][3] + 4
    return newGrid
}

export {cellFunctor};
