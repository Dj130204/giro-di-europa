/* script.js */
// Sticky nav effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 10) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});
window.addEventListener("DOMContentLoaded", () => {
    gsap.from(".nav-icon", {
      y: -20,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      stagger: 0.2
    });
  });window.addEventListener("DOMContentLoaded", () => {
  const scrollingBackground = document.getElementById("scrollingBackground");

  const imageFilenames = [
    '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
    '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg'
  ];

  const totalImages = 20;

  for (let i = 0; i < totalImages; i++) {
    const img = document.createElement("img");
    const file = imageFilenames[Math.floor(Math.random() * imageFilenames.length)];
    img.src = `images/${file}`;

    const width = Math.random() * 200 + 300; // 300–500px
    img.style.width = `${width}px`;
    img.style.top = `${Math.random() * 100}%`;
    img.style.left = `${Math.random() * 100}%`;
    img.style.animationDuration = `${40 + Math.random() * 40}s`; // 40–80s

    scrollingBackground.appendChild(img);
  }
});
window.addEventListener("DOMContentLoaded", () => {
  const scrollingBackground = document.getElementById("scrollingBackground");

  const imageFilenames = [
    '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
    '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg'
  ];

  const totalImages = 20;

  for (let i = 0; i < totalImages; i++) {
    const img = document.createElement("img");
    const file = imageFilenames[Math.floor(Math.random() * imageFilenames.length)];
    img.src = `images/${file}`;

    const width = Math.random() * 200 + 300; // 300–500px
    img.style.width = `${width}px`;
    img.style.top = `${Math.random() * 100}%`;
    img.style.left = `${Math.random() * 100}%`;
    img.style.animationDuration = `${40 + Math.random() * 40}s`; // 40–80s

    scrollingBackground.appendChild(img);
  }
});
window.addEventListener("DOMContentLoaded", () => {
    const backgroundCollage = document.getElementById("backgroundCollage");
  
    const imageFilenames = [
      '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg',
      '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg'
    ];
  
    imageFilenames.forEach((filename) => {
      const img = document.createElement('img');
      img.src = `images/${filename}`;
      img.alt = filename;
      backgroundCollage.appendChild(img);
    });
  });
  
  
