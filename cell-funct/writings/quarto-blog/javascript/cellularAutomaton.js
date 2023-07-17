import {initApp} from './initApp.js';

import {initialize as aInitialize, update as aUpdate1, states as aStates1} from './GoLM.js';
import {update as aUpdate2, states as aStates2} from './zoomGoL.js';
import {cellFunctor as aCellFunctor} from './cellFun-GoLM-zoomGoL.js';

import {initialize as bInitialize, update as bUpdate1, states as bStates1} from './GoL.js';
import {update as bUpdate2, states as bStates2} from './zeroCA.js';
import {cellFunctor as bCellFunctor} from './cellFun-zero.js';

import {initialize as cInitialize, update as cUpdate1, states as cStates1} from './GoL.js';
import {update as cUpdate2, states as cStates2} from './GoL.js';
import {cellFunctor as cCellFunctor} from './cellFun-id.js';

import {initialize as supInitialize, update as supUpdate1, states as supStates1} from './GoLM.js';
import {update as supUpdate2, states as supStates2} from './GoL.js';
import {cellFunctor as supCellFunctor} from './cellFun-GoLM-GoL.js';

let width = 40;
let height = 40;

let aGrid1 = {data: aInitialize(width, height)};
let aGrid2 = {data: aCellFunctor(aGrid1.data)};
let aGrid3 = {data: aCellFunctor(aGrid1.data)};
let aGrid4 = {data: JSON.parse(JSON.stringify(aGrid1.data))};
let aGrid5 = {data: JSON.parse(JSON.stringify(aGrid2.data))};

let aGrids = [aGrid1, aGrid2, aGrid3, aGrid4, aGrid5];
let aCanvasIds = ["aCanvas1", "aCanvas2", "aCanvas3", "aCanvas4", "aCanvas5"];
let aUpdateFunctions = [aUpdate1, aUpdate2, () => aCellFunctor(aGrid1.data), aUpdate1, aUpdate2];
let aCellSizes = [5,10]; // Size of a cell in pixels
let aPlayButton = "aPlayButton"
let aCanvasContainer = "aCanvasContainer"

let bGrid1 = {data: bInitialize(width, height)};
let bGrid2 = {data: bCellFunctor(bGrid1.data)};
let bGrid3 = {data: bCellFunctor(bGrid1.data)};
let bGrid4 = {data: JSON.parse(JSON.stringify(bGrid1.data))};
let bGrid5 = {data: JSON.parse(JSON.stringify(bGrid2.data))};

let bGrids = [bGrid1, bGrid2, bGrid3, bGrid4, bGrid5];
let bCanvasIds = ["bCanvas1", "bCanvas2", "bCanvas3", "bCanvas4", "bCanvas5"];
let bUpdateFunctions = [bUpdate1, bUpdate2, () => bCellFunctor(bGrid1.data), bUpdate1, bUpdate2];
let bCellSizes = [5,5]; // Size of a cell in pixels
let bPlayButton = "bPlayButton"
let bCanvasContainer = "bCanvasContainer"

let cGrid1 = {data: cInitialize(width, height)};
let cGrid2 = {data: cCellFunctor(cGrid1.data)};
let cGrid3 = {data: cCellFunctor(cGrid1.data)};
let cGrid4 = {data: JSON.parse(JSON.stringify(cGrid1.data))};
let cGrid5 = {data: JSON.parse(JSON.stringify(cGrid2.data))};

let cGrids = [cGrid1, cGrid2, cGrid3, cGrid4, cGrid5];
let cCanvasIds = ["cCanvas1", "cCanvas2", "cCanvas3", "cCanvas4", "cCanvas5"];
let cUpdateFunctions = [cUpdate1, cUpdate2, () => cCellFunctor(cGrid1.data), cUpdate1, cUpdate2];
let cCellSizes = [5,5]; // Size of a cell in pixels
let cPlayButton = "bPlayButton" // This is *not* a typo 
let cCanvasContainer = "cCanvasContainer"

let supGrid1 = {data: supInitialize(width, height)};
let supGrid2 = {data: supCellFunctor(supGrid1.data)};
let supGrid3 = {data: supCellFunctor(supGrid1.data)};
let supGrid4 = {data: JSON.parse(JSON.stringify(supGrid1.data))};
let supGrid5 = {data: JSON.parse(JSON.stringify(supGrid2.data))};

let supGrids = [supGrid1, supGrid2, supGrid3, supGrid4, supGrid5];
let supCanvasIds = ["supCanvas1", "supCanvas2", "supCanvas3", "supCanvas4", "supCanvas5"];
let supUpdateFunctions = [supUpdate1, supUpdate2, () => supCellFunctor(supGrid1.data), supUpdate1, supUpdate2];
let supCellSizes = [5,5]; // Size of a cell in pixels
let supPlayButton = "supPlayButton"
let supCanvasContainer = "supCanvasContainer"

window.onload = function() {
    initApp(aCanvasIds, aPlayButton, aCanvasContainer, aGrids, aUpdateFunctions, aCellSizes);
    initApp(bCanvasIds, bPlayButton, bCanvasContainer, bGrids, bUpdateFunctions, bCellSizes);
    initApp(cCanvasIds, cPlayButton, cCanvasContainer, cGrids, cUpdateFunctions, cCellSizes);
    initApp(supCanvasIds, supPlayButton, supCanvasContainer, supGrids, supUpdateFunctions, supCellSizes);
}
