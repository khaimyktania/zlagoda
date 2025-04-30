/**
 * Centralized tab navigation system
 * This file handles all tab switching and ensures correct data loading
 */

// Store the current active tab to prevent unnecessary reloading
let currentActiveTab = null;

// Initialize the tab navigation system
function initTabNavigation() {
    console.log("Initializing centralized tab navigation system");

    // Remove any existing click handlers on tabs to prevent duplicates
    $('.tab-link').off('click');

    // Add unified tab click handler
    $('.tab-link').on('click', function(e) {
        const targetTab = this.getAttribute('href') || this.getAttribute('data-target');
        switchToTab(targetTab);
    });

    // Initialize with the currently active tab, if any
    const activeTab = $('.tab-link.active').attr('href') || $('.tab-link.active').attr('data-target');
    if (activeTab) {
        switchToTab(activeTab, true);
    }
}

// Switch to a specific tab and load appropriate data
function switchToTab(tabId, skipAnimation = false) {
    console.log(`Switching to tab: ${tabId}`);

    // Skip if we're already on this tab
    if (tabId === currentActiveTab && !skipAnimation) {
        console.log(`Already on tab: ${tabId}, skipping`);
        return;
    }

    // Update current active tab tracker
    currentActiveTab = tabId;

    // Clear page data before loading new content
    clearAllPageData();

    // Load data for the selected tab
    loadTabData(tabId);

    // Update UI to show active tab
    $('.tab-link').removeClass('active');
    $(`.tab-link[href="${tabId}"], .tab-link[data-target="${tabId}"]`).addClass('active');
}

// Clear all page data thoroughly
function clearAllPageData() {
    console.log("Clearing all page data");

    // Clear tables
    $('table tbody').empty();

    // Reset all forms
    $('form').each(function() {
        this.reset();
    });

    // Clear any status messages or results
    $('#filterStatus').text('');
    $('#contactInfoResult').empty().hide();
    $('#dataContainer').empty();

    // Reset search fields
    $('#searchSurname').val('');
    $('#upcSearch').val('');

    // Close any open modals
    $('.modal').modal('hide');
}

// Load appropriate data based on the active tab
function loadTabData(tabId) {
    console.log(`Loading data for tab: ${tabId}`);

    if (tabId.includes('categories') || tabId === '#categories') {
        if (typeof loadCategories === 'function') {
            console.log("Loading categories data");
            loadCategories();
        }
    }
    else if (tabId.includes('products') || tabId === '#products') {
        if (typeof loadProducts === 'function') {
            console.log("Loading products data");
            loadProducts();
        }
    }
    else if (tabId.includes('customers') || tabId === '#customers') {
        if (typeof loadCustomers === 'function') {
            console.log("Loading customers data");
            loadCustomers();
        }
    }
    else if (tabId.includes('employees') || tabId === '#employees') {
        if (typeof loadEmployees === 'function') {
            console.log("Loading employees data");
            loadEmployees();
        }
    }
    else if (tabId.includes('store-products') || tabId === '#store-products') {
        if (typeof loadStoreProducts === 'function') {
            console.log("Loading store products data");
            loadStoreProducts();
            // Reset the filter status if needed
            if ($('#filterStatus').length) {
                $('#filterStatus').text("No filter applied");
            }
        }
    }
}

// Initialize the navigation system when the document is ready
$(document).ready(function() {
    initTabNavigation();
});