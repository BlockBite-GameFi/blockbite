// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScroll = currentScroll;
});

// Scroll-triggered animations
const observerOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger the animation for step cards
      const delay = entry.target.closest('.steps-grid')
        ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 120
        : 0;

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});

// Smooth parallax for orbs on mouse move
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;

  const orbs = document.querySelectorAll('.orb');
  orbs.forEach((orb, i) => {
    const speed = (i + 1) * 8;
    orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
  });
});

// CTA button ripple effect
const ctaBtn = document.getElementById('cta-main');
if (ctaBtn) {
  ctaBtn.addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.3);
      width: 0; height: 0;
      left: ${e.clientX - rect.left}px;
      top: ${e.clientY - rect.top}px;
      transform: translate(-50%, -50%);
      animation: rippleEffect 0.6s ease-out forwards;
    `;
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

// Add ripple keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleEffect {
    to { width: 300px; height: 300px; opacity: 0; }
  }
`;
document.head.appendChild(style);
