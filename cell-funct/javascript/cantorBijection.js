// Cantor's bijection from N^3 to N
function cantorTriple(x, y, z) {
    var pair1 = cantorPair(x, y);
    return cantorPair(pair1, z) + 2;
}

// Cantor's pairing function
function cantorPair(k1, k2) {
    return 0.5 * (k1 + k2) * (k1 + k2 + 1) + k2;
}

// Inverse of Cantor's bijection from N to N^3
function cantorTripleInverse(v) {
    let w = v - 2
    var [pair1, z] = cantorPairInverse(w);
    var [x, y] = cantorPairInverse(pair1);
    return [x, y, z];
}

// Inverse of Cantor's pairing function
function cantorPairInverse(z) {
    var t = Math.floor((-1 + Math.sqrt(1 + 8 * z)) / 2);
    var x = t * (t + 3) / 2 - z;
    var y = z - t * (t + 1) / 2;
    return [x, y];
}


function eightTupleToN(k) {
    let z = cantorPair(k[0], k[1]);
    for(let i = 2; i < 8; i++) {
        z = cantorPair(z, k[i]);
    }
    return z;
}

function nToEightTuple(z) {
    let k = new Array(8).fill(0);
    for(let i = 7; i > 0; i--) {
        let pair = cantorPairInverse(z);
        k[i] = pair[1];
        z = pair[0];
    }
    k[0] = z;
    return k;
}


function Range(n) {
    return [...Array(n).keys()];
}

let _length = 3
let _max = 1

function generateRandomArray() {
    let result = [];

    for(let i = 0; i < _length; i++) {
        let randomInt = Math.floor(Math.random() * (_max+1));
        result.push(randomInt);
    }

    return result;
}

//let _arr = generateRandomArray()
//let _val = cantorTriple(_arr[0],_arr[1],_arr[2])
//console.log(_arr);
//console.log(_val);
//console.log(cantorTripleInverse(_val));

export{cantorTriple, cantorTripleInverse};