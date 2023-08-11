function rotateSVG() {
    const group = document.getElementById('rotating-group');
    let angle = 0;

    // This function will be called on each animation frame
    function animate() {
        // Increment the angle
        angle = (angle + 1) % 360;

        // Apply the rotation to the group element around its center
        group.setAttribute('transform', `rotate(${angle}, 90, 90)`);

        // If the angle is less than 90, request the next animation frame
        if (angle < 90) {
            requestAnimationFrame(animate);
        }
    }

    // Start the animation
    animate();
}

// Start the rotation when the document is fully loaded
document.addEventListener('DOMContentLoaded', rotateSVG);
