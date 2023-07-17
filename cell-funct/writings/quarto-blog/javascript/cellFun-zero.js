//  Functor returns zero

// The cellFunctor function
function cellFunctor(grid) {
    // Go through each cell in the grid and add 2
    let newGrid = grid.map(row => row.map(cell => 0));
    return newGrid
}

export {cellFunctor};
