let rotationAnimationFrameID = null;
let fadeAnimationFrameID = null;
let pauseTimeoutID = null;

document.addEventListener('DOMContentLoaded', function() {
    function rotateAndMoveImage() {
        const img = document.getElementById('rotating-img');
        const fadingImg = document.getElementById('fading-img');
        let angle = 90;
        let moveDistanceY = 0;
        let moveDistanceX = 0;

        img.style.transform = `rotate(${angle}deg) translateX(${moveDistanceX}px) translateY(${moveDistanceY}px)`;

        function animate(timestamp) {
            angle = (angle - 1) % 360;
            moveDistanceY = ((90 - angle) / 90) * 100;
            moveDistanceX = ((90 - angle) / 90) * -200;
            img.style.transform = `rotate(${angle}deg) translateX(${moveDistanceX}px) translateY(${moveDistanceY}px)`;

            if (angle > 0) {
                rotationAnimationFrameID = requestAnimationFrame(animate);
            } else {
                pauseTimeoutID = setTimeout(() => {
                    fadeIn(fadingImg);
                }, 500);
            }
        }

        function fadeIn(element) {
            let opacity = 0;
            let lastTime = null;

            function fadeStep(timestamp) {
                if (!lastTime) lastTime = timestamp;
                let timeDiff = timestamp - lastTime;
                let increment = 0.00001 * timeDiff; 
                opacity = Math.min(opacity + increment, 1);
                element.style.opacity = opacity;

                if (opacity < 1) {
                    fadeAnimationFrameID = requestAnimationFrame(fadeStep);
                } else {
                    // Move to the next slide after the fade-in is complete
                    Reveal.next();
                }
            }
            fadeAnimationFrameID = requestAnimationFrame(fadeStep);
        }

        setTimeout(animate, 300);
    }
    
    Reveal.addEventListener('slidechanged', function(event) {
        if (event.currentSlide.id === 'rotation-section') {
            rotateAndMoveImage();
        } else {
            if (rotationAnimationFrameID) {
                cancelAnimationFrame(rotationAnimationFrameID);
            }
            if (fadeAnimationFrameID) {
                cancelAnimationFrame(fadeAnimationFrameID);
            }
            if (pauseTimeoutID) {
                clearTimeout(pauseTimeoutID);
            }

            // Reset opacities and other states
            const img = document.getElementById('rotating-img');
            const fadingImg = document.getElementById('fading-img');
            img.style.opacity = '1';
            fadingImg.style.opacity = '0';
            img.style.transform = '';
        }
    });
});
