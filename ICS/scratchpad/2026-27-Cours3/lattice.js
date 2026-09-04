// The integer lattice behind the "Utilisation de modules" slide.
// Canvas ignores CSS, so the dot colour is picked from the current slide theme
// and the grid is redrawn whenever the theme toggle fires its event.

let dotSize = 6;
let spacing = 100;
let padding = 50;

// Set nxm grid
let n = 6;
let m = 10;

function drawLattice() {
  const light = document.documentElement.classList.contains('ics-light');
  const canvases = document.getElementsByClassName('latticeCanvas');

  for (let canvas of canvases) {
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = light ? '#3a4250' : 'white';

    for (let i = 0; i < m; i++) {
      for (let j = 1; j < n; j++) {
        context.beginPath();
        context.arc(i * spacing + padding, j * spacing + padding, dotSize, 0, Math.PI * 2, true);
        context.fill();
      }
    }
  }
}

drawLattice();
document.addEventListener('DOMContentLoaded', drawLattice);
document.addEventListener('ics-theme-change', drawLattice);
