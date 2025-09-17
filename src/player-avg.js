if (window.location.href.startsWith('https://www.vlr.gg/player/')) {
  // Add Compare button to player navigation
  function addCompareButton() {
    const nav = document.querySelector('.wf-nav');
    if (!nav) return;
    
    // Check if compare button already exists
    if (nav.querySelector('.wf-nav-item.mod-compare')) return;
    
    // Get current player URL
    const currentPlayerUrl = window.location.href;
    
    // Create compare button
    const compareItem = document.createElement('a');
    compareItem.className = 'wf-nav-item mod-compare';
    compareItem.href = '#';
    
    const compareTitle = document.createElement('div');
    compareTitle.className = 'wf-nav-item-title';
    compareTitle.textContent = 'Compare';
    
    compareItem.appendChild(compareTitle);
    
    // Add click handler for compare button
    compareItem.addEventListener('click', (e) => { 
      e.preventDefault();
      handleCompareClick(currentPlayerUrl);
    });
    
    // Add the compare button after the "Match History" item
    const matchHistoryItem = nav.querySelector('a[href*="/player/matches/"]');
    if (matchHistoryItem) {
      matchHistoryItem.insertAdjacentElement('afterend', compareItem);
    } else {
      // Fallback: add at the end
      nav.appendChild(compareItem);
    }
  }
  
  // Handle compare button click
  function handleCompareClick(playerUrl) {
    try {
      // Get stored compare URLs from localStorage
      const storedUrls = getStoredCompareUrls();
      
      // If this player is already stored, remove it
      const filteredUrls = storedUrls.filter(url => url !== playerUrl);
      
      // Add current player URL
      filteredUrls.push(playerUrl);
      
      // Keep only the last 2 URLs
      const compareUrls = filteredUrls.slice(-2);
      
      // Store in localStorage
      localStorage.setItem('vlr_compare_players', JSON.stringify(compareUrls));
      
      // Show notification
      showCompareNotification(compareUrls);
      
      // If we have 2 players, enable comparison
      if (compareUrls.length === 2) {
        // Extract player IDs from URLs
        const player1Id = extractPlayerIdFromUrl(compareUrls[0]);
        const player2Id = extractPlayerIdFromUrl(compareUrls[1]);
        
        if (player1Id && player2Id) {
          // Navigate to compare page with improved redirect
          const compareUrl = `/compare?p1=${player1Id}&p2=${player2Id}`;
          console.log('Navigating to:', compareUrl);
          
          // Try multiple redirect methods for better reliability
          try {
            window.location.href = compareUrl;
          } catch (e) {
            console.warn('window.location.href failed, trying alternative method:', e);
            try {
              window.location.assign(compareUrl);
            } catch (e2) {
              console.warn('window.location.assign failed, trying window.open:', e2);
              window.open(compareUrl, '_self');
            }
          }
        } else {
          console.error('Failed to extract player IDs from URLs:', compareUrls);
          showErrorNotification('Failed to extract player information. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in handleCompareClick:', error);
      showErrorNotification('Something went wrong. Please try again.');
    }
  }
  
  // Get stored compare URLs
  function getStoredCompareUrls() {
    try {
      const stored = localStorage.getItem('vlr_compare_players');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
  
  // Extract player ID from URL
  function extractPlayerIdFromUrl(url) {
    const match = url.match(/\/player\/(\d+)\//);
    return match ? match[1] : null;
  }
  
  // Show notification about compare status
  function showCompareNotification(compareUrls) {
    // Remove existing notification
    const existingNotification = document.querySelector('.compare-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'compare-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2c3035;
      border: 1px solid #5b6167;
      border-radius: 4px;
      padding: 15px;
      color: #fff;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      min-width: 250px;
    `;
    
    let message = '';
    let subMessage = '';
    
    if (compareUrls.length === 1) {
      const playerName = getPlayerNameFromPage();
      message = `${playerName} added to comparison.`;
      subMessage = 'Add one more player to compare.';
    } else if (compareUrls.length === 2) {
      message = `Redirecting to comparison page...`;
      subMessage = '<div style="margin-top: 8px; color: #da626c;">Loading comparison...</div>';
    }
    
    notification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">Compare Players</div>
      <div>${message}</div>
      ${subMessage ? `<div style="margin-top: 4px; color: #ccc; font-size: 12px;">${subMessage}</div>` : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
  
  // Show error notification
  function showErrorNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.compare-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'compare-notification';
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2c3035;
      border: 1px solid #da626c;
      border-radius: 4px;
      padding: 15px;
      color: #fff;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      min-width: 250px;
    `;
    
    notification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #da626c;">Compare Error</div>
      <div>${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  
  // Get player name from page
  function getPlayerNameFromPage() {
    const playerNameEl = document.querySelector('.player-header .player-header-name');
    return playerNameEl ? playerNameEl.textContent.trim() : 'Player';
  }
  
  // Initialize compare button
  addCompareButton();

  const agents = {
    Duelist: [
      'Phoenix',
      'Jett',
      'Reyna',
      'Raze',
      'Yoru',
      'Neon',
      'Iso',
      'Waylay'
    ],
    Controller: ['Brimstone', 'Viper', 'Omen', 'Astra', 'Harbor', 'Clove'],
    Initiator: ['Sova', 'Breach', 'Skye', 'KAYO', 'Fade', 'Gekko', 'Tejo'],
    Sentinel: ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse']
  }

  // Add agent filter UI
  function addAgentFilter () {
    const agentsLabel = document.querySelector('.player-stats-filter')
    if (!agentsLabel) return

    // Create dropdown button (no container needed)
    const dropdownBtn = document.createElement('button')
    dropdownBtn.className = 'player-stats-filter-btn'
    dropdownBtn.textContent = 'FILTER'
    dropdownBtn.style.position = 'relative'
    dropdownBtn.style.background = '#da626c'
    dropdownBtn.style.border = 'none'
    dropdownBtn.style.boxShadow = '0 1px 3px -1px rgba(0, 0, 0, 0.8)'
    dropdownBtn.style.borderRadius = '2px'
    dropdownBtn.style.fontWeight = '700'
    dropdownBtn.style.fontSize = '11px'
    dropdownBtn.style.color = '#fff'
    dropdownBtn.style.padding = '4px 8px'
    dropdownBtn.style.cursor = 'pointer'
    dropdownBtn.style.textAlign = 'center'
    dropdownBtn.style.display = 'inline-flex'
    dropdownBtn.style.alignItems = 'center'
    dropdownBtn.style.justifyContent = 'center'
    dropdownBtn.style.marginLeft = '8px'

    // Create dropdown content
    const dropdownContent = document.createElement('div')
    dropdownContent.style.display = 'none'
    dropdownContent.style.position = 'absolute'
    dropdownContent.style.top = '100%'
    dropdownContent.style.left = '0'
    dropdownContent.style.background = '#2c3035'
    dropdownContent.style.border = '1px solid #5b6167'
    dropdownContent.style.borderTop = 'none'
    dropdownContent.style.minWidth = '250px'
    dropdownContent.style.zIndex = '1000'
    dropdownContent.style.maxHeight = '300px'
    dropdownContent.style.overflowY = 'auto'

    // Track selected agents
    let selectedAgents = new Set()

    // Initially select all agents that are present in the table
    const tableRows = document.querySelectorAll(
      '.wf-table tbody tr:not([data-avg-row])'
    )
    tableRows.forEach(row => {
      const img = row.querySelector('img[src*="/agents/"]')
      if (img) {
        const agentName = img.alt
        selectedAgents.add(agentName.toLowerCase())
      }
    })

    // Create role sections
    Object.keys(agents).forEach(role => {
      const roleSection = document.createElement('div')
      roleSection.style.padding = '8px'
      roleSection.style.borderBottom = '1px solid #5b6167'

      // Role header with checkbox
      const roleHeader = document.createElement('div')
      roleHeader.style.display = 'flex'
      roleHeader.style.alignItems = 'center'
      roleHeader.style.marginBottom = '4px'
      roleHeader.style.fontWeight = 'bold'
      roleHeader.style.fontSize = '12px'

      const roleCheckbox = document.createElement('input')
      roleCheckbox.type = 'checkbox'
      roleCheckbox.checked = true
      roleCheckbox.style.marginRight = '6px'

      const roleLabel = document.createElement('span')
      roleLabel.textContent = role
      roleLabel.style.color = '#fff'

      roleHeader.appendChild(roleCheckbox)
      roleHeader.appendChild(roleLabel)
      roleSection.appendChild(roleHeader)

      // Agent checkboxes
      const agentList = document.createElement('div')
      agentList.style.marginLeft = '20px'

      agents[role].forEach(agent => {
        const agentItem = document.createElement('div')
        agentItem.style.display = 'flex'
        agentItem.style.alignItems = 'center'
        agentItem.style.marginBottom = '2px'

        const agentCheckbox = document.createElement('input')
        agentCheckbox.type = 'checkbox'
        agentCheckbox.checked = selectedAgents.has(agent.toLowerCase())
        agentCheckbox.style.marginRight = '6px'
        agentCheckbox.dataset.agent = agent.toLowerCase()
        agentCheckbox.dataset.role = role

        const agentLabel = document.createElement('span')
        agentLabel.textContent = agent
        agentLabel.style.color = '#ccc'
        agentLabel.style.fontSize = '11px'

        // Check if this agent is actually in the table
        const isInTable = Array.from(tableRows).some(row => {
          const img = row.querySelector('img[src*="/agents/"]')
          return img && img.alt.toLowerCase() === agent.toLowerCase()
        })

        if (!isInTable) {
          agentItem.style.opacity = '0.5'
          agentCheckbox.disabled = true
        }

        agentItem.appendChild(agentCheckbox)
        agentItem.appendChild(agentLabel)
        agentList.appendChild(agentItem)

        // Agent checkbox change handler
        agentCheckbox.addEventListener('change', () => {
          if (agentCheckbox.checked) {
            selectedAgents.add(agent.toLowerCase())
          } else {
            selectedAgents.delete(agent.toLowerCase())
          }
          updateRoleCheckbox()
          applyFilter()
          // Don't close dropdown when selecting agents
        })
      })

      roleSection.appendChild(agentList)
      dropdownContent.appendChild(roleSection)

      // Role checkbox change handler
      roleCheckbox.addEventListener('change', () => {
        const roleAgentCheckboxes = agentList.querySelectorAll(
          'input[type="checkbox"]:not(:disabled)'
        )
        roleAgentCheckboxes.forEach(cb => {
          cb.checked = roleCheckbox.checked
          const agent = cb.dataset.agent
          if (roleCheckbox.checked) {
            selectedAgents.add(agent)
          } else {
            selectedAgents.delete(agent)
          }
        })
        applyFilter()
      })

      // Update role checkbox based on agent selections
      function updateRoleCheckbox () {
        const roleAgentCheckboxes = agentList.querySelectorAll(
          'input[type="checkbox"]:not(:disabled)'
        )
        const checkedCount = agentList.querySelectorAll(
          'input[type="checkbox"]:checked:not(:disabled)'
        ).length
        roleCheckbox.checked = checkedCount > 0
        roleCheckbox.indeterminate =
          checkedCount > 0 && checkedCount < roleAgentCheckboxes.length
      }
    })

    dropdownBtn.appendChild(dropdownContent)

    // Add the filter button as a child of the Agents label
    agentsLabel.appendChild(dropdownBtn)

    // Toggle dropdown
    let isDropdownOpen = false
    dropdownBtn.addEventListener('click', e => {
      e.stopPropagation()
      isDropdownOpen = !isDropdownOpen
      dropdownContent.style.display = isDropdownOpen ? 'block' : 'none'
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      if (!dropdownBtn.contains(e.target)) {
        isDropdownOpen = false
        dropdownContent.style.display = 'none'
      }
    })

    // Prevent dropdown from closing when clicking inside
    dropdownContent.addEventListener('click', e => {
      e.stopPropagation()
    })

    // Filter function
    function applyFilter () {
      if (window.filterTable) {
        window.filterTable()
      }
    }

    return { selectedAgents, applyFilter }
  }

  const table = document.querySelector('.wf-table tbody')
  if (!table) return

  const rows = table.querySelectorAll('tr')

  const colFormats = [
    { type: 'skip' }, // agent
    { type: 'skip' }, // use
    { type: 'int', cls: 'mod-right' }, // RND
    { type: 'float2', cls: 'mod-center' }, // Rating
    { type: 'float1', cls: 'mod-right' }, // ACS
    { type: 'float2', cls: 'mod-right' }, // K:D
    { type: 'float1', cls: 'mod-right' }, // ADR
    { type: 'pct', cls: 'mod-right' }, // KAST
    { type: 'float2', cls: 'mod-right' }, // KPR
    { type: 'float2', cls: 'mod-right' }, // APR
    { type: 'float2', cls: 'mod-right' }, // FKPR
    { type: 'float2', cls: 'mod-right' }, // FDPR
    { type: 'int', cls: 'mod-right' }, // K
    { type: 'int', cls: 'mod-right' }, // D
    { type: 'int', cls: 'mod-right' }, // A
    { type: 'int', cls: 'mod-right' }, // FK
    { type: 'int', cls: 'mod-right' } // FD
  ]

  const filterSystem = addAgentFilter()

  function calculateAverages () {
    const sums = Array(colFormats.length).fill(0)
    let rowCount = 0

    // Only count visible rows (not hidden by filter)
    const visibleRows = table.querySelectorAll(
      "tr:not([data-avg-row]):not([style*='display: none'])"
    )

    visibleRows.forEach(row => {
      const cells = row.querySelectorAll('td')
      colFormats.forEach((fmt, i) => {
        if (fmt.type === 'skip') return
        let val = cells[i].innerText.trim().replace('%', '')
        val = parseFloat(val)
        if (!isNaN(val)) sums[i] += val
      })
      rowCount++
    })

    return { sums, rowCount }
  }

  function updateAverageRow () {
    let avgRow = table.querySelector('tr[data-avg-row]')
    if (avgRow) {
      avgRow.remove()
    }

    const { sums, rowCount } = calculateAverages()

    if (rowCount === 0) return 

    // Create new avg row
    avgRow = document.createElement('tr')
    avgRow.setAttribute('data-avg-row', 'true')

    colFormats.forEach((fmt, i) => {
      const td = document.createElement('td')
      td.style.borderTop = '2px double #5b6167'
      if (fmt.type === 'skip') {
        if (i === 0) {
          // agent col
          td.textContent = 'AVG'
          td.style.fontWeight = 'bold'
        }
        avgRow.appendChild(td)
        return
      }
      let avg = sums[i] / rowCount
      let text = ''
      if (fmt.type === 'int') text = Math.round(avg)
      else if (fmt.type === 'float1') text = avg.toFixed(1)
      else if (fmt.type === 'float2') text = avg.toFixed(2)
      else if (fmt.type === 'pct') text = Math.round(avg) + '%'
      td.textContent = text
      td.className = fmt.cls
      avgRow.appendChild(td)
    })

    table.appendChild(avgRow)
  }

  function filterTable () {
    const dataRows = table.querySelectorAll('tr:not([data-avg-row])')

    dataRows.forEach(row => {
      const img = row.querySelector('img[src*="/agents/"]')
      if (img) {
        const agentName = img.alt.toLowerCase()
        if (filterSystem.selectedAgents.has(agentName)) {
          row.style.display = ''
        } else {
          row.style.display = 'none'
        }
      }
    })

    updateAverageRow()
  }

  window.filterTable = filterTable

  // INIT
  updateAverageRow()
}
