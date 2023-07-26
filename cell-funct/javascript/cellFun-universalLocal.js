import {cantorTripleInverse} from './cantorBijection.js';
import {calculateNewState} from './110.js';

function recHistory(n) {
    if (n==0 || n==1) {
        return n;
    }
    else {
        let _arr = cantorTripleInverse(n)
        let a = recHistory(_arr[0])
        let b = recHistory(_arr[1])
        let c = recHistory(_arr[2])  
        return calculateNewState(a,b,c)
    }
}

function cellFunctor(grid) {
    let newGrid = grid.map(row => row.map(cell => recHistory(cell)));
    return newGrid
}

export {cellFunctor};