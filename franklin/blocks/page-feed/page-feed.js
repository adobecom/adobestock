/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  createTag,
  getConfig,
  replaceKey,
} from '../../scripts/scripts/scripts.js';

/**
 * Helper method to transform h6 tag to detail-m
 * @param {Object} scope An object within which to replace h6
 */
function turnH6intoDetailM(scope) {
  scope.querySelectorAll('h6').forEach((h6) => {
    const p = createTag('p', { class: 'detail-m' }, h6.innerHTML);
    const attrs = h6.attributes;
    for (let i = 0, len = attrs.length; i < len; i += 1) {
      p.setAttribute(attrs[i].name, attrs[i].value);
    }
    h6.parentNode.replaceChild(p, h6);
  });
}

/**
 * Helper method to transform string to sentence case
 * @param {String} str The string to be replaced
 */
function toSentenceCase(str) {
  return (str && typeof str === 'string') ? str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()) : '';
}

/**
 * Helper method to transform a tag's link into animation on cards
 * @param {Object} a The a tag used for animation
 */
function transformLinkToAnimation(a) {
  if (!a || !a.href.includes('.mp4')) return null;
  const params = new URL(a.href).searchParams;
  const attribs = {};
  ['playsinline', 'autoplay', 'loop', 'muted'].forEach((p) => {
    if (params.get(p) !== 'false') attribs[p] = '';
  });
  // use the closest picture as poster
  const poster = a.closest('div').querySelector('picture source');
  if (poster) {
    attribs.poster = poster.srcset;
    poster.parentNode.remove();
  }
  // replace anchor with video element
  const videoUrl = new URL(a.href);
  const video = createTag('video', attribs);
  video.innerHTML = `<source src="${videoUrl}" type="video/mp4">`;
  const innerDiv = a.closest('div');
  innerDiv.prepend(video);
  innerDiv.classList.add('hero-animation-overlay');
  a.replaceWith(video);
  // autoplay animation
  video.addEventListener('canplay', () => {
    video.muted = true;
    video.play();
  });
  return video;
}

/**
 * Helper method to transform link to relative format if applicable
 * @param {String} href The href to check and make relative if is in project sharepoint
 */
export function makeInternalLinkRelative(href) {
  const projectName = 'adobestock--adobecom';
  const productionDomains = ['stock.adobe.com'];
  const decodedHref = href.replace(/\u2013|\u2014/g, '--');
  const hosts = [`${projectName}.hlx.page`, `${projectName}.hlx.live`, ...productionDomains];
  const url = new URL(decodedHref);

  if (!url) return href;

  const isRelative = hosts.some((host) => url.hostname.includes(host))
    || url.hostname === window.location.hostname;
  return isRelative ? `${url.pathname}${url.search}${url.hash}` : href;
}

/**
 * Helper method to get the next load-more fetch range
 * @param {Object} payload Props and stats an instance of the block maintains through its life-cycle
 */
function getFetchRange(payload) {
  let range;

  if (payload.offset + payload.limit < payload.cardsToBuild.length) {
    range = payload.offset + payload.limit;
  } else {
    range = payload.cardsToBuild.length;
  }

  return range;
}

/**
 * Helper method to get the page feed card context from a fetch
 * @param {Object} a string or a tag of the in-project page to fetch
 */
export async function loadPageFeedCard(a) {
  if (!a) return null;

  const href = (typeof (a) === 'string') ? a : a.href;
  const path = makeInternalLinkRelative(href);
  if (!path.startsWith('/')) return null;

  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) return null;

  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const pfCard = doc.querySelector('.page-feed-card > div');
  if (!pfCard) return null;

  turnH6intoDetailM(pfCard);
  const aEl = (a && a.nodeType) ? a : createTag('a', { href: path });
  pfCard.append(createTag('div', {}, aEl));

  return pfCard;
}

/**
 * Helper method to render correct social icon
 * @param {Object} cell The cell that might contain images or links of the svg icon
 */
function fixIcon(cell) {
  const links = cell.querySelectorAll('a');
  const preRenderedImgs = cell.querySelectorAll('img');
  const config = getConfig();
  const base = config.codeRoot;

  links.forEach((link) => {
    if (link && link.textContent.endsWith('.svg')) {
      const iconPathArray = link.textContent.split('/');
      const iconName = iconPathArray[iconPathArray.length - 1];
      link.textContent = '';
      const iconPic = createTag('picture');
      const iconImg = createTag('img', { class: 'pf-card-social-icon', src: `${base}/blocks/page-feed/social-icons/${iconName}` });

      iconPic.append(iconImg);
      link.append(iconPic);
    }
  });

  preRenderedImgs.forEach((preRenderedImg) => {
    if (preRenderedImg && preRenderedImg.src.endsWith('.svg')) {
      const iconPathArray = preRenderedImg.src.split('/');
      const iconName = iconPathArray[iconPathArray.length - 1];
      preRenderedImg.src = `${base}/blocks/page-feed/social-icons/${iconName}`;
      preRenderedImg.classList.add('pf-card-social-icon');
    }
  });
}

/**
 * Helper method to build page feed card
 * @param {Object} card The page feed card element, static or fetched
 * @param {Boolean} overlay The bool to determine a specific card style difference
 */
function buildCard(card, overlay = false) {
  if (!card) return null;

  card.classList.add('pf-card');
  const cells = Array.from(card.children);
  let hasLink;
  cells.forEach((cell, index) => {
    if (index === 0) {
      if (cell.querySelector('picture:first-child:last-child')) {
        cell.classList.add('pf-card-picture');
      } else {
        const a = cell.querySelector('a');
        if (a && a.href.endsWith('.mp4')) {
          const video = transformLinkToAnimation(a);
          cell.innerHTML = '';
          if (video) {
            cell.appendChild(video);
            cell.classList.add('pf-card-picture');
          }
        } else {
          cell.classList.add('pf-card-text');
        }
      }
    }

    if (index === 1) {
      cell.classList.add('pf-card-text');
      fixIcon(cell);
    }

    if (index === 2) {
      const cardLink = cell.querySelector('a');
      if (cardLink) {
        cell.classList.add('pf-card-link');
        hasLink = true;
      }
    }

    if (index === 3) {
      if (!card.querySelector('.pf-card-text')) return;

      cell.classList.add('pf-card-banner');
      const cardTag = createTag('div');
      cardTag.innerHTML = cell.innerHTML;
      cell.innerHTML = '';
      cell.appendChild(cardTag);
    }

    if (index > 3) {
      cell.remove();
    }
  });

  if (hasLink) {
    const cardLink = card.querySelector('.pf-card-link a');
    if (cardLink) {
      cardLink.classList.remove('button');
      cardLink.classList.add('pf-card-container-link');
      cardLink.innerText = '';
      card.appendChild(cardLink);
      cells.forEach((div) => {
        cardLink.append(div);
      });
      card.querySelector('.pf-card-link').remove();
    }
  }

  if (overlay) {
    const div = document.createElement('div');
    div.classList.add('pf-card-overlay');
    card.appendChild(div);
  }

  turnH6intoDetailM(card);

  return card;
}

/**
 * Handler of the load more button
 * @param {Object} block The current page feed block
 */
async function decorateLoadMoreButton(block) {
  const loadMoreWrapper = createTag('div', { class: 'content' });
  const loadMoreContainer = createTag('p', { class: 'button-container page-feed-load-more' });
  const loadMore = document.createElement('a');
  loadMore.className = 'button transparent';
  loadMore.href = '#';
  const placeholder = await replaceKey('load-more', getConfig());
  loadMore.textContent = toSentenceCase(placeholder);
  loadMoreContainer.append(loadMore);
  loadMoreWrapper.append(loadMoreContainer);
  block.insertAdjacentElement('afterend', loadMoreWrapper);

  return {
    wrapper: loadMoreWrapper,
    button: loadMore,
  };
}

/**
 * Page feed grid style decision maker
 * @param {Number} total number of cards
 */
function getCols(total) {
  let len;
  if (total === 1 || total === 2) {
    len = 2;
  } else if (total % 3 === 0) {
    len = 3;
  } else if (total % 4 === 0) {
    len = 4;
  } else if (total % 5 === 0) {
    len = 5;
  } else if (total % 7 === 0) {
    len = 7;
  } else {
    len = 4;
  }

  return len;
}

/**
 * The main decorator of the block
 * Paginated loading is done recursively
 * @param {Object} block The current page feed block
 * @param {Array} cards All the cards to decorate
 * @param {Object} payload Props and stats an instance of the block maintains through its life-cycle
 */
async function decorateCards(block, cards, payload) {
  if (payload.cardsToBuild.length < payload.limit) {
    payload.cols = getCols(payload.cardsToBuild.length);
    payload.limit = payload.cols % 2 ? 6 : 8;
  }

  if (payload.cardsToBuild.length === 5) {
    block.classList.add('col-3-pf-cards');
    const pfRowFive = createTag('div', { class: 'page-feed col-2-pf-cards' });
    pfRowFive.append(cards[3]);
    pfRowFive.append(cards[4]);
    payload.offset += 2;
    block.insertAdjacentElement('afterend', pfRowFive);
  } else if (payload.cardsToBuild.length === 7) {
    block.classList.add('col-3-pf-cards');
    const pfRowSeven = createTag('div', { class: 'page-feed col-4-pf-cards' });
    pfRowSeven.append(cards[3]);
    pfRowSeven.append(cards[4]);
    pfRowSeven.append(cards[5]);
    pfRowSeven.append(cards[6]);
    payload.offset += 4;
    block.insertAdjacentElement('afterend', pfRowSeven);
  } else {
    block.classList.add(`col-${payload.cols}-pf-cards`);
  }

  for (let i = 0; i < cards.length; i += 1) {
    if (![5, 7].includes(payload.cols) || ([5, 7].includes(payload.cols) && i < 3)) {
      block.append(cards[i]);
      payload.offset += 1;
    }
  }

  const newRange = getFetchRange(payload);

  if (payload.offset < payload.cardsToBuild.length) {
    block.classList.add('load-more-available');
    const loadMoreObject = await decorateLoadMoreButton(block);
    loadMoreObject.button.addEventListener('click', async (event) => {
      event.preventDefault();
      loadMoreObject.wrapper.remove();

      const newCardsLoaded = [];

      for (let i = payload.offset; i < newRange; i += 1) {
        let feedLink;
        if (payload.loadFromJson) {
          if (payload.cardsToBuild[i].setting === 'in_featured_pod') return;
          feedLink = payload.cardsToBuild[i].link;
        } else {
          feedLink = payload.cardsToBuild[i].href || payload.cardsToBuild[i];
        }

        newCardsLoaded.push(loadPageFeedCard(feedLink));
      }

      Promise.all(newCardsLoaded).then((newCards) => {
        const cardsToBuild = [];
        newCards.forEach((card, index) => {
          if (card) {
            cardsToBuild.push(buildCard(card, payload.overlay));
          } else {
            payload.trashBin.push(index);
          }
        });
        decorateCards(block, cardsToBuild, payload);
      });
    });

    if (block.querySelectorAll('.pf-card').length <= 0) {
      loadMoreObject.wrapper.remove();
      block.classList.remove('load-more-available');
    }
  }

  block.classList.remove('loading');
}

/**
 * Wrapper/filter function of the main decorator
 * @param {Object} block The current page feed block
 * @param {Array} cards All the cards to decorate
 * @param {Object} payload Props and stats an instance of the block maintains through its life-cycle
 */
function renderCards(block, payload, cards) {
  payload.trashBin.forEach((index) => {
    payload.cardsToBuild.splice(index, 1);
  });

  block.innerHTML = '';
  decorateCards(block, cards, payload);

  block.querySelectorAll('a.button').forEach((button) => {
    if (button.textContent === '') {
      button.classList.remove('button');
    }
  });
}

/**
 * Initialization function for page-feed block
 * @see https://github.com/adobecom/milo/blob/main/libs/utils/utils.js#L361
 * @param {Object} block
 */
export default async function init(block) {
  block.classList.add('loading');

  const payload = {
    offset: 0,
    limit: 8,
    cols: 4,
    trashBin: [],
  };

  const rows = Array.from(block.children);
  payload.cardsToBuild = rows;

  const overlay = block.classList.contains('overlay');
  payload.overlay = overlay;
  if (block.classList.contains('fit')) {
    block.classList.add('pf-fit');
    block.classList.remove('fit');
  } else if (overlay) {
    block.classList.add('pf-overlay');
    block.classList.remove('overlay');
  }

  const cards = [];
  const cardsLoaded = [];

  rows.forEach((row) => {
    const { children } = row;
    if (children.length > 0 && children[0].querySelector('ul')) {
      const pageLinks = children[0].querySelector('ul').querySelectorAll('a');

      payload.cardsToBuild = Array.from(pageLinks);
      const range = getFetchRange(payload);

      for (let i = 0; i < range; i += 1) {
        if (pageLinks[i] && pageLinks[i].href) {
          const card = loadPageFeedCard(pageLinks[i].href);
          cardsLoaded.push(card);
        }
      }
    } else {
      cards.push(buildCard(row, overlay));
    }
  });

  Promise.all(cardsLoaded).then((feeds) => {
    feeds.forEach((card, index) => {
      if (card) {
        cards.push(buildCard(card, overlay));
      } else {
        payload.trashBin.push(index);
      }
    });

    renderCards(block, payload, cards);
  });
}
