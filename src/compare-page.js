
import { fetchPlayerData } from './compare-data.js';

// URL Management Functions
function updateComparisonUrl(player1Id, player2Id, timePeriod = 'all', agentFilter = null) {
  const params = new URLSearchParams();
  params.set('p1', player1Id);
  params.set('p2', player2Id);
  params.set('period', timePeriod);
  if (agentFilter) {
    params.set('agent', agentFilter);
  }
  
  const newUrl = `/compare?${params.toString()}`;
  window.history.pushState(null, '', newUrl);
}

function parseComparisonUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    player1Id: params.get('p1'),
    player2Id: params.get('p2'),
    timePeriod: params.get('period') || 'all',
    agentFilter: params.get('agent')
  };
}

function extractPlayerIdFromUrl(url) {
  const match = url.match(/\/player\/(\d+)\//);
  return match ? match[1] : null;
}

function validatePlayerUrl (url) {
  // Check if URL matches VLR player URL pattern - both with and without username
  const playerUrlPattern =
    /^https:\/\/www\.vlr\.gg\/player\/\d+\/([a-zA-Z0-9-_]+\/?)?$/
  return playerUrlPattern.test(url.trim())
}

function extractPlayerInfo (url) {
  // Extract player ID and username from URL - handle both with and without username
  const match = url.match(/\/player\/(\d+)\/([a-zA-Z0-9-_]+)?/)
  if (match) {
    return {
      id: match[1],
      username: match[2] || '', // Username is optional
      url: url.trim()
    }
  }
  return null
}

function createComparePageContent () {
  return `
        <div class="col-container">
            <div class="col">
                <div class="wf-card" style="margin-bottom:0px !important;">
                    <div class="wf-card-body">
                        <div style="padding: 20px;">
                            
                            <div style="display: flex; gap: 20px; margin-bottom: 20px; align-items: end;">
                                <div style ="flex: 1;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">Player 1 URL:</label>
                                    <input type="text" 
                                           id="player1-url" 
                                           placeholder="https://www.vlr.gg/player/4004/zekken"
                                           style="width: 100%; padding: 12px; border: 1px solid #5b6167; background: #2c3035; color: #ffffff; border-radius: 2px; font-size: 14px;">
                                    <div id="player1-error" style="color: #ff6b6b; font-size: 12px; margin-top: 4px; display: none;"></div>
                                    <div id="player1-info" style="color: #4caf50; font-size: 12px; margin-top: 4px; display: none;"></div>
                                </div>
                                
                                <div style ="flex: 1;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">Player 2 URL:</label>
                                    <input type="text" 
                                           id="player2-url" 
                                           placeholder="https://www.vlr.gg/player/9/tenz"
                                           style="width: 100%; padding: 12px; border: 1px solid #5b6167; background: #2c3035; color: #ffffff; border-radius: 2px; font-size: 14px;">
                                    <div id="player2-error" style="color: #ff6b6b; font-size: 12px; margin-top: 4px; display: none;"></div>
                                    <div id="player2-info" style="color: #4caf50; font-size: 12px; margin-top: 4px; display: none;"></div>
                                </div>
                            </div>
                            
                            <div style="text-align: center;">
                                <button id="compare-btn" 
                                        style="width: 100%; background: #d04e59; color: white; box-shadow:0 1px 3px -1px rgba(0, 0, 0, 0.8); border: none; padding: 12px 24px; border-radius: 2px; cursor: pointer; font-weight: 700; font-size: 12px; opacity: 0.5;" 
                                        disabled>
                                    Compare Players
                                </button>
                            </div>
                            
                            <div id="comparison-result" style="margin-top: 30px; display: none;">
                                <!-- Comparison results will be displayed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function setupPlayerUrlValidation () {
  const player1Input = document.getElementById('player1-url')
  const player2Input = document.getElementById('player2-url')
  const compareBtn = document.getElementById('compare-btn')

  let player1Valid = false
  let player2Valid = false

  function updateCompareButton () {
    if (player1Valid && player2Valid) {
      compareBtn.disabled = false
      compareBtn.style.opacity = '1'
    } else {
      compareBtn.disabled = true
      compareBtn.style.opacity = '0.5'
    }
  }

  function validateInput (input, errorDiv, infoDiv, playerNumber) {
    const url = input.value.trim()

    if (url === '') {
      errorDiv.style.display = 'none'
      infoDiv.style.display = 'none'
      if (playerNumber === 1) player1Valid = false
      else player2Valid = false
      updateCompareButton()
      return
    }

    if (validatePlayerUrl(url)) {
      const playerInfo = extractPlayerInfo(url)
      errorDiv.style.display = 'none'

      if (playerNumber === 1) player1Valid = true
      else player2Valid = true
    } else {
      errorDiv.style.display = 'block'
      errorDiv.textContent =
        'Invalid URL format. Use: https://www.vlr.gg/player/id/username'
      infoDiv.style.display = 'none'

      if (playerNumber === 1) player1Valid = false
      else player2Valid = false
    }

    updateCompareButton()
  }

  if (player1Input && player2Input && compareBtn) {
    const player1Error = document.getElementById('player1-error')
    const player1Info = document.getElementById('player1-info')
    const player2Error = document.getElementById('player2-error')
    const player2Info = document.getElementById('player2-info')

    player1Input.addEventListener('input', () => {
      validateInput(player1Input, player1Error, player1Info, 1)
    })

    player2Input.addEventListener('input', () => {
      validateInput(player2Input, player2Error, player2Info, 2)
    })

    compareBtn.addEventListener('click', async () => {
      if (player1Valid && player2Valid) {
        const player1Info = extractPlayerInfo(player1Input.value)
        const player2Info = extractPlayerInfo(player2Input.value)
        
        // Clear previous comparison data from localStorage
        localStorage.removeItem('comparisonCache');

        // Show loading state
        compareBtn.disabled = true;
        compareBtn.textContent = 'Loading...';
        
        const resultDiv = document.getElementById('comparison-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
          <div style="background: #2c3035; border-radius: 2px; text-align: center;">
            <h4 style="color: #da626c;">Loading Comparison...</h4>
            <p style="color: #a0a0a0;">Fetching player data, please wait...</p>
          </div>
        `;

        try {
          // Fetch all time data by default
          const [player1Data, player2Data] = await Promise.all([
            fetchPlayerData(player1Info.url, 'all'),
            fetchPlayerData(player2Info.url, 'all')
          ]);

          // Update URL with player IDs
          const player1Id = extractPlayerIdFromUrl(player1Info.url);
          const player2Id = extractPlayerIdFromUrl(player2Info.url);
          updateComparisonUrl(player1Id, player2Id, 'all');

          // Cache the player info for time period filtering
          const cacheData = {
            player1Info,
            player2Info,
            allTimeData: {
              player1: player1Data,
              player2: player2Data
            }
          };
          localStorage.setItem('comparisonCache', JSON.stringify(cacheData));

          // Display the comparison
          displayComparison(player1Data, player2Data, 'all');
          
        } catch (error) {
          console.error('Error fetching comparison data:', error);
          resultDiv.innerHTML = `
            <div style="padding: 20px; background: #2c3035; border-radius: 2px; text-align: center;">
              <h4 style="color: #ff6b6b;">Error Loading Comparison</h4>
              <p style="color: #a0a0a0;">Failed to fetch player data. Please check the URLs and try again.</p>
              <p style="color: #666; font-size: 12px;">${error.message}</p>
            </div>
          `;
        } finally {
          // Reset button
          compareBtn.disabled = false;
          compareBtn.textContent = 'Compare Players';
        }
      }
    })

    console.log('Player URL validation setup complete')
  }
}

function displayComparison(player1Data, player2Data, timePeriod) {
  const resultDiv = document.getElementById('comparison-result');
  
  resultDiv.innerHTML = `
    <div style="background: #2c3035; border-radius: 2px; padding: 0; overflow: hidden;">
      <!-- Stats Type Filter -->
      <div style="padding: 15px; border-bottom: 1px solid #5b6167; text-align: center;">
        <div style="color: #ffffff; margin-bottom: 10px; font-weight: 500;">Stats Mode:</div>
        <div style="display: inline-flex; background: #2c3035; border-radius: 2px; padding: 2px; border: 1px solid #5b6167; width:100%;">
          <button id="weighted-btn" 
                  onclick="toggleStatsMode('weighted')" 
                  style="width: 100%;  background: #da626c; color: white; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; font-size: 14px; transition: all 0.2s; font-family: inherit;">
            Weighted
          </button>
          <button id="simple-btn" 
                  onclick="toggleStatsMode('simple')" 
                  style="width: 100%; background: transparent; color: #999; border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; font-size: 14px; transition: all 0.2s; font-family: inherit;">
            Average
          </button>
        </div>
        <div style="color: #999; font-size: 12px; margin-top: 8px;">
          <span id="stats-explanation">Weighted stats based on rounds played per agent</span>
        </div>
      </div>
      
      <!-- Agent Filter Indicator -->
      <div id="agent-filter-indicator"></div>
      
      <!-- Player Comparison Table Layout -->
      <div style="min-height: 500px;" id="player-comparison">
        ${createPlayerComparisonTable(player1Data, player2Data)}
      </div>
      
      <!-- Agent Pool Section -->
      <div style=" padding: 20px; border-top: 1px solid #5b6167;">
        <h4 style="color: #ffffff; text-align: center; margin-bottom: 10px;">Agent Pool</h4>
        <p style="color: #999; text-align: center; font-size: 12px; margin-bottom: 20px;">
          Click on an agent that both players have used to compare agent-specific stats
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          ${createAgentPoolSection(player1Data.statsTable.agents, player1Data.playerInfo.name, 1)}
          ${createAgentPoolSection(player2Data.statsTable.agents, player2Data.playerInfo.name, 2)}
        </div>
      </div>
    </div>
  `;
  
  // Store data globally for toggle function
  window.comparisonData = { player1Data, player2Data, timePeriod };
  
  // Update the time period button styles based on current URL
  setTimeout(() => {
    updateTimePeriodButtons();
  }, 100);
}

// Function to update button styles based on URL
function updateTimePeriodButtons() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentPeriod = urlParams.get('period') || 'all';
  
  const buttons = ['30d', '60d', '90d', 'all'];
  
  console.log('Updating buttons for period:', currentPeriod);
  
  // Update button styles
  buttons.forEach(period => {
    const btn = document.getElementById(`time-${period}`);
    if (btn) {
      if (period === currentPeriod) {
        btn.style.background = '#da626c';
        btn.style.color = 'white';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#999';
      }
    }
  });
}

function createPlayerComparisonTable(player1Data, player2Data) {
  const stats1 = player1Data.statsTable.overallStats;
  const stats2 = player2Data.statsTable.overallStats;
  
  // Get current time period from URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentPeriod = urlParams.get('period') || 'all';
  
  // Define all Valorant stats using the new keys from compare-data.js
  const allStats = [
    { key: 'RND', label: 'Rounds', value1: stats1.RND, value2: stats2.RND, format: 'number', higherBetter: true, isAverage: false },
    { key: 'Rating', label: 'Rating 2.0', value1: stats1.Rating, value2: stats2.Rating, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'ACS', label: 'ACS', value1: stats1.ACS, value2: stats2.ACS, format: 'number', higherBetter: true, isAverage: true },
    { key: 'K:D', label: 'K:D', value1: stats1['K:D'], value2: stats2['K:D'], format: 'decimal', higherBetter: true, isAverage: false },
    { key: 'ADR', label: 'ADR', value1: stats1.ADR, value2: stats2.ADR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'KAST', label: 'KAST', value1: stats1.KAST, value2: stats2.KAST, format: 'percent', higherBetter: true, isAverage: true },
    { key: 'KPR', label: 'KPR', value1: stats1.KPR, value2: stats2.KPR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'APR', label: 'APR', value1: stats1.APR, value2: stats2.APR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'FKPR', label: 'FKPR', value1: stats1.FKPR, value2: stats2.FKPR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'FDPR', label: 'FDPR', value1: stats1.FDPR, value2: stats2.FDPR, format: 'decimal', higherBetter: false, isAverage: true },
    { key: 'K', label: 'K', value1: stats1.K, value2: stats2.K, format: 'number', higherBetter: true, isAverage: false },
    { key: 'D', label: 'D', value1: stats1.D, value2: stats2.D, format: 'number', higherBetter: false, isAverage: false },
    { key: 'A', label: 'A', value1: stats1.A, value2: stats2.A, format: 'number', higherBetter: true, isAverage: false },
    { key: 'FK', label: 'FK', value1: stats1.FK, value2: stats2.FK, format: 'number', higherBetter: true, isAverage: false },
    { key: 'FD', label: 'FD', value1: stats1.FD, value2: stats2.FD, format: 'number', higherBetter: false, isAverage: false }
  ];

  // Function to get button styles based on current period
  const getButtonStyle = (period) => {
    const isActive = period === currentPeriod;
    const background = isActive ? '#da626c' : 'transparent';
    const color = isActive ? 'white' : '#999';
    return `background: ${background}; color: ${color}; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 12px; transition: all 0.2s; font-family: inherit; width: 25%;`;
  };

  return `
    <div style="background: #2c3035;">
      <!-- Player Headers -->
      <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; padding: 20px; border-bottom: 1px solid #5b6167;">
        <!-- Player 1 Header -->
        <div style="display: flex; align-items: center; justify-content: flex-start;">
          <div style="position: relative; margin-right: 15px;">
            <!-- Blurred team logo background -->
            ${player1Data.playerInfo.teamLogo ? `
              <div style="
                position: absolute;
                top: -10px;
                left: -10px;
                width: 120px;
                height: 120px;
                background-image: url('${player1Data.playerInfo.teamLogo}');
                background-size: cover;
                background-position: center;
                filter: blur(2px);
                opacity: 0.75;
                z-index: 1;
                border-radius: 4px;
              "></div>
            ` : ''}
            <!-- Player avatar -->
            <img src="${player1Data.playerInfo.avatar}" 
                 style="
                   position: relative;
                   z-index: 2;
                   width: 100px; 
                   height: 100px; 
                 " 
                 alt="${player1Data.playerInfo.name}">
          </div>
          <div style="text-align: left;">
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
              <i class="${player1Data.playerInfo.flagClass}" style="margin-right: 8px;"></i>
              <a href="${player1Data.url.split('?')[0]}?timespan=${currentPeriod}" 
                 style="color: #ffffff; text-decoration: none; transition: color 0.2s;"
                 onmouseover="this.style.color='#da626c'" 
                 onmouseout="this.style.color='#ffffff'"
                  target="_blank" rel="noopener noreferrer"
                 >
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${player1Data.playerInfo.name}</h3>
              </a>
            </div>
            ${player1Data.playerInfo.realName ? `<div style="color: #a0a0a0; font-size: 12px;">${player1Data.playerInfo.realName}</div>` : ''}
            ${player1Data.playerInfo.teamName ? `<div style="color: #da626c; font-size: 11px; margin-top: 2px;">${player1Data.playerInfo.teamName}</div>` : ''}
          </div>
        </div>
        
        <!-- VS Section with Time Period Filter -->
        <div style="text-align: center;">
          <h2 style="color: #da626c; margin: 0 0 15px 0; font-size: 24px; font-weight: bold;">VS</h2>
          
          <!-- Time Period Filter -->
          <div style="display: inline-flex; background: #2c3035; border-radius: 2px; padding: 2px; border: 1px solid #5b6167;">
            <button id="time-30d" 
                    onclick="switchTimePeriod('30d')" 
                    style="${getButtonStyle('30d')}">
              30d
            </button>
            <button id="time-60d" 
                    onclick="switchTimePeriod('60d')" 
                    style="${getButtonStyle('60d')}">
              60d
            </button>
            <button id="time-90d" 
                    onclick="switchTimePeriod('90d')" 
                    style="${getButtonStyle('90d')}">
              90d
            </button>
            <button id="time-all" 
                    onclick="switchTimePeriod('all')" 
                    style="${getButtonStyle('all')}">
              All
            </button>
          </div>
        </div>
        
        <!-- Player 2 Header -->
        <div style="display: flex; align-items: center; justify-content: flex-end;">
          <div style="text-align: right; margin-right: 15px;">
            <div style="display: flex; align-items: center; justify-content: flex-end; margin-bottom: 5px;">
              <a href="${player2Data.url.split('?')[0]}?timespan=${currentPeriod}" 
                 style="color: #ffffff; text-decoration: none; transition: color 0.2s;"
                 onmouseover="this.style.color='#da626c'" 
                 onmouseout="this.style.color='#ffffff'"
                 target="_blank" rel="noopener noreferrer"
                 >
                <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${player2Data.playerInfo.name}</h3>
              </a>
              <i class="${player2Data.playerInfo.flagClass}" style="margin-left: 8px;"></i>
            </div>
            ${player2Data.playerInfo.realName ? `<div style="color: #a0a0a0; font-size: 12px;">${player2Data.playerInfo.realName}</div>` : ''}
            ${player2Data.playerInfo.teamName ? `<div style="color: #da626c; font-size: 11px; margin-top: 2px;">${player2Data.playerInfo.teamName}</div>` : ''}
          </div>
          <div style="position: relative;">
            <!-- Blurred team logo background -->
            ${player2Data.playerInfo.teamLogo ? `
              <div style="
                position: absolute;
                top: -10px;
                left: -10px;
                width: 120px;
                height: 120px;
                background-image: url('${player2Data.playerInfo.teamLogo}');
                background-size: cover;
                background-position: center;
                filter: blur(2px);
                opacity: 0.75;
                z-index: 1;
                border-radius: 4px;
              "></div>
            ` : ''}
            <!-- Player avatar -->
            <img src="${player2Data.playerInfo.avatar}" 
                 style="
                   position: relative;
                   z-index: 2;
                   width: 100px; 
                   height: 100px; 
                 " 
                 alt="${player2Data.playerInfo.name}">
          </div>
        </div>
      </div>

      <!-- Stats Comparison Table -->
      <div>
        ${allStats.map((stat, index) => {
          // Calculate which player is better
          let player1Better = false;
          let player2Better = false;
          let player1Glow = '';
          let player2Glow = '';
          let player1BorderColor = 'transparent';
          let player2BorderColor = 'transparent';
          let player1Opacity = '1';
          let player2Opacity = '1';
          
          if (stat.format === 'decimal' || stat.format === 'number') {
            const num1 = parseFloat(stat.value1);
            const num2 = parseFloat(stat.value2);
            
            if (stat.higherBetter) {
              if (num1 > num2) {
                player1Better = true;
                player1Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#4caf50';
                player2BorderColor = '#f44336';
                player2Opacity = '0.7';
              } else if (num1 < num2) {
                player2Better = true;
                player2Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#f44336';
                player2BorderColor = '#4caf50';
                player1Opacity = '0.7';
              }
            } else {
              if (num1 < num2) {
                player1Better = true;
                player1Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#4caf50';
                player2BorderColor = '#f44336';
                player2Opacity = '0.7';
              } else if (num1 > num2) {
                player2Better = true;
                player2Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#f44336';
                player2BorderColor = '#4caf50';
                player1Opacity = '0.7';
              }
            }
          } else if (stat.format === 'percent') {
            const num1 = parseInt(stat.value1);
            const num2 = parseInt(stat.value2);
            
            if (stat.higherBetter) {
              if (num1 > num2) {
                player1Better = true;
                player1Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#4caf50';
                player2BorderColor = '#f44336';
                player2Opacity = '0.7';
              } else if (num1 < num2) {
                player2Better = true;
                player2Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#f44336';
                player2BorderColor = '#4caf50';
                player1Opacity = '0.7';
              }
            } else {
              if (num1 < num2) {
                player1Better = true;
                player1Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#4caf50';
                player2BorderColor = '#f44336';
                player2Opacity = '0.7';
              } else if (num1 > num2) {
                player2Better = true;
                player2Glow = 'text-shadow: 0 0 4px rgba(255, 255, 255, 0.3), 0 0 6px rgba(255, 255, 255, 0.2);';
                player1BorderColor = '#f44336';
                player2BorderColor = '#4caf50';
                player1Opacity = '0.7';
              }
            }
          }
          
          // Alternating row colors
          const backgroundColor = index % 2 === 0 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)';
          
          return `
          <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; align-items: center; padding: 12px; background: ${backgroundColor}; border-left: 3px solid ${player1BorderColor}; border-right: 3px solid ${player2BorderColor};">
            <!-- Player 1 Value -->
            <div style="text-align: right; padding-right: 20px; opacity: ${player1Opacity};">
              <span style="color: #ffffff; font-size: 16px; font-weight: bold; ${player1Glow}">${stat.value1}</span>
            </div>
            
            <!-- Stat Label in Center -->
            <div style="text-align: center;">
              <span style="color: #ffffff; font-size: 14px; font-weight: 400;">${stat.label}</span>
            </div>
            
            <!-- Player 2 Value -->
            <div style="text-align: left; padding-left: 20px; opacity: ${player2Opacity};">
              <span style="color: #ffffff; font-size: 16px; font-weight: bold; ${player2Glow}">${stat.value2}</span>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function createPlayerComparisonCard(playerData, otherPlayerData, side) {
  const stats = playerData.statsTable.overallStats;
  const otherStats = otherPlayerData.statsTable.overallStats;
  
  // Define all Valorant stats using the new keys from compare-data.js
  const allStats = [
    { key: 'RND', label: 'Rounds', value: stats.RND, otherValue: otherStats.RND, format: 'number', higherBetter: true, isAverage: false },
    { key: 'Rating', label: 'Rating 2.0', value: stats.Rating, otherValue: otherStats.Rating, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'ACS', label: 'ACS', value: stats.ACS, otherValue: otherStats.ACS, format: 'number', higherBetter: true, isAverage: true },
    { key: 'K:D', label: 'K:D', value: stats['K:D'], otherValue: otherStats['K:D'], format: 'decimal', higherBetter: true, isAverage: false },
    { key: 'ADR', label: 'ADR', value: stats.ADR, otherValue: otherStats.ADR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'KAST', label: 'KAST', value: stats.KAST, otherValue: otherStats.KAST, format: 'percent', higherBetter: true, isAverage: true },
    { key: 'KPR', label: 'KPR', value: stats.KPR, otherValue: otherStats.KPR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'APR', label: 'APR', value: stats.APR, otherValue: otherStats.APR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'FKPR', label: 'FKPR', value: stats.FKPR, otherValue: otherStats.FKPR, format: 'decimal', higherBetter: true, isAverage: true },
    { key: 'FDPR', label: 'FDPR', value: stats.FDPR, otherValue: otherStats.FDPR, format: 'decimal', higherBetter: false, isAverage: true },
    { key: 'K', label: 'K', value: stats.K, otherValue: otherStats.K, format: 'number', higherBetter: true, isAverage: false },
    { key: 'D', label: 'D', value: stats.D, otherValue: otherStats.D, format: 'number', higherBetter: false, isAverage: false },
    { key: 'A', label: 'A', value: stats.A, otherValue: otherStats.A, format: 'number', higherBetter: true, isAverage: false },
    { key: 'FK', label: 'FK', value: stats.FK, otherValue: otherStats.FK, format: 'number', higherBetter: true, isAverage: false },
    { key: 'FD', label: 'FD', value: stats.FD, otherValue: otherStats.FD, format: 'number', higherBetter: false, isAverage: false }
  ];

  // Calculate color coding for each stat
  const statsWithColors = allStats.map(stat => {
    let color = '#ffffff'; // Default white
    
    if (stat.format === 'decimal' || stat.format === 'number') {
      const num1 = parseFloat(stat.value);
      const num2 = parseFloat(stat.otherValue);
      
      if (stat.higherBetter) {
        if (num1 > num2) color = '#4caf50'; // Green for better
        else if (num1 < num2) color = '#f44336'; // Red for worse
      } else {
        if (num1 < num2) color = '#4caf50'; // Green for better (lower is better)
        else if (num1 > num2) color = '#f44336'; // Red for worse
      }
    } else if (stat.format === 'percent') {
      const num1 = parseInt(stat.value);
      const num2 = parseInt(stat.otherValue);
      
      if (stat.higherBetter) {
        if (num1 > num2) color = '#4caf50';
        else if (num1 < num2) color = '#f44336';
      } else {
        if (num1 < num2) color = '#4caf50';
        else if (num1 > num2) color = '#f44336';
      }
    }
    
    return { ...stat, color };
  });

  return `
    <div style="background: #2c3035; border-right: ${side === 'left' ? '1px solid #5b6167' : 'none'};">
      <!-- Player Header -->
      <div style="display: flex; align-items: center; padding: 10px; position: relative;">
        <img src="${playerData.playerInfo.avatar}" 
             style="width: 60px; height: 60px; border-radius: 2px; margin-right: 15px;" 
             alt="${playerData.playerInfo.name}">
        <div>
          <div style="display: flex; align-items: center; margin-bottom: 5px;">
            <i class="${playerData.playerInfo.flagClass}" style="margin-right: 8px;"></i>
            <h3 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold;">${playerData.playerInfo.name}</h3>
          </div>
          ${playerData.playerInfo.realName ? `<div style="color: #a0a0a0; font-size: 14px;">${playerData.playerInfo.realName}</div>` : ''}
        </div>
      </div>

      <!-- Stats List -->
      <div>
        ${statsWithColors.map((stat, index) => {
          // Determine if this player has the better stat
          let borderSide = '';
          let borderColor = '';
          let opacity = '1';
          
          if (stat.format === 'decimal' || stat.format === 'number') {
            const num1 = parseFloat(stat.value);
            const num2 = parseFloat(stat.otherValue);
            
            if (stat.higherBetter) {
              if (num1 > num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#4caf50'; // Green for better
              } else if (num1 < num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#f44336'; // Red for worse
                opacity = '0.7';
              }
            } else {
              if (num1 < num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#4caf50'; // Green for better (lower is better)
              } else if (num1 > num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#f44336'; // Red for worse
                opacity = '0.7';
              }
            }
          } else if (stat.format === 'percent') {
            const num1 = parseInt(stat.value);
            const num2 = parseInt(stat.otherValue);
            
            if (stat.higherBetter) {
              if (num1 > num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#4caf50';
              } else if (num1 < num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#f44336';
                opacity = '0.7';
              }
            } else {
              if (num1 < num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#4caf50';
              } else if (num1 > num2) {
                borderSide = side === 'left' ? 'border-left' : 'border-right';
                borderColor = '#f44336';
                opacity = '0.7';
              }
            }
          }
          
          // Alternating row colors
          const backgroundColor = index % 2 === 0 ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.2)';
          
          return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: ${backgroundColor}; ${borderSide}: 3px solid ${borderColor}; opacity: ${opacity}; transition: opacity 0.2s;">
            <span style="color: #ffffff; font-size: 14px; font-weight: 500;">
              ${stat.label}
            </span>
            <span style="color: ${stat.color}; font-size: 14px; font-weight: bold;">${stat.value}</span>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function createAgentPoolSection(agents, playerName, playerIndex) {
  // Sort agents by matches played - show all agents
  const sortedAgents = [...agents].sort((a, b) => b.matches - a.matches);
  
  return `
    <div style="text-align: center;">
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
        ${sortedAgents.map(agent => `
          <div style="background: #2c3035; border-radius: 2px; padding: 8px; border: 1px solid #5b6167; cursor: pointer; transition: all 0.2s;" 
               class="agent-card" 
               data-agent="${agent.name}"
               data-player="${playerIndex}"
               onclick="toggleAgentFilter('${agent.name}', ${playerIndex})"
               onmouseover="handleAgentHover('${agent.name}', true)"
               onmouseout="handleAgentHover('${agent.name}', false)">
            <img src="${agent.image}" 
                 style="width: 32px; height: 32px;" 
                 alt="${agent.name}" 
                 title="${agent.name} - ${agent.matches} matches - Click to filter">
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Handle synchronized agent hover effects
function handleAgentHover(agentName, isHovering) {
  const allAgentCards = document.querySelectorAll(`.agent-card[data-agent="${agentName}"]`);
  
  allAgentCards.forEach(card => {
    if (isHovering) {
      card.style.background = '#3a3f45';
    } else {
      // Check if this agent is currently filtered
      const currentAgent = new URLSearchParams(window.location.search).get('agent');
      if (currentAgent === agentName) {
        card.style.background = '#3a2f30';
      } else {
        card.style.background = '#2c3035';
      }
    }
  });
}

// Toggle between weighted and simple averages
function toggleStatsMode(mode) {
  if (!window.comparisonData) return;
  
  const { player1Data, player2Data } = window.comparisonData;
  
  // Update button states
  const weightedBtn = document.getElementById('weighted-btn');
  const simpleBtn = document.getElementById('simple-btn');
  const explanation = document.getElementById('stats-explanation');
  
  if (mode === 'weighted') {
    weightedBtn.style.background = '#da626c';
    weightedBtn.style.color = 'white';
    simpleBtn.style.background = 'transparent';
    simpleBtn.style.color = '#999';
    explanation.textContent = 'Weighted stats based on rounds played per agent';
    
    // Update stats to use weighted calculations
    player1Data.statsTable.overallStats = player1Data.statsTable.weightedStats;
    player2Data.statsTable.overallStats = player2Data.statsTable.weightedStats;
  } else {
    simpleBtn.style.background = '#da626c';
    simpleBtn.style.color = 'white';
    weightedBtn.style.background = 'transparent';
    weightedBtn.style.color = '#999';
    explanation.textContent = 'Simple average across all agents';
    
    // Update stats to use simple averages
    player1Data.statsTable.overallStats = player1Data.statsTable.simpleStats;
    player2Data.statsTable.overallStats = player2Data.statsTable.simpleStats;
  }
  
  // Re-render the comparison cards
  const comparisonDiv = document.getElementById('player-comparison');
  comparisonDiv.innerHTML = createPlayerComparisonTable(player1Data, player2Data);
}

// Make toggle function globally available
window.toggleStatsMode = toggleStatsMode;

// Time period switching functionality
async function switchTimePeriod(newPeriod) {
  const cachedData = JSON.parse(localStorage.getItem('comparisonCache') || '{}');
  
  if (!cachedData.player1Info || !cachedData.player2Info) {
    console.error('No cached player info found');
    return;
  }

  // Update URL
  const player1Id = extractPlayerIdFromUrl(cachedData.player1Info.url);
  const player2Id = extractPlayerIdFromUrl(cachedData.player2Info.url);
  const currentAgent = new URLSearchParams(window.location.search).get('agent');
  updateComparisonUrl(player1Id, player2Id, newPeriod, currentAgent);

  // Update button styles based on new URL
  setTimeout(() => {
    updateTimePeriodButtons();
  }, 50);

  // Check if we have cached data for this period
  const cacheKey = `${newPeriod}Data`;
  if (cachedData[cacheKey]) {
    // Use cached data
    displayComparison(cachedData[cacheKey].player1, cachedData[cacheKey].player2, newPeriod);
    return;
  }

  // Show loading state for the comparison area
  const comparisonDiv = document.getElementById('player-comparison');
  if (comparisonDiv) {
    comparisonDiv.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #a0a0a0;">
        <div style="margin-bottom: 10px;">Loading ${newPeriod === 'all' ? 'all time' : newPeriod} data...</div>
        <div style="font-size: 12px;">Please wait...</div>
      </div>
    `;
  }

  try {
    // Fetch new data for this time period
    const [player1Data, player2Data] = await Promise.all([
      fetchPlayerData(cachedData.player1Info.url, newPeriod),
      fetchPlayerData(cachedData.player2Info.url, newPeriod)
    ]);

    // Cache the new data
    cachedData[cacheKey] = {
      player1: player1Data,
      player2: player2Data
    };
    localStorage.setItem('comparisonCache', JSON.stringify(cachedData));

    // Display the comparison
    displayComparison(player1Data, player2Data, newPeriod);
    
  } catch (error) {
    console.error('Error fetching time period data:', error);
    if (comparisonDiv) {
      comparisonDiv.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ff6b6b;">
          <div style="margin-bottom: 10px;">Error loading ${newPeriod} data</div>
          <div style="font-size: 12px;">Please try again</div>
        </div>
      `;
    }
  }
}

// Make function globally available
window.switchTimePeriod = switchTimePeriod;
window.updateTimePeriodButtons = updateTimePeriodButtons;

// Agent filtering functionality
let activeAgentFilter = null;

function toggleAgentFilter(agentName, playerIndex) {
  if (!window.comparisonData) return;
  
  const { player1Data, player2Data } = window.comparisonData;
  
  // Check if both players have this agent
  const player1Agent = player1Data.statsTable.agents.find(a => a.name === agentName);
  const player2Agent = player2Data.statsTable.agents.find(a => a.name === agentName);
  
  if (!player1Agent || !player2Agent) {
    // Show a message that both players need to have this agent
    showAgentFilterMessage(`Both players must have played ${agentName} to compare agent-specific stats`);
    return;
  }
  
  // Update URL
  const cachedData = JSON.parse(localStorage.getItem('comparisonCache') || '{}');
  const player1Id = extractPlayerIdFromUrl(cachedData.player1Info?.url || '');
  const player2Id = extractPlayerIdFromUrl(cachedData.player2Info?.url || '');
  const currentPeriod = new URLSearchParams(window.location.search).get('period') || 'all';
  
  // Toggle filter
  if (activeAgentFilter === agentName) {
    // Remove filter - show overall stats
    activeAgentFilter = null;
    updateComparisonUrl(player1Id, player2Id, currentPeriod, null);
    player1Data.statsTable.overallStats = player1Data.statsTable.weightedStats;
    player2Data.statsTable.overallStats = player2Data.statsTable.weightedStats;
    updateAgentFilterUI();
  } else {
    // Apply agent filter
    activeAgentFilter = agentName;
    updateComparisonUrl(player1Id, player2Id, currentPeriod, agentName);
    player1Data.statsTable.overallStats = player1Agent.stats;
    player2Data.statsTable.overallStats = player2Agent.stats;
    updateAgentFilterUI(agentName);
  }
  
  // Re-render the comparison cards
  const comparisonDiv = document.getElementById('player-comparison');
  comparisonDiv.innerHTML = createPlayerComparisonTable(player1Data, player2Data);
}

function updateAgentFilterUI(agentName = null) {
  // Update agent card styling
  document.querySelectorAll('.agent-card').forEach(card => {
    const cardAgent = card.getAttribute('data-agent');
    if (agentName && cardAgent === agentName) {
      card.style.border = '2px solid #da626c';
      card.style.background = '#3a2f30';
    } else {
      card.style.border = '1px solid #5b6167';
      card.style.background = '#2c3035';
    }
  });
  
  // Update filter indicator
  const filterIndicator = document.getElementById('agent-filter-indicator');
  if (filterIndicator) {
    if (agentName) {
      filterIndicator.innerHTML = `
        <div style="background: rgba(218, 98, 108, 0.2); padding: 8px 12px; border-radius: 2px; border-left: 3px solid #da626c; margin-bottom: 15px;">
          <div style="color: #ffffff; font-size: 14px; font-weight: 500;">
            Filtered by Agent: ${agentName}
            <button onclick="toggleAgentFilter('${agentName}', 0)" 
                    style="background: transparent; border: none; color: #da626c; margin-left: 8px; cursor: pointer; font-size: 12px;">
              [Clear Filter]
            </button>
          </div>
        </div>
      `;
    } else {
      filterIndicator.innerHTML = '';
    }
  }
}

function showAgentFilterMessage(message) {
  const filterIndicator = document.getElementById('agent-filter-indicator');
  if (filterIndicator) {
    filterIndicator.innerHTML = `
      <div style="background: rgba(255, 107, 107, 0.2); padding: 8px 12px; border-radius: 2px; border-left: 3px solid #ff6b6b; margin-bottom: 15px;">
        <div style="color: #ffffff; font-size: 14px;">${message}</div>
      </div>
    `;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      if (filterIndicator) filterIndicator.innerHTML = '';
    }, 3000);
  }
}

// Make functions globally available
window.toggleAgentFilter = toggleAgentFilter;

function initializeComparePage () {
  if (window.location.pathname === '/compare') {
    // Update page title
    document.title = 'Player Comparison - VLR.gg'

    // Find the wrapper div and clear its content
    const wrapper = document.getElementById('wrapper')

    if (wrapper) {
      // Clear existing content first
      wrapper.innerHTML = ''
      wrapper.style.padding = '0px'

      // Insert comparison content into the wrapper
      wrapper.innerHTML = createComparePageContent()

      // Setup input validation after content is inserted
      setTimeout(setupPlayerUrlValidation, 100)

      // Check for URL parameters and auto-load comparison
      setTimeout(checkForUrlComparison, 200)

      console.log('Compare page initialized with player input validation')
    } else {
      console.warn('Wrapper element not found')
    }
  }
}

// Check for URL parameters and auto-load comparison
async function checkForUrlComparison() {
  const urlParams = parseComparisonUrl();
  
  if (urlParams.player1Id && urlParams.player2Id) {
    // Use simple player ID URLs that will work with our validation
    const player1Url = `https://www.vlr.gg/player/${urlParams.player1Id}/`;
    const player2Url = `https://www.vlr.gg/player/${urlParams.player2Id}/`;
    
    // Pre-fill the input fields
    const player1Input = document.getElementById('player1-url');
    const player2Input = document.getElementById('player2-url');
    
    if (player1Input && player2Input) {
      player1Input.value = player1Url;
      player2Input.value = player2Url;
      
      // Trigger validation
      player1Input.dispatchEvent(new Event('input'));
      player2Input.dispatchEvent(new Event('input'));
      
      // Auto-trigger comparison after a short delay
      setTimeout(async () => {
        const compareBtn = document.getElementById('compare-btn');
        if (compareBtn && !compareBtn.disabled) {
          compareBtn.click();
          
          // Wait for comparison to load, then apply filters
          setTimeout(() => {
            // Apply time period filter if specified
            if (urlParams.timePeriod && urlParams.timePeriod !== 'all') {
              switchTimePeriod(urlParams.timePeriod);
            }
            
            // Apply agent filter if specified
            if (urlParams.agentFilter) {
              setTimeout(() => {
                toggleAgentFilter(urlParams.agentFilter, 1);
              }, 1000);
            }
          }, 2000);
        }
      }, 500);
    }
  }
}

// Make function globally available
window.handleAgentHover = handleAgentHover;

export { initializeComparePage }
