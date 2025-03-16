// Confetti.js
import React, { useEffect } from 'react';

const Confetti = () => {
  useEffect(() => {
    const createConfetti = () => {
      const confettiContainer = document.querySelector('.confetti');
      if (!confettiContainer) return;

      const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590'];
      const shapes = ['circle', 'square', 'triangle'];
      
      // Create 150 confetti pieces
      for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 12 + 5;
        
        confetti.style.position = 'absolute';
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.opacity = Math.random() * 0.8 + 0.2;
        
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        if (shape === 'circle') {
          confetti.style.borderRadius = '50%';
        } else if (shape === 'triangle') {
          confetti.style.width = '0';
          confetti.style.height = '0';
          confetti.style.backgroundColor = 'transparent';
          confetti.style.borderLeft = `${size/2}px solid transparent`;
          confetti.style.borderRight = `${size/2}px solid transparent`;
          confetti.style.borderBottom = `${size}px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
        }
        
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = `${Math.random() * 100}%`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.zIndex = '1';

        // Animation
        const duration = Math.random() * 3 + 3;
        const delay = Math.random() * 2;
        
        confetti.animate(
          [
            { 
              transform: `translate(0, 0) rotate(0deg)`, 
              opacity: 1 
            },
            { 
              transform: `translate(${Math.random() * 200 - 100}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, 
              opacity: 0 
            }
          ],
          {
            duration: duration * 1000,
            delay: delay * 1000,
            fill: 'forwards',
            easing: 'cubic-bezier(0.21, 0.98, 0.6, 0.99)'
          }
        );

        confettiContainer.appendChild(confetti);
        
        // Remove confetti element after animation completes
        setTimeout(() => {
          if (confetti.parentNode === confettiContainer) {
            confettiContainer.removeChild(confetti);
          }
        }, (duration + delay) * 1000);
      }
    };

    // Create more confetti every few seconds
    createConfetti();
    const interval = setInterval(createConfetti, 5000);

    return () => clearInterval(interval);
  }, []);

  return <div className="confetti"></div>;
};

export default Confetti;