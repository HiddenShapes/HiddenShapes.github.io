// cellFunctor.js Functor between GoF and zoomGoL.js

function getMajorityEntry(matrix) {
    const n = matrix.length / 3;
    let result = Array(n).fill(0).map(() => Array(n).fill(0));

    for(let i = 0; i < n; i++) {
        for(let j = 0; j < n; j++) {
            let counter = {0: 0, 1: 0};
            
            for(let x = 0; x < 3; x++) {
                for(let y = 0; y < 3; y++) {
                    counter[matrix[i*3 + x][j*3 + y]]++;
                }
            }

            result[i][j] = counter[1] > counter[0] ? 1 : 0;
        }
    }

    return result;
}


function cellFunctor(grid) {
    let newGrid = getMajorityEntry(grid)
    // Sabotage!
    //newGrid[3][3] = 1 - newGrid[3][3]
    return newGrid
}

export {cellFunctor};


let matrix = [
  [1, 1, 0, 0, 0, 1, 1, 1, 0],
  [1, 1, 1, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 0, 0, 0, 1, 1, 1],
  [1, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 1, 0, 0, 1, 0, 1, 1, 1]
];

console.log(getMajorityEntry(matrix));