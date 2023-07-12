// cellFunctor.js Functor between GoF and zoomGoL.js

import {convertBinaryArray} from './zoomGoL.js';

function cellFunctor(grid) {
    return convertBinaryArray(grid)
}

export {cellFunctor};
