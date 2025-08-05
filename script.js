/* script.js */
document.getElementById('signup-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const status = document.getElementById('form-status');
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  if (!data.name || !data.email || !data.message) {
    status.textContent = "Please fill in all fields.";
    status.style.color = "red";
    return;
  }

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_key: "e8615012-dc47-47f3-90eb-b1bf761e43ff",
      ...data
    })
  })
  .then(res => res.json())
  .then(result => {
    if (result.success) {
      status.textContent = "Thanks for signing up!";
      status.style.color = "green";
      document.getElementById('signup-form').reset();
    } else {
      throw new Error(result.message);
    }
  })
  .catch(err => {
    status.textContent = "Submission failed. Try again later.";
    status.style.color = "red";
  });
});

// GSAP Animations
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    gsap.to(preloader, { opacity: 0, duration: 0.6, onComplete: () => preloader.remove() });
  }

  gsap.to(".main-logo", { opacity: 1, duration: 1, y: 0 });
  gsap.to(".tagline", { opacity: 1, duration: 1, delay: 0.5, y: 0 });
  gsap.to(".signup-heading", { opacity: 1, duration: 1, delay: 1 });

  gsap.utils.toArray('.scroll-fade').forEach((el) => {
    gsap.fromTo(el, { opacity: 0, y: 50 }, {
      opacity: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
  });
});

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
  
  
