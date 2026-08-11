(() => {
  const lightbox = document.getElementById('projectLightbox');
  const galleryItems = window.PROJECT_GALLERY || [];

  if (!lightbox || galleryItems.length === 0) return;

  const image = lightbox.querySelector('.project-lightbox-image');
  const count = lightbox.querySelector('.project-lightbox-count');
  const thumbnails = lightbox.querySelector('.project-lightbox-thumbnails');
  const closeButton = lightbox.querySelector('.project-lightbox-close');
  const previousButton = lightbox.querySelector('.project-lightbox-nav.previous');
  const nextButton = lightbox.querySelector('.project-lightbox-nav.next');
  const openers = document.querySelectorAll('[data-gallery-index]');
  let activeIndex = 0;
  let thumbnailsBuilt = false;

  function clampIndex(index) {
    return Math.max(0, Math.min(galleryItems.length - 1, index));
  }

  function showImage(index) {
    activeIndex = clampIndex(index);
    const item = galleryItems[activeIndex];

    image.classList.remove('loaded');
    image.srcset = item.srcset || '';
    image.sizes = '100vw';
    image.src = item.src;
    image.alt = item.alt || '';
    count.textContent = `${activeIndex + 1} / ${galleryItems.length}`;

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === galleryItems.length - 1;

    thumbnails.querySelectorAll('.project-lightbox-thumbnail').forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
      if (isActive) button.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });
  }

  function openGallery(index) {
    buildThumbnails();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showImage(index);
    closeButton.focus();
  }

  function closeGallery() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function buildThumbnails() {
    if (thumbnailsBuilt) return;

    galleryItems.forEach((item, index) => {
      const button = document.createElement('button');
      const thumbnail = document.createElement('img');
      button.className = 'project-lightbox-thumbnail';
      button.type = 'button';
      button.setAttribute('aria-label', `Show photograph ${index + 1}`);
      button.addEventListener('click', () => showImage(index));
      thumbnail.src = item.thumb || item.src;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      thumbnail.decoding = 'async';
      button.appendChild(thumbnail);
      thumbnails.appendChild(button);
    });

    thumbnailsBuilt = true;
  }

  openers.forEach((opener) => {
    opener.addEventListener('click', () => {
      const index = Number.parseInt(opener.dataset.galleryIndex || '0', 10);
      openGallery(Number.isNaN(index) ? 0 : index);
    });
  });

  image.addEventListener('load', () => image.classList.add('loaded'));
  closeButton.addEventListener('click', closeGallery);
  previousButton.addEventListener('click', () => showImage(activeIndex - 1));
  nextButton.addEventListener('click', () => showImage(activeIndex + 1));

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeGallery();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('active')) return;
    if (event.key === 'Escape') closeGallery();
    if (event.key === 'ArrowLeft') showImage(activeIndex - 1);
    if (event.key === 'ArrowRight') showImage(activeIndex + 1);
  });
})();
