"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GsapScrollTrigger() {
  useEffect(() => {
    // 1. Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // 2. Text Splitter helper (replicates SplitText functionality)
    const splitTextElements = document.querySelectorAll(".gsap-split-chars");
    
    splitTextElements.forEach((el) => {
      // Prevent double-splitting if re-mounted
      if (el.getAttribute("data-split-done")) return;
      
      const originalText = el.textContent || "";
      el.innerHTML = ""; // Clear
      
      // Split into words and then chars
      const words = originalText.split(" ");
      words.forEach((word, wordIdx) => {
        const wordSpan = document.createElement("span");
        wordSpan.style.display = "inline-block";
        wordSpan.style.whiteSpace = "nowrap";
        wordSpan.className = "split-word";

        const chars = Array.from(word);
        chars.forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.textContent = char;
          charSpan.style.display = "inline-block";
          charSpan.className = "split-char inline-block opacity-0";
          wordSpan.appendChild(charSpan);
        });

        el.appendChild(wordSpan);
        
        // Add spaces between words
        if (wordIdx < words.length - 1) {
          const space = document.createTextNode(" ");
          el.appendChild(space);
        }
      });
      
      el.setAttribute("data-split-done", "true");

      // Set up staggered char slide-up animation (using premium power4.out and small translation)
      const targetChars = el.querySelectorAll(".split-char");
      gsap.fromTo(targetChars, 
        { y: 15, opacity: 0 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power4.out",
          stagger: 0.012,
        }
      );
    });

    // 3. Staggered Items Animation
    const staggerContainers = document.querySelectorAll(".gsap-stagger-container");
    staggerContainers.forEach((container) => {
      const items = container.querySelectorAll(".gsap-stagger-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          scrollTrigger: {
            trigger: container,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power4.out",
          stagger: 0.08,
        }
      );
    });

    // 4. Simple Scroll Reveal (Fade Up)
    const fadeUpElements = document.querySelectorAll(".gsap-fade-up");
    fadeUpElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 25 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power4.out",
        }
      );
    });

    // 5. Scale Up Animation
    const scaleUpElements = document.querySelectorAll(".gsap-scale-up");
    scaleUpElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.15)",
        }
      );
    });

    // 6. Slide In From Left
    const slideLeftElements = document.querySelectorAll(".gsap-slide-left");
    slideLeftElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: -30 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power4.out",
        }
      );
    });

    // 7. Slide In From Right
    const slideRightElements = document.querySelectorAll(".gsap-slide-right");
    slideRightElements.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, x: 30 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power4.out",
        }
      );
    });

    // Cleanup on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return null; // Side-effect only component
}
