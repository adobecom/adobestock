/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { setLibs, createTag } from './utils.js';

// Add project-wide style path here.
const STYLES = '/franklin/styles/styles.css';

// Use '/libs' if your live site maps '/libs' to milo's origin.
const LIBS = 'https://milo.adobe.com/libs';

// Add any config options.
const CONFIG = {
  codeRoot: '/franklin',
  // contentRoot: '',
  imsClientId: 'adobestock',
  // geoRouting: 'off',
  // fallbackRouting: 'off',
  locales: {
    '': { ietf: 'en-US', tk: 'hah7vzn.css' },
    de: { ietf: 'de-DE', tk: 'hah7vzn.css' },
    kr: { ietf: 'ko-KR', tk: 'zfo3ouc' },
  },
};

// Load LCP image immediately
(async function loadLCPImage() {
  const lcpImg = document.querySelector('img');
  lcpImg?.removeAttribute('loading');
}());

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

const miloLibs = setLibs(LIBS);

(function loadStyles() {
  const paths = [`${miloLibs}/styles/styles.css`];
  if (STYLES) { paths.push(STYLES); }
  paths.forEach((path) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', path);
    document.head.appendChild(link);
  });
}());

/**
 * Helper method to load Stock footer left links
 * After Milo's footer component is loaded
 */
function loadFooter() {
  const footerLeftLinks = [
    {
      textContent: 'License Terms',
      href: 'https://stock.adobe.com/license-terms',
    },
    {
      textContent: 'Learn & Support',
      href: 'https://helpx.adobe.com/support/stock.html',
    },
    {
      textContent: 'Blog',
      href: 'https://blog.adobe.com/en/topics/stock.html',
    },
    {
      textContent: 'Company',
      href: 'https://www.adobe.com/company.html',
    },
    {
      textContent: 'Sell Images',
      href: 'https://contributor.stock.adobe.com/?as_channel=stock&as_source=globalnav&as_campclass=brand&as_campaign=footer',
    },
    {
      textContent: 'Enterprise',
      href: 'https://stockenterprise.adobe.com/',
    },
    {
      textContent: 'Sitemap',
      href: 'https://stock.adobe.com/sitemap',
    },
  ];
  const $footerLeftLinkGroupColumn = createTag('div', { class: 'footer-info-column' });
  const $footerLeftLinkGroupWrapper = createTag('div', { class: 'footer-privacy' });
  const $footerLeftLinkGroupList = createTag('ul', { class: 'footer-privacy-links' });

  // Get last-child in footer which is all the right links incl privacy, ad choices etc.
  const $footerInfoLastChildElement = document.getElementsByClassName('footer-info')[0].lastChild;

  // Build "li" links and append to "ul" (footerLeftLinkGroupList)
  footerLeftLinks.forEach((footerLeftLink, idx) => {
    const { textContent, href } = footerLeftLink;
    const $footerLeftLinkListItem = createTag('li', { class: 'footer-privacy-link footer-left-link' });
    const $footerLeftLinkHrefItem = createTag('a', { href, 'daa-ll': `footer-left-link-group-${textContent}-${idx}` });
    $footerLeftLinkHrefItem.textContent = textContent;
    $footerLeftLinkListItem.append($footerLeftLinkHrefItem);
    $footerLeftLinkGroupList.append($footerLeftLinkListItem);
  });

  // Append "ul" to "div.footer-privacy"
  $footerLeftLinkGroupWrapper.append($footerLeftLinkGroupList);
  // Append "div.footer-privacy" to "div.footer-info-column"
  $footerLeftLinkGroupColumn.append($footerLeftLinkGroupWrapper);
  // Insert left links component in between "Change region" and Right links
  document.getElementsByClassName('footer-info')[0].insertBefore($footerLeftLinkGroupColumn, $footerInfoLastChildElement);
}

(async function loadPage() {
  document.body.style.display = 'none';
  const { loadArea, loadDelayed, setConfig } = await import(`${miloLibs}/utils/utils.js`);

  setConfig({ ...CONFIG, miloLibs });
  await loadArea();
  await loadDelayed();

  if (!window.location.href.includes('/pages/artisthub')) {
    const footer = document.querySelector('footer');
    if (footer) {
      loadFooter();
    }
  }
  document.body.style.removeProperty('display');
}());
