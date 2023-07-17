def generate_code(character, width, height, path1, path2, path3, size1, size2):
    # Format the HTML
    html = f"""
<div class="canvasContainer" id="{character}CanvasContainer">
<div class="canvas-wrapper" id="wrapper4">
<canvas id="{character}Canvas4" width="200" height="200"></canvas>
</div>
<div class="canvas-wrapper" id="wrapper1">
<canvas id="{character}Canvas1" width="200" height="200"></canvas>
</div>
<div class="canvas-wrapper" id="wrapper5">
<canvas id="{character}Canvas5" width="200" height="200"></canvas>
</div>
<div class="canvas-wrapper" id="wrapper3">
<div class="overlay-container">
<canvas id="{character}Canvas3" width="200" height="200"></canvas>
<canvas id="{character}Canvas2" width="200" height="200"></canvas>
</div>
</div>
</div>
<div class="buttonContainer">
<button class="playButton" id="{character}PlayButton">Play/Pause</button>
</div>
"""

    # Format the script
    script = f"""
import {{initApp}} from './initApp.js';

import {{initialize as {character}Initialize, update as {character}Update1, states as {character}States1}} from '{path1}';
import {{update as {character}Update2, states as {character}States2}} from '{path2}';
import {{cellFunctor as {character}CellFunctor}} from '{path3}';

let width = {width};
let height = {height};

let {character}Grid1 = {{data: {character}Initialize(width, height)}};
let {character}Grid2 = {{data: {character}CellFunctor({character}Grid1.data)}};
let {character}Grid3 = {{data: {character}CellFunctor({character}Grid1.data)}};
let {character}Grid4 = {{data: JSON.parse(JSON.stringify({character}Grid1.data))}};
let {character}Grid5 = {{data: JSON.parse(JSON.stringify({character}Grid2.data))}};

let {character}Grids = [{character}Grid1, {character}Grid2, {character}Grid3, {character}Grid4, {character}Grid5];
let {character}CanvasIds = ["{character}Canvas1", "{character}Canvas2", "{character}Canvas3", "{character}Canvas4", "{character}Canvas5"];
let {character}UpdateFunctions = [{character}Update1, {character}Update2, () => {character}CellFunctor({character}Grid1.data), {character}Update1, {character}Update2];
let {character}CellSizes = [{size1},{size2}]; // Size of a cell in pixels
let {character}PlayButton = "{character}PlayButton"
let {character}CanvasContainer = "{character}CanvasContainer"

window.onload = function() {{
    initApp({character}CanvasIds, {character}PlayButton, {character}CanvasContainer, {character}Grids, {character}UpdateFunctions, {character}CellSizes);
}}
"""
    # Print the HTML and script
    print('#html#\n' + html)
    print('#js#\n' + script)

# Call the function
generate_code('sup', 40, 40, './GoLM.js', './GoL.js', './cellFun-GoLM-GoL.js', 10, 10)
