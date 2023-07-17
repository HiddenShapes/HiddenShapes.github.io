// cellFunctor.js Functor between GoFM and zoomGoL.js

import {convertBinaryArray} from './zoomGoL.js';

function cellFunctor(grid) {
    let newGrid = grid.map(row => row.map(cell => (cell !== 0) ? 1 : 0));
    return convertBinaryArray(newGrid)
}

export {cellFunctor};
