import { initializeComparePage } from './compare-page.js';

// Add Compare link to the main navigation bar IMMEDIATELY
function addCompareToNavbar() {
    // Check if Compare link already exists to prevent duplicates
    if (document.querySelector('.header-nav-item.mod-compare')) {
        return; // Compare link already exists
    }

    // Find the Stats nav item to insert Compare after it
    const statsNavItem = document.querySelector('.header-nav-item.mod-stats');
    
    if (statsNavItem) {
        // Create the compare navigation elements following VLR's pattern
        const compareLink = document.createElement('a');
        compareLink.href = '/compare';
        compareLink.className = 'header-nav-item mod-compare mod-vlr';
        compareLink.textContent = 'Compare';
        compareLink.style.position = 'relative';
        
        // Create the right border div
        const compareDivRight = document.createElement('div');
        compareDivRight.className = 'header-div';
        
        // Find the header-div after Stats nav item
        const statsDiv = statsNavItem.nextElementSibling;
        
        if (statsDiv && statsDiv.classList.contains('header-div')) {
            // Insert compare link after the stats div (this becomes our left border)
            statsDiv.insertAdjacentElement('afterend', compareLink);
            // Add the right border div after the compare link
            compareLink.insertAdjacentElement('afterend', compareDivRight);
        }
        
        console.log('Compare link added to navbar');
    }
    
    // Also add to mobile menu
    const mobileStatsItem = document.querySelector('.header-menu-item.mod-mobile.mod-stats');
    if (mobileStatsItem && !document.querySelector('.header-menu-item.mod-mobile.mod-compare')) {
        const mobileCompareLink = document.createElement('a');
        mobileCompareLink.href = '/compare';
        mobileCompareLink.className = 'header-menu-item mod-mobile mod-compare';
        mobileCompareLink.textContent = 'Compare';
        
        mobileStatsItem.insertAdjacentElement('afterend', mobileCompareLink);
        console.log('Compare link added to mobile menu');
    }
}

// Initialize immediately
addCompareToNavbar();
initializeComparePage();