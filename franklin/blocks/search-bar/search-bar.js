/* eslint-disable object-curly-newline */
/* eslint-disable max-len */
import { createTag } from '../../scripts/scripts/utils.js';

/**
 * Asset Dropdown List
 * @todo Should come from localized placeholders.json files
 */
const assetDropdownList = [
  'All',
  'Images',
  'Videos',
  'Audio',
  'Templates',
  '3D',
  'Free',
  'Premium',
];

const LAST_SELECTED_ASSET_TYPE_COOKIE = 'last_selected_asset_type';

/**
 * Helper method to get value from "last_selected_asset_type" cookie
 */
function getLastSelectedAssetTypeFromCookie() {
  return document.cookie.split(';').find((row) => row.startsWith(`${LAST_SELECTED_ASSET_TYPE_COOKIE}=`))?.split('=')[1];
}

/**
 * Helper method to get selected Asset Type
 * @param {Object} $assetDropdownSelect
 */
function getAssetType($assetDropdownSelect) {
  const assetType = $assetDropdownSelect.value.toLowerCase();

  switch (assetType) {
    case 'all': return '';
    case 'videos': return 'video';
    case '3d': return '3d-assets';
    default: return assetType;
  }
}
/**
 * Helper method to redirect search to Stock SRP
 * @param {Object} $searchBar
 * @param {Object} $assetDropdownSelect
 */
function redirectSearch($searchBar, $assetDropdownSelect) {
  const assetType = getAssetType($assetDropdownSelect);
  const keyword = $searchBar.value.replace(' ', '+');

  // eslint-disable-next-line no-underscore-dangle
  window._satellite.track('event', {
    xdm: {},
    data: {
      web: {
        webInteraction: {
          name: 'search', // Name of the user events- event name should be set here
        },
      },
      _adobe_corpnew: {
        digitalData: {
          'ui.search_keyword': keyword,
          'stk.search.asset_type_selected': assetType,
        }, // Any custom properties required for event
      },
    },
  });

  // @todo env-specific route?
  window.location.href = `https://stock.adobe.com/search/${assetType}?k=${keyword}&search_type=usertyped`;
}

/**
 * Initialization function for search-bar block
 * @see https://github.com/adobecom/milo/blob/main/libs/utils/utils.js#L361
 * @param {Object} el
 */
export default function init(el) {
  // Wrappers for search-bar component
  const $searchFormWrapper = createTag('form', { class: 'search-form-wrapper' });
  const $searchInputWrapper = createTag('div', { class: 'search-input-wrapper' });

  // Wrapper and components for asset dropdown selector
  const $assetDropdownSelectWrapper = createTag('div', { class: 'asset-dropdown-select-wrapper' });
  const $assetDropdownSelectIconWrapper = createTag('div', { class: 'asset-dropdown-select-icon-wrapper' });
  const $assetDropdownSelect = createTag('select', { class: 'asset-dropdown-select' });

  // Search bar input component - search icon and input component
  const $searchInputIconButton = createTag('button', { class: 'search-input-icon-button' });
  const $searchBar = createTag('input', {
    class: 'stock-search-bar',
    type: 'text',
    placeholder: 'Search',
    enterKeyHint: 'Search',
  });

  // Build asset selector dropdown
  assetDropdownList.forEach((assetOption) => {
    const $assetOption = createTag('option', { class: 'asset-dropdown-option', value: assetOption });
    $assetOption.textContent = assetOption;
    $assetDropdownSelect.append($assetOption);
  });

  $assetDropdownSelect.value = getLastSelectedAssetTypeFromCookie() ? getLastSelectedAssetTypeFromCookie() : 'All';
  $assetDropdownSelectWrapper.append($assetDropdownSelect);
  $assetDropdownSelectWrapper.append($assetDropdownSelectIconWrapper);

  // Build Search Bar
  $searchInputWrapper.append($assetDropdownSelectWrapper);
  $searchInputWrapper.append($searchInputIconButton);
  $searchInputWrapper.append($searchBar);
  $searchFormWrapper.append($searchInputWrapper);
  el.append($searchFormWrapper);

  /**
   * Select dropdown "onchange" handler
   * Set cookie to preserve "last_selected_asset_type"
   */
  $assetDropdownSelect.addEventListener('change', (e) => {
    const selectedAssetType = e.currentTarget.value;
    document.cookie = `${LAST_SELECTED_ASSET_TYPE_COOKIE}=${selectedAssetType}`;

    // eslint-disable-next-line no-underscore-dangle
    window._satellite.track('event', {
      xdm: {},
      data: {
        web: {
          webInteraction: {
            name: 'asset-type-change', // Name of the user events- event name should be set here
          },
        },
        _adobe_corpnew: {
          digitalData: {
            'stk.search.asset_type_selected': selectedAssetType,
          }, // Any custom properties required for event
        },
      },
    });
  });

  /**
   * Redirect search with keyword and selected asset to Stock SRP
   * 1. On clicking the "Search" icon
   * 2. On pressing "Enter"
   */
  $searchInputIconButton.addEventListener('click', (e) => {
    e.preventDefault();
    redirectSearch($searchBar, $assetDropdownSelect);
  });
}
