//  Functor between GoFM and GoF

// The cellFunctor function
function cellFunctor(grid) {
    // Go through each cell in the grid and add 2
    let newGrid = grid.map(row => row.map(cell => (cell !== 0) ? 1 : 0));
    // Sabotage!
    // newGrid[3][3] = 1 - newGrid[3][3]
    return newGrid
}

export {cellFunctor};