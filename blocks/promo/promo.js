function getText(el) {
  return el ? el.textContent.trim() : '';
}

function getData(block) {
  const data = {};

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const key = getText(cells[0]).toLowerCase();
    const value = cells[1];

    if (key === 'title') data.title = value.innerHTML;
    if (key === 'body') data.body = value.innerHTML;
    if (key === 'ctatext') data.ctaText = getText(value);
    if (key === 'ctahref') data.ctaHref = getText(value);
  });

  return data;
}

export default function decorate(block) {
  const {
    title, body, ctaText, ctaHref,
  } = getData(block);

  block.innerHTML = `
    <div class="promo-inner">
      ${title ? `<h2 class="promo-title">${title}</h2>` : ''}
      ${body ? `<div class="promo-body">${body}</div>` : ''}
      ${ctaText && ctaHref ? `<p class="promo-cta"><a href="${ctaHref}">${ctaText}</a></p>` : ''}
    </div>
  `;
}
