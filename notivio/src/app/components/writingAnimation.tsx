"use client"

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

const HandwritingAnimation = () => {
  useEffect(() => {
    // Create a GSAP timeline for the animation
    const timeline = gsap.timeline();

    // Array of the letters in "Notivio"
    const letters = ['N', 'o', 't', 'i', 'v', 'i', 'o'];

    letters.forEach((letter, index) => {
      // Get the path element for each letter
      const path = document.querySelector(`#letter-${letter}`) as SVGPathElement;
      if (path) {
        const length = path.getTotalLength();

        // Set up stroke-dasharray and stroke-dashoffset for a drawing effect
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 1,
        });

        // Animate each path drawing
        timeline.to(
          path,
          {
            strokeDashoffset: 0,
            duration: 1.5, // Adjust timing as needed
            ease: 'power1.inOut',
          },
          index * 1 // Stagger animations
        );

        // Animate pencil following the path
        timeline.to(
          '#pencil', // Pencil icon to follow the path
          {
            duration: 2.5,
            motionPath: {
              path: path,
              align: path,
              autoRotate: true,
              alignOrigin: [0.8, 0.8], // To align the pencil's tip along the path
            },
          },
          index * 1
        );
      }
    });
  }, []);

  return (
    <svg
      width="800"
      height="200"
      viewBox="0 0 800 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Define letter paths with unique IDs */}
      <path
        id="letter-N"
        d="M10,150 L10,50 L50,150 L50,50"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-o"
        d="M70,100 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-t"
        d="M130,50 L130,150 M120,50 L140,50"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-i"
        d="M160,50 L160,150 M160,40 L160,45"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-v"
        d="M180,50 L190,150 L200,50"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-i2"
        d="M220,50 L220,150 M220,40 L220,45"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />
      <path
        id="letter-o2"
        d="M240,100 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0"
        stroke="#000"
        strokeWidth="2"
        fill="none"
        opacity="0"
      />

      {/* Pencil icon */}
      <path id="pencil" d="M10,10 L20,20 L10,30" stroke="gray" strokeWidth="3" fill="none" />
      </svg>
  );
};

export default HandwritingAnimation;
