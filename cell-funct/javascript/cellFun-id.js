// cellFunctor.js Functor between GoF and zoomGoL.js

function cellFunctor(grid) {
    let newGrid = grid.map(row => row.map(cell => cell));
    // Sabotage!
    newGrid[3][3] = 1 - newGrid[3][3]
    return newGrid
}

export {cellFunctor};