// Cell product over 0

import {initialize as initialize1, update as update1, states as states1} from './GoL.js';
import {initialize as initialize2, update as update2, states as states2} from './GoLM.js';

//const {initialize: initialize1, update: update1, states: states1} = require('./GoLM.js');
//const {initialize: initialize2, update: update2, states: states2} = require('./GoL.js');

let num_states = (states1.length-1)*(states2.length-1)+1;
let states = Array.from(Array(num_states).keys());

function convertFromProduct(pair){
    let n = states1.indexOf(pair[0])
    let m = states2.indexOf(pair[1])
    if (n == 0 || m == 0) {
        return 0
    }
    else return (n - 1) * (states2.length - 1) + m;
}

function convertToProduct(a){
    if (a==0) {
        return [0,0]
    }
    else {
        let n = Math.floor((a-1) / (states2.length-1)) + 1;
        let m = (a-1) % (states2.length-1) +1
        return [states1[n],states2[m]];
    }
}

// Function to initialize the grid
function initialize(width, height) {
    let grid = new Array(height);
    for (let i = 0; i < height; i++) {
        grid[i] = new Array(width);
        for (let j = 0; j < width; j++) {
        if (Math.random() < 0.5) {
            grid[i][j] = states[0];
        } else {
            let random_state = Math.floor(Math.random() * (num_states - 1)) + 1;
            grid[i][j] = states[random_state];
        }   
        //grid[i][j] = states[Math.floor(Math.random() * states.length)];  // Assigns a random state
        }
    }
    return grid;
}


// Function to get the next state of a cell
function update(grid, i, j) {
    let pairArray = grid.map(row => row.map(value => convertToProduct(value)));
    let aArray = pairArray.map(row => row.map(pair => pair[0]));
    let bArray = pairArray.map(row => row.map(pair => pair[1]));
    let aValue = update1(aArray,i,j)
    let bValue = update2(bArray,i,j)
    return convertFromProduct([aValue,bValue])
}

export {initialize, update, states};

