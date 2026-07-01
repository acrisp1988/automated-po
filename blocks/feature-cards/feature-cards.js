import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Content contract (one card per row):
 *   Cell 1: image
 *   Cell 2: content
 *           - first paragraph  -> pretitle (small eyebrow label)
 *           - remaining text   -> title / description
 *           - a link           -> makes the whole card clickable
 *
 * loads and decorates the feature cards
 * @param {Element} block The feature-cards block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'feature-cards-card';

    while (row.firstElementChild) li.append(row.firstElementChild);

    // classify each cell as image or body
    [...li.children].forEach((cell) => {
      if (cell.children.length === 1 && cell.querySelector('picture')) {
        cell.className = 'feature-cards-card-image';
      } else {
        cell.className = 'feature-cards-card-body';
      }
    });

    const body = li.querySelector('.feature-cards-card-body');
    if (body) {
      // first paragraph acts as the pretitle / eyebrow label
      const pretitle = body.querySelector('p, h1, h2, h3, h4, h5, h6');
      if (pretitle) pretitle.classList.add('feature-cards-pretitle');
    }

    // if the card contains a link, make the whole card clickable
    const link = li.querySelector('a[href]');
    if (link) {
      const anchor = document.createElement('a');
      anchor.className = 'feature-cards-card-link';
      anchor.href = link.href;
      if (link.title) anchor.title = link.title;
      if (link.target) anchor.target = link.target;
      // use the link's text as the accessible name when no title is set
      anchor.setAttribute('aria-label', link.title || link.textContent.trim());

      // remove the original inline link, then move all card content into the anchor
      link.remove();
      while (li.firstElementChild) anchor.append(li.firstElementChild);

      // decorative arrow affordance, appended inline at the end of the last
      // line of authored text (after the pretitle) to signal the card is clickable
      const arrow = document.createElement('span');
      arrow.className = 'feature-cards-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const cardBody = anchor.querySelector('.feature-cards-card-body');
      // drop paragraphs left empty after removing the inline link
      cardBody.querySelectorAll('p').forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector('picture, img')) p.remove();
      });
      const textLines = [...cardBody.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
        .filter((el) => !el.classList.contains('feature-cards-pretitle') && el.textContent.trim());
      (textLines[textLines.length - 1] || cardBody).append(arrow);

      li.append(anchor);
    }

    ul.append(li);
  });

  // optimize authored images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
