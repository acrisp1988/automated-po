import { createOptimizedPicture } from '../../scripts/aem.js';

// how long (ms) each slide is shown before auto-advancing
const AUTOPLAY_INTERVAL = 6000;

/**
 * Move the carousel to a given slide index, wrapping around at the ends.
 * @param {Element} block The carousel block
 * @param {number} index The target slide index
 */
function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-slide')];
  const dots = [...block.querySelectorAll('.carousel-dot')];
  const count = slides.length;
  // wrap around so the carousel loops in both directions
  const target = (index + count) % count;

  const track = block.querySelector('.carousel-track');
  track.style.transform = `translateX(-${target * 100}%)`;

  slides.forEach((slide, i) => {
    const isActive = i === target;
    slide.classList.toggle('carousel-slide-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    // keep off-screen slides out of the tab order
    slide.querySelectorAll('a, button').forEach((el) => {
      if (isActive) el.removeAttribute('tabindex');
      else el.setAttribute('tabindex', '-1');
    });
  });

  dots.forEach((dot, i) => {
    const isActive = i === target;
    dot.classList.toggle('carousel-dot-active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    dot.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  block.dataset.activeSlide = target;
}

/**
 * loads and decorates the carousel
 * @param {Element} block The carousel block element
 */
export default function decorate(block) {
  // 1. Transform each authored row into a slide
  const rows = [...block.children];

  const track = document.createElement('ul');
  track.className = 'carousel-track';

  rows.forEach((row, i) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${rows.length}`);

    while (row.firstElementChild) {
      const cell = row.firstElementChild;
      if (cell.querySelector('picture')) cell.classList.add('carousel-slide-image');
      else cell.classList.add('carousel-slide-content');
      slide.append(cell);
    }

    track.append(slide);
  });

  // optimize images now that they live inside slides
  track.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 600px)', width: '2000' },
      { width: '750' },
    ]);
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(track);

  const slideCount = track.children.length;
  // nothing to rotate through with a single slide
  if (slideCount <= 1) {
    if (slideCount === 1) showSlide(block, 0);
    return;
  }

  // 2. Build the previous/next arrow controls
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'carousel-arrow carousel-arrow-prev';
  prevButton.setAttribute('aria-label', 'Previous slide');
  prevButton.innerHTML = '<span class="carousel-arrow-icon"></span>';

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'carousel-arrow carousel-arrow-next';
  nextButton.setAttribute('aria-label', 'Next slide');
  nextButton.innerHTML = '<span class="carousel-arrow-icon"></span>';

  nav.append(prevButton, nextButton);

  // 3. Build the position indicator dots
  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose slide to display');

  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => {
      showSlide(block, i);
    });
    dots.append(dot);
  }

  block.append(nav, dots);

  // 4. Wire up controls and auto-rotation
  let autoplayTimer;

  const goTo = (index) => {
    showSlide(block, index);
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const startAutoplay = () => {
    if (reduceMotion) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      goTo(Number(block.dataset.activeSlide) + 1);
    }, AUTOPLAY_INTERVAL);
  };

  prevButton.addEventListener('click', () => {
    goTo(Number(block.dataset.activeSlide) - 1);
    startAutoplay();
  });

  nextButton.addEventListener('click', () => {
    goTo(Number(block.dataset.activeSlide) + 1);
    startAutoplay();
  });

  // keyboard navigation when the carousel has focus
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      goTo(Number(block.dataset.activeSlide) - 1);
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      goTo(Number(block.dataset.activeSlide) + 1);
      startAutoplay();
    }
  });

  // pause rotation while the user is interacting
  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);
  block.addEventListener('focusin', stopAutoplay);
  block.addEventListener('focusout', startAutoplay);

  showSlide(block, 0);
  startAutoplay();
}
