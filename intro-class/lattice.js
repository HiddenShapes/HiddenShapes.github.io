// Get all elements with the class name "latticeCanvas"
let canvases = document.getElementsByClassName('latticeCanvas');

// Set the dot size
let dotSize = 6;

// Set the spacing between dots
let spacing = 100;

// Set padding
let padding = 50;

// Set nxm grid
let n = 6;
let m = 10;

// Iterate through all canvases with the class name "latticeCanvas"
for (let canvas of canvases) {
  let context = canvas.getContext('2d');

  // Set the color
  context.fillStyle = 'white';

  // Loop through and draw the dots
  for(let i = 0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      context.beginPath();
      context.arc(i * spacing + padding, j * spacing + padding, dotSize, 0, Math.PI * 2, true);
      context.fill();
    }
  }
}
