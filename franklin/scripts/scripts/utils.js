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

/*
 * ------------------------------------------------------------
 * Edit below at your own risk
 * ------------------------------------------------------------
 */

/**
 * The decision engine for where to get Milo's libs from.
 */
export const [setLibs, getLibs] = (() => {
  let libs;
  return [
    (prodLibs) => {
      const { hostname } = window.location;
      if (!hostname.includes('hlx.page')
        && !hostname.includes('hlx.live')
        && !hostname.includes('localhost')) {
        libs = prodLibs;
        return libs;
      }
      const branch = new URLSearchParams(window.location.search).get('milolibs') || 'main';
      if (branch === 'local') return 'http://localhost:6456/libs';
      if (branch.indexOf('--') > -1) return `https://${branch}.hlx.page/libs`;
      return `https://${branch}--milo--adobecom.hlx.live/libs`;
    }, () => libs,
  ];
})();

const LIBS = 'https://milo.adobe.com/libs';
const miloLibs = setLibs(LIBS);
export const { getConfig, createTag, loadStyle } = await import(`${miloLibs}/utils/utils.js`);
export const { replaceKey } = await import(`${miloLibs}/features/placeholders.js`);
export const { decorateButtons } = await import(`${miloLibs}/utils/decorate.js`);
export const { decorateBlockAnalytics, decorateLinkAnalytics } = await import(`${miloLibs}/martech/attributes.js`);

export async function loadBlockCSS(blockName) {
  const href = `/pages/blocks/${blockName}/${blockName}.css`;
  if (document.querySelector(`head > link[href="${href}"]`)) return;
  // eslint-disable-next-line consistent-return
  return new Promise((resolve) => {
    loadCSS(href, resolve);
  });
}

export function toSentenceCase(str) {
  return (str && typeof str === 'string') ? str.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase()) : '';
}

export function makeRelative(href) {
  const projectName = 'stock--adobecom';
  const productionDomains = ['stock.adobe.com'];
  const fixedHref = href.replace(/\u2013|\u2014/g, '--');
  const hosts = [`${projectName}.hlx.page`, `${projectName}.hlx.live`, ...productionDomains];
  const url = new URL(fixedHref);
  const relative = hosts.some((host) => url.hostname.includes(host))
    || url.hostname === window.location.hostname;
  return relative ? `${url.pathname}${url.search}${url.hash}` : href;s
}
