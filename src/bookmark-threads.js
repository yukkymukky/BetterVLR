// Thread bookmarking system for VLR.gg
// Allows users to bookmark game threads, discussion threads, players, teams, and users

// Check if we're on a page with sidebar where we need to inject the bookmark section

function pageToShowBookmarks() {
  return (
    document.querySelector('.col.mod-1') &&
    document.querySelector('.wf-label.mod-sidebar') &&
    document.querySelectorAll('.wf-label.mod-sidebar') &&
    document.querySelector('.wf-label.mod-sidebar').textContent.trim().includes('Stickied Threads') &&
    document.querySelectorAll('.wf-label.mod-sidebar')[1].textContent.trim().includes('Recent Discussion')
  );
}

if (pageToShowBookmarks()) {
  if (JSON.parse(localStorage.getItem("settings")).hide_bookmarked_threads !== true) {
    addBookmarkSection();
  }

  if (JSON.parse(localStorage.getItem("settings")).hide_collapsable_option !== true) {
    addRecentDiscussionToggle();
  }

}

// Check if we're on a thread page to add bookmark buttons
if (isThreadPage()) {
  addBookmarkButton();
}

// Check if we're on a user/player/team page to add bookmark buttons
if (isProfilePage()) {
  addProfileBookmarkButton();
}

// Function to check if current page is a thread (not an article)
function isThreadPage() {
  // Check if we're on a thread page (has threading div and no mod-article)
  const hasThreading = document.querySelector('.threading');
  const hasArticle = document.querySelector('.mod-article');
  const isThreadUrl = /^\/\d+\//.test(window.location.pathname);
  
  return hasThreading && !hasArticle && isThreadUrl;
}

// Function to check if current page is a user/player/team profile page
function isProfilePage() {
  // Check for user/player/team pages based on URL pattern and page structure
  const isUserUrl = /^\/user\//.test(window.location.pathname);
  const isPlayerUrl = /^\/player\//.test(window.location.pathname);
  const isTeamUrl = /^\/team\//.test(window.location.pathname);
  const hasWfNav = document.querySelector('.wf-nav');
  console.log((isUserUrl || isPlayerUrl || isTeamUrl) && hasWfNav)
  return (isUserUrl || isPlayerUrl || isTeamUrl) && hasWfNav;
}

// Function to add bookmark section to sidebar
function addBookmarkSection() {
  // Look for sidebar in col mod-1 - try multiple selectors to find the right place
  let targetLocation = document.querySelector('.js-home-threads'); // Homepage
  
  if (!targetLocation) {
    // Try to find other sidebar locations on different pages
    const sidebar = document.querySelector('.col.mod-1');
    if (sidebar) {
      // Look for existing sections to insert after
      targetLocation = sidebar.querySelector('.wf-card.mod-dark.mod-sidebar:last-child')?.parentNode;
      if (!targetLocation) {
        targetLocation = sidebar.lastElementChild;
      }
    }
  }
  
  if (!targetLocation) return;
  
  // Remove existing bookmark section if it exists
  const existingBookmarks = document.querySelector('.js-home-bookmarks');
  if (existingBookmarks) {
    existingBookmarks.parentElement.remove();
  }

  const showCollapsableOption = JSON.parse(localStorage.getItem("settings")).hide_collapsable_option !== true;
  
  // Get bookmarked items from localStorage and categorize them
  const bookmarkedItems = getBookmarkedItems();
  const categorizedBookmarks = categorizeBookmarks(bookmarkedItems);
  
  // Get saved sidebar state
  const savedState = getSidebarStates();
  const isBookmarksCollapsed = savedState.bookmarks === 'collapsed';
  
  // Create bookmark section HTML (always show title, even if no bookmarks)
  const bookmarkSection = document.createElement('div');
  bookmarkSection.style.marginBottom = '15px';
  
  let bookmarkHTML = `
    <div class="js-home-bookmarks">
      <span class="wf-label mod-sidebar" style="cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between;" 
            onclick="toggleAllBookmarks()" 
            title="Click to collapse/expand bookmarks">
        Bookmarks
        ${showCollapsableOption ? `<i class="fa fa-chevron-${isBookmarksCollapsed ? 'right' : 'down'} bookmark-toggle-arrow" style="font-size: 10px; transition: transform 0.2s; margin-left: 8px;"></i>` : ''}
      </span>
      <div class="bookmark-content-wrapper" style="display: ${isBookmarksCollapsed ? 'none' : 'block'};">
  `;
  
  if (bookmarkedItems.length > 0) {
    // Generate HTML for each category
    Object.entries(categorizedBookmarks).forEach(([category, items]) => {
      if (items.length > 0) {
        const initialLimit = 10;
        const visibleItems = items.slice(0, initialLimit);
        const hiddenItems = items.slice(initialLimit);
        const categoryId = category.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        bookmarkHTML += `
          <div class="wf-card mod-dark mod-sidebar" style="margin-bottom: 8px;">
            <div class="text-of" style="font-size: 9px; padding: 8px 12px; border-bottom: 1px solid #4c545d; text-transform: uppercase; letter-spacing: 0.5px;">
              ${category}
            </div>
            <div class="bookmark-category-${categoryId}">
              ${visibleItems.map((item, index) => `
                <a href="${item.url}" class="wf-module-item mod-disc ${index === 0 ? 'mod-first' : ''}" title="${item.title}">
                  <div class="module-item-title mod-unread">
                    ${item.title}
                  </div>
                  <div class="module-item-bookmark" style="cursor: pointer; color: #da626c; font-size: 12px; padding: 2px 4px; padding-right: 0px; padding-bottom:0px; opacity: 0; transition: opacity 0.2s;" 
                       onclick="event.preventDefault(); event.stopPropagation(); removeBookmark('${item.url}'); refreshBookmarkSection();" 
                       title="Remove bookmark">
                    ✕
                  </div>
                </a>
              `).join('')}
              ${hiddenItems.length > 0 ? `
                <div class="bookmark-hidden-${categoryId}" style="display: none;">
                  ${hiddenItems.map((item, index) => `
                    <a href="${item.url}" class="wf-module-item mod-disc" title="${item.title}">
                      <div class="module-item-title mod-unread">
                        ${item.title}
                      </div>
                      <div class="module-item-bookmark" style="cursor: pointer; color: #da626c; font-size: 12px; padding: 2px 4px; padding-right: 0px; padding-bottom:0px; opacity: 0; transition: opacity 0.2s;" 
                           onclick="event.preventDefault(); event.stopPropagation(); removeBookmark('${item.url}'); refreshBookmarkSection();" 
                           title="Remove bookmark">
                        ✕
                      </div>
                    </a>
                  `).join('')}
                </div>
                <div class="wf-module-item mod-disc bookmark-show-more-${categoryId}" style="color: #999; font-size: 11px; text-align: center; cursor: pointer; padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.1);" 
                     onclick="toggleBookmarkCategory('${categoryId}', ${hiddenItems.length})" 
                     title="Show ${hiddenItems.length} more ${category.toLowerCase()}">
                  Show ${hiddenItems.length} more...
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }
    });
  } else {
    bookmarkHTML += `
      <div class="wf-card mod-dark mod-sidebar">
        <div class="wf-module-item mod-disc" style="color: #999; font-size: 12px; padding: 15px; text-align: center;">
          No bookmarks
        </div>
      </div>
    `;
  }
  
  bookmarkHTML += `
      </div>
    </div>`;
  bookmarkSection.innerHTML = bookmarkHTML;
  
  // Add hover effects for X buttons
  if (bookmarkedItems.length > 0) {
    setTimeout(() => {
      const bookmarkItems = bookmarkSection.querySelectorAll('.wf-module-item.mod-disc');
      bookmarkItems.forEach(item => {
        const removeBtn = item.querySelector('.module-item-bookmark');
        item.addEventListener('mouseenter', () => {
          if (removeBtn) removeBtn.style.opacity = '1';
        });
        item.addEventListener('mouseleave', () => {
          if (removeBtn) removeBtn.style.opacity = '0';
        });
      });
    }, 10);
  }
  
  // Insert bookmark section after the target location
  if (targetLocation.classList && targetLocation.classList.contains('js-home-threads')) {
    // Homepage - insert after recent discussion
    targetLocation.parentNode.insertBefore(bookmarkSection, targetLocation.nextSibling);
  } else {
    // Other pages - append to sidebar
    targetLocation.appendChild(bookmarkSection);
  }
}

// Function to add collapsible functionality to Recent Discussion section
function addRecentDiscussionToggle() {
  // Find the Recent Discussion label
  const sidebarLabels = document.querySelectorAll('.wf-label.mod-sidebar');
  let recentDiscussionLabel = null;
  
  sidebarLabels.forEach(label => {
    if (label.textContent.trim().includes('Recent Discussion')) {
      recentDiscussionLabel = label;
    }
  });
  
  if (!recentDiscussionLabel) return;
  
  // Get saved state from localStorage
  const savedState = getSidebarStates();
  const isCollapsed = savedState.recentDiscussion === 'collapsed';
  
  // Find the associated content (next sibling card)
  const recentDiscussionCard = recentDiscussionLabel.nextElementSibling;
  if (!recentDiscussionCard || !recentDiscussionCard.classList.contains('wf-card')) return;
  
  // Modify the label to be clickable with arrow
  recentDiscussionLabel.style.cssText = `
    cursor: pointer; 
    user-select: none; 
    display: flex; 
    align-items: center; 
    justify-content: space-between;
  `;
  recentDiscussionLabel.title = 'Click to collapse/expand recent discussion';
  
  // Add arrow
  const arrow = document.createElement('i');
  arrow.className = isCollapsed ? 'fa fa-chevron-right' : 'fa fa-chevron-down';
  arrow.classList.add('recent-discussion-toggle-arrow');
  arrow.style.cssText = 'font-size: 10px; transition: transform 0.2s; margin-left: 8px;';
  recentDiscussionLabel.appendChild(arrow);
  
  // Set initial state
  if (isCollapsed) {
    recentDiscussionCard.style.display = 'none';
  }
  
  // Add click handler
  recentDiscussionLabel.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent navigation if it's a link
    e.stopPropagation(); // Stop event bubbling
    toggleRecentDiscussion();
  });
}

// Function to add bookmark button to thread pages
function addBookmarkButton() {
  // For game threads - add to match header
  const matchHeader = document.querySelector('.match-header');
  if (matchHeader) {
    addGameThreadBookmark(matchHeader);
    return;
  }
  
  // For discussion threads - add to first post header
  const firstPost = document.querySelector('.threading .post[data-post-id]');
  if (firstPost) {
    addDiscussionThreadBookmark(firstPost);
  }
}

// Function to add bookmark button to game threads
function addGameThreadBookmark(matchHeader) {
  const currentUrl = window.location.href.split('?')[0]; // Remove query params
  let isBookmarked = isThreadBookmarked(currentUrl);
  
  // Get thread title from teams
  const team1 = matchHeader.querySelector('.match-header-link-name.mod-1 .wf-title-med');
  const team2 = matchHeader.querySelector('.match-header-link-name.mod-2 .wf-title-med');
  const event = matchHeader.querySelector('.match-header-event div[style*="font-weight: 700"]');
  
  let title = 'Match Thread';
  if (team1 && team2) {
    title = `${team1.textContent.trim()} vs ${team2.textContent.trim()}`;
    if (event) {
      title += ` – ${event.textContent.trim()}`;
    }
  }
  
  // Find a suitable location in the match header to add bookmark action
  // Look for existing action elements or create an actions area
  let actionsArea = matchHeader.querySelector('.match-header-actions');
  if (!actionsArea) {
    // Create an invisible actions area similar to thread posts
    actionsArea = document.createElement('div');
    actionsArea.className = 'match-header-actions';
    actionsArea.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.2s;
      font-size: 11px;
      // background: rgba(0,0,0,0.8);
      padding: 4px 6px;
      border-radius: 2px;
    `;
    
    // Make match header relative positioned
    matchHeader.style.position = 'relative';
    matchHeader.appendChild(actionsArea);
    
    // Show actions on hover
    matchHeader.addEventListener('mouseenter', () => {
      actionsArea.style.opacity = '1';
    });
    
    matchHeader.addEventListener('mouseleave', () => {
      actionsArea.style.opacity = '0';
    });
  }
  
  // Create bookmark button
  const bookmarkBtn = document.createElement('a');
  bookmarkBtn.className = 'match-action game-bookmark-btn';
  bookmarkBtn.style.cssText = `
    cursor: pointer;
    color: ${isBookmarked ? '#da626c' : '#ccc'};
    text-decoration: none;
    font-size: 11px;
  `;
  
  function updateBookmarkBtn() {
    isBookmarked = isThreadBookmarked(currentUrl);
    bookmarkBtn.innerHTML = isBookmarked ? 'bookmarked' : 'bookmark';
    bookmarkBtn.style.color = isBookmarked ? '#da626c' : '#ccc';
    bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this thread';
  }
  
  updateBookmarkBtn();
  
  // Add hover effect
  bookmarkBtn.addEventListener('mouseenter', () => {
    if (!isBookmarked) bookmarkBtn.style.color = '#da626c';
  });
  
  bookmarkBtn.addEventListener('mouseleave', () => {
    bookmarkBtn.style.color = isBookmarked ? '#da626c' : '#ccc';
  });
  
  // Add click handler
  bookmarkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBookmarked) {
      removeBookmark(currentUrl);
    } else {
      addBookmark(currentUrl, title, 'Game');
    }
    
    updateBookmarkBtn();
    refreshBookmarkSection(); // Update UI when bookmark is added/removed
  });
  
  actionsArea.appendChild(bookmarkBtn);
}

// Function to add bookmark button to discussion threads
function addDiscussionThreadBookmark(firstPost) {
  const currentUrl = window.location.href.split('?')[0]; // Remove query params
  let isBookmarked = isThreadBookmarked(currentUrl);
  
  // Get thread title from URL or page title
  const urlParts = window.location.pathname.split('/');
  let title = 'Discussion Thread';
  if (urlParts.length >= 3) {
    title = urlParts[2].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  // Also try to get title from page title
  const pageTitle = document.title;
  if (pageTitle && pageTitle !== 'VLR.gg') {
    // Remove both possible VLR.gg suffixes
    title = pageTitle.replace(/ - VLR\.gg$/, '').replace(/ \| VLR\.gg$/, '');
  }
  
  // Find the post footer where we'll add the bookmark button
  const postFooter = firstPost.querySelector('.post-footer .noselect');
  if (!postFooter) return;
  
  // Create bookmark button
  const bookmarkBtn = document.createElement('a');
  bookmarkBtn.className = 'post-action discussion-bookmark-btn';
  bookmarkBtn.style.cursor = 'pointer';
  bookmarkBtn.style.color = isBookmarked ? '#da626c' : '';
  
  function updateBookmarkBtn() {
    isBookmarked = isThreadBookmarked(currentUrl);
    bookmarkBtn.innerHTML = isBookmarked ? 'bookmarked' : 'bookmark';
    bookmarkBtn.style.color = isBookmarked ? '#da626c' : '';
    bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this thread';
  }
  
  updateBookmarkBtn();
  
  // Add click handler
  bookmarkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBookmarked) {
      removeBookmark(currentUrl);
    } else {
      addBookmark(currentUrl, title, 'Thread');
    }
    
    updateBookmarkBtn();
    refreshBookmarkSection(); // Update UI when bookmark is added/removed
  });
  
  // Add separator and bookmark button
  const separator = document.createElement('span');
  separator.className = 'post-action-div';
  separator.textContent = '•';
  
  postFooter.insertBefore(separator, postFooter.firstChild);
  postFooter.insertBefore(bookmarkBtn, postFooter.firstChild);
}

// Function to add bookmark button to user/player/team pages
function addProfileBookmarkButton() {
  // Find the nav container to insert bookmark button at the end
  const wfNav = document.querySelector('.wf-nav');
  if (!wfNav) return;
  
  const currentUrl = window.location.href.split('?')[0]; // Remove query params
  let isBookmarked = isItemBookmarked(currentUrl);
  
  // Determine the type and get appropriate title
  const { type, title } = getProfileInfo();
  
  // Create bookmark button that looks like a nav item
  const bookmarkBtn = document.createElement('div');
  bookmarkBtn.className = 'wf-nav-item profile-bookmark-btn';
  bookmarkBtn.style.cssText = `
    cursor: pointer;
    transition: all 0.2s;
    color: ${isBookmarked ? '#da626c' : 'inherit'};
  `;
  
  bookmarkBtn.innerHTML = `
    <div class="wf-nav-item-title" style="cursor: pointer;">
      ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </div>
  `;
  
  function updateBookmarkBtn() {
    isBookmarked = isItemBookmarked(currentUrl);
    bookmarkBtn.innerHTML = `
      <div class="wf-nav-item-title">
        ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </div>
    `;
    bookmarkBtn.style.color = isBookmarked ? '#da626c' : 'inherit';
    bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : `Bookmark this ${type.toLowerCase()}`;
  }
  
  updateBookmarkBtn();
  
  // Add hover effect
  bookmarkBtn.addEventListener('mouseenter', () => {
    if (!isBookmarked) {
      bookmarkBtn.style.color = '#da626c';
      bookmarkBtn.style.opacity = '0.8';
    }
  });
  
  bookmarkBtn.addEventListener('mouseleave', () => {
    bookmarkBtn.style.color = isBookmarked ? '#da626c' : 'inherit';
    bookmarkBtn.style.opacity = '1';
  });
  
  // Add click handler
  bookmarkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBookmarked) {
      removeBookmark(currentUrl);
    } else {
      addBookmark(currentUrl, title, type);
    }
    
    updateBookmarkBtn();
    refreshBookmarkSection(); // Update UI when bookmark is added/removed
  });
  
  // Insert bookmark button at the end of the nav
  wfNav.appendChild(bookmarkBtn);
}

// Function to get profile information (type and title)
function getProfileInfo() {
  const pathname = window.location.pathname;
  let type = 'Profile';
  let title = 'Profile';
  
  if (pathname.startsWith('/user/')) {
    type = 'User';
    // Get username from URL or page
    const username = pathname.split('/')[2];
    const userHeader = document.querySelector('.wf-title');
    title = userHeader ? userHeader.textContent.trim() : username;
  } else if (pathname.startsWith('/player/')) {
    type = 'Player';
    // Get player name from page
    const playerHeader = document.querySelector('.wf-title');
    const playerName = playerHeader ? playerHeader.textContent.trim() : 'Player';
    title = playerName;
  } else if (pathname.startsWith('/team/')) {
    type = 'Team';
    // Get team name from page
    const teamHeader = document.querySelector('.wf-title');
    const teamName = teamHeader ? teamHeader.textContent.trim() : 'Team';
    title = teamName;
  }
  
  return { type, title };
}

// Function to categorize bookmarks by type
function categorizeBookmarks(bookmarks) {
  const categories = {
    'Games': [],
    'Teams': [],
    'Players': [],
    'Threads': [],
    'Users': []
  };
  
  bookmarks.forEach(bookmark => {
    const type = bookmark.type || 'Threads'; // Default to Threads for backward compatibility
    
    if (type === 'Player') {
      categories['Players'].push(bookmark);
    } else if (type === 'Team') {
      categories['Teams'].push(bookmark);
    } else if (type === 'User') {
      categories['Users'].push(bookmark);
    } else if (bookmark.url.includes('/match/') || bookmark.url.match(/\/\d+.*vs/)) {
      categories['Games'].push(bookmark);
    } else {
      categories['Threads'].push(bookmark);
    }
  });
  
  return categories;
}

// Function to get bookmarked items from localStorage
function getBookmarkedItems() {
  try {
    const bookmarks = localStorage.getItem('vlr_bookmarked_items');
    if (bookmarks) {
      return JSON.parse(bookmarks);
    }
    
    // Migrate old thread bookmarks if they exist
    const oldBookmarks = localStorage.getItem('vlr_bookmarked_threads');
    if (oldBookmarks) {
      const parsed = JSON.parse(oldBookmarks);
      // Convert old format to new format
      const migrated = parsed.map(bookmark => ({
        ...bookmark,
        type: bookmark.type || 'Thread'
      }));
      saveBookmarkedItems(migrated);
      localStorage.removeItem('vlr_bookmarked_threads'); // Clean up old storage
      return migrated;
    }
    
    return [];
  } catch (e) {
    console.error('Error reading bookmarks:', e);
    return [];
  }
}

// Function to save bookmarked items to localStorage
function saveBookmarkedItems(bookmarks) {
  try {
    localStorage.setItem('vlr_bookmarked_items', JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks:', e);
  }
}

// Function to normalize URLs for consistent bookmarking
function normalizeUrl(url) {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;
    
    // Remove trailing slash
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }
    
    // For user/player/team pages, remove additional path segments and normalize to base URL
    const userMatch = pathname.match(/^\/user\/([^\/]+)/);
    
    // Player URL patterns:
    // /player/id/name or /player/matches/id/name or /player/stats/id/name etc.
    const playerMatch = pathname.match(/^\/player\/(?:matches\/|stats\/)?(\d+)\/([^\/]+)/);
    
    // Team URL patterns:
    // /team/id/name or /team/matches/id/name or /team/stats/id/name or /team/news/id/name etc.
    const teamMatch = pathname.match(/^\/team\/(?:matches\/|stats\/|news\/|transactions\/)?(\d+)\/([^\/]+)/);
    
    if (userMatch) {
      // Normalize user URLs: /user/username (remove any additional paths)
      return `${urlObj.origin}/user/${userMatch[1]}`;
    } else if (playerMatch) {
      // Normalize player URLs: /player/id/name (remove any additional paths like /matches)
      return `${urlObj.origin}/player/${playerMatch[1]}/${playerMatch[2]}`;
    } else if (teamMatch) {
      // Normalize team URLs: /team/id/name (remove any additional paths like /news, /transactions)
      return `${urlObj.origin}/team/${teamMatch[1]}/${teamMatch[2]}`;
    }
    
    // For thread URLs, keep the base path but remove query params and hash
    return `${urlObj.origin}${pathname}`;
  } catch (e) {
    console.error('Error normalizing URL:', e);
    // Fallback: just remove query params and hash
    return url.split('?')[0].split('#')[0];
  }
}

// Backward compatibility function
function getBookmarkedThreads() {
  return getBookmarkedItems().filter(item => 
    !item.type || item.type === 'Thread' || item.type === 'Game'
  );
}

// Backward compatibility function
function isThreadBookmarked(url) {
  return isItemBookmarked(url);
}

// Function to check if an item is bookmarked
function isItemBookmarked(url) {
  const normalizedUrl = normalizeUrl(url);
  const bookmarks = getBookmarkedItems();
  return bookmarks.some(bookmark => normalizeUrl(bookmark.url) === normalizedUrl);
}

// Function to add a bookmark
function addBookmark(url, title, type = 'Thread') {
  const normalizedUrl = normalizeUrl(url);
  const bookmarks = getBookmarkedItems();
  
  // Check if already bookmarked (using normalized URLs)
  if (bookmarks.some(bookmark => normalizeUrl(bookmark.url) === normalizedUrl)) {
    return;
  }
  
  // Add new bookmark to the beginning of the array (store normalized URL)
  bookmarks.unshift({
    url: normalizedUrl,
    title: title,
    type: type,
    timestamp: Date.now()
  });
  
  // Keep only the latest 50 bookmarks
  if (bookmarks.length > 50) {
    bookmarks.splice(50);
  }
  
  saveBookmarkedItems(bookmarks);
}

// Function to remove a bookmark
function removeBookmark(url) {
  const normalizedUrl = normalizeUrl(url);
  const bookmarks = getBookmarkedItems();
  const filteredBookmarks = bookmarks.filter(bookmark => normalizeUrl(bookmark.url) !== normalizedUrl);
  saveBookmarkedItems(filteredBookmarks);
}

// Function to refresh bookmark section without page reload
function refreshBookmarkSection() {
  if (pageToShowBookmarks()) {
    addBookmarkSection();
  }
}

// Function to toggle bookmark category expansion
function toggleBookmarkCategory(categoryId, hiddenCount) {
  const hiddenSection = document.querySelector(`.bookmark-hidden-${categoryId}`);
  const showMoreBtn = document.querySelector(`.bookmark-show-more-${categoryId}`);
  
  if (hiddenSection && showMoreBtn) {
    const isHidden = hiddenSection.style.display === 'none';
    
    if (isHidden) {
      // Show hidden items
      hiddenSection.style.display = 'block';
      showMoreBtn.innerHTML = 'Show less...';
      showMoreBtn.title = 'Show fewer items';
    } else {
      // Hide items
      hiddenSection.style.display = 'none';
      showMoreBtn.innerHTML = `Show ${hiddenCount} more...`;
      showMoreBtn.title = `Show ${hiddenCount} more items`;
    }
  }
}

// Function to get sidebar collapse states from localStorage
function getSidebarStates() {
  try {
    const states = localStorage.getItem('vlr_sidebar_states');
    return states ? JSON.parse(states) : {
      bookmarks: 'expanded',
      recentDiscussion: 'expanded'
    };
  } catch (e) {
    console.error('Error reading sidebar states:', e);
    return {
      bookmarks: 'expanded',
      recentDiscussion: 'expanded'
    };
  }
}

// Function to save sidebar collapse states to localStorage
function saveSidebarStates(states) {
  try {
    localStorage.setItem('vlr_sidebar_states', JSON.stringify(states));
  } catch (e) {
    console.error('Error saving sidebar states:', e);
  }
}

// Function to toggle entire bookmarks section
function toggleAllBookmarks() {
  const contentWrapper = document.querySelector('.bookmark-content-wrapper');
  const toggleArrow = document.querySelector('.bookmark-toggle-arrow');
  
  if (contentWrapper && toggleArrow) {
    const isHidden = contentWrapper.style.display === 'none';
    const savedState = getSidebarStates();
    
    if (isHidden) {
      // Show bookmarks
      contentWrapper.style.display = 'block';
      toggleArrow.className = 'fa fa-chevron-down bookmark-toggle-arrow';
      toggleArrow.style.transform = 'rotate(0deg)';
      savedState.bookmarks = 'expanded';
    } else {
      // Hide bookmarks
      contentWrapper.style.display = 'none';
      toggleArrow.className = 'fa fa-chevron-right bookmark-toggle-arrow';
      toggleArrow.style.transform = 'rotate(0deg)';
      savedState.bookmarks = 'collapsed';
    }
    
    saveSidebarStates(savedState);
  }
}

// Function to toggle Recent Discussion section
function toggleRecentDiscussion() {
  const recentDiscussionLabels = document.querySelectorAll('.wf-label.mod-sidebar');
  let recentDiscussionLabel = null;
  
  recentDiscussionLabels.forEach(label => {
    if (label.textContent.trim().includes('Recent Discussion')) {
      recentDiscussionLabel = label;
    }
  });
  
  if (!recentDiscussionLabel) return;
  
  const recentDiscussionCard = recentDiscussionLabel.nextElementSibling;
  const toggleArrow = recentDiscussionLabel.querySelector('.recent-discussion-toggle-arrow');
  
  if (recentDiscussionCard && toggleArrow) {
    const isHidden = recentDiscussionCard.style.display === 'none';
    const savedState = getSidebarStates();
    
    if (isHidden) {
      // Show recent discussion
      recentDiscussionCard.style.display = 'block';
      toggleArrow.className = 'fa fa-chevron-down recent-discussion-toggle-arrow';
      savedState.recentDiscussion = 'expanded';
    } else {
      // Hide recent discussion
      recentDiscussionCard.style.display = 'none';
      toggleArrow.className = 'fa fa-chevron-right recent-discussion-toggle-arrow';
      savedState.recentDiscussion = 'collapsed';
    }
    
    saveSidebarStates(savedState);
  }
}

// Make functions available globally for HTML onclick handlers
window.removeBookmark = removeBookmark;
window.refreshBookmarkSection = refreshBookmarkSection;
window.toggleBookmarkCategory = toggleBookmarkCategory;
window.toggleAllBookmarks = toggleAllBookmarks;
window.toggleRecentDiscussion = toggleRecentDiscussion;
