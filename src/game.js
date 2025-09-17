if (
  document.querySelector('.match-header') ||
  document.querySelector(
    '.wf-card.mod-color.mod-bg-after-striped_purple.match-header'
  )
) {
  function getMatchMetadata () {
    const eventEl = document.querySelector('.match-header-event div div')
    const eventStageEl = document.querySelector('.match-header-event-series')
    const dateEl = document.querySelector('.moment-tz-convert')
    const patchEl = document.querySelector(
      '.match-header-date div[style*="italic"]'
    )

    const event = eventEl ? eventEl.textContent.trim() : ''

    let eventStage = ''
    if (eventStageEl) {
      eventStage = eventStageEl.textContent
        .replace(/Swiss Stage:/g, '')
        .replace(/Group Stage:/g, '')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const patch = patchEl ? patchEl.textContent.replace('Patch', '').trim() : ''

    let datetime = ''
    if (dateEl && dateEl.dataset.utcTs) {
      datetime = new Date(dateEl.dataset.utcTs).toISOString()
    } else {
      datetime = new Date().toISOString()
    }

    return { datetime, patch, event, eventStage }
  }

  function getTeamData () {
    const teamNames = document.querySelectorAll('.team-name')
    const alpha = teamNames[0] ? teamNames[0].textContent.trim() : ''
    const omega = teamNames[1] ? teamNames[1].textContent.trim() : ''
    return { alpha, omega }
  }

  function getMapData () {
    const maps = []
    const gameContainers = document.querySelectorAll(
      '.vm-stats-game[data-game-id]'
    )

    gameContainers.forEach(container => {
      if (container.style.display === 'none') return

      const mapEl = container.querySelector('.map span')
      let mapName = ''
      if (mapEl) {
        mapName = mapEl.textContent
          .toLowerCase()
          .replace(/\n/g, '')
          .replace(/\t/g, '')
          .replace(/\s+/g, ' ')
          .replace(/pick/g, '')
          .replace(/ban/g, '')
          .replace(/decider/g, '')
          .trim()
      }

      if (!mapName) return

      const scores = container.querySelectorAll('.score')
      const alphaScore = scores[0] ? parseInt(scores[0].textContent.trim()) : 0
      const omegaScore = scores[1] ? parseInt(scores[1].textContent.trim()) : 0

      const tables = container.querySelectorAll('.wf-table-inset.mod-overview')
      const players = { alpha: [], omega: [] }

      tables.forEach((table, teamIndex) => {
        const team = teamIndex === 0 ? 'alpha' : 'omega'
        const rows = table.querySelectorAll('tbody tr')

        rows.forEach(row => {
          const playerData = extractPlayerData(row)
          if (playerData) {
            players[team].push(playerData)
          }
        })
      })

      maps.push({
        name: mapName,
        score: { alpha: alphaScore, omega: omegaScore },
        players
      })
    })

    return maps
  }

  function extractPlayerData (row) {
    const cells = row.querySelectorAll('td')
    if (cells.length < 10) return null

    const nameEl = cells[0].querySelector('.text-of')
    const name = nameEl ? nameEl.textContent.trim() : ''

    const agentImgs = cells[1].querySelectorAll('img')
    const agents = Array.from(agentImgs).map(img => img.alt.toLowerCase())

    const getBothValue = cell => {
      const bothEl = cell.querySelector('.side.mod-both')
      return bothEl ? bothEl.textContent.trim() : cell.textContent.trim()
    }

    const rating = parseFloat(getBothValue(cells[2])) || 0
    const acs = parseInt(getBothValue(cells[3])) || 0
    const kills = parseInt(getBothValue(cells[4])) || 0
    const deaths = parseInt(getBothValue(cells[5])) || 0
    const assists = parseInt(getBothValue(cells[6])) || 0
    const kdDiff = parseInt(getBothValue(cells[7]).replace('+', '')) || 0
    const kast = getBothValue(cells[8])
    const adr = parseInt(getBothValue(cells[9])) || 0
    const hsPct = getBothValue(cells[10])
    const fk = parseInt(getBothValue(cells[11])) || 0
    const fd = parseInt(getBothValue(cells[12])) || 0
    const fkDiff = parseInt(getBothValue(cells[13]).replace('+', '')) || 0

    return {
      name,
      agents,
      rating,
      acs,
      kills,
      deaths,
      assists,
      kdDiff,
      kast,
      adr,
      hsPct,
      fk,
      fd,
      fkDiff
    }
  }

  function generateJSON () {
    const metadata = getMatchMetadata()
    const teams = getTeamData()
    const maps = getMapData()

    const alphaPlayers = [
      ...new Set(maps.flatMap(map => map.players.alpha.map(p => p.name)))
    ]
    const omegaPlayers = [
      ...new Set(maps.flatMap(map => map.players.omega.map(p => p.name)))
    ]

    return {
      datetime: metadata.datetime,
      patch: metadata.patch,
      event: metadata.event,
      event_stage: metadata.eventStage,
      alpha: {
        team: teams.alpha,
        players: alphaPlayers
      },
      omega: {
        team: teams.omega,
        players: omegaPlayers
      },
      maps
    }
  }

  function downloadJSON (jsonContent, filename) {
    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], {
      type: 'application/json;charset=utf-8;'
    })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  function getMatchInfo () {
    const teams = document.querySelectorAll('.team-name')
    const mapName = document.querySelector('.map span')

    let filename = 'vlr-match-stats'

    if (teams.length >= 2) {
      const team1 = teams[0].textContent.trim().replace(/\s+/g, '-')
      const team2 = teams[1].textContent.trim().replace(/\s+/g, '-')
      filename = `${team1}-vs-${team2}`
    }

    if (mapName) {
      const map = mapName.textContent.trim().replace(/\s+/g, '-')
      filename += `-${map}`
    }

    return filename
  }

  // Function to add export button
  function addExportButton () {
    const sideFilterContainers = document.querySelectorAll(
      'div[style*="text-align: right"][style*="margin-top: 5px"]'
    )

    sideFilterContainers.forEach(container => {
      if (container.querySelector('.export-json-btn')) return

      const sideFilter = container.querySelector(
        '.wf-filter-inset.js-side-filter'
      )
      if (!sideFilter) return

      const exportBtn = document.createElement('div')
      exportBtn.className = 'wf-filter-inset export-json-btn'
      exportBtn.style.cssText = `
                background: #5b6167;
                color: white;
                border-radius: 2px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                margin-left: 5px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                opacity: 0.8;
                vertical-align: top;
                height: 31px;
                width: 31px;
            `

      exportBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" 
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                  class="lucide lucide-download-icon lucide-download">
                <path d="M12 15V3"/>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <path d="m7 10 5 5 5-5"/>
              </svg>
            `
      exportBtn.title = 'Export match data as JSON'

      exportBtn.addEventListener('mouseenter', () => {
        exportBtn.style.backgroundColor = '#4a5056'
        exportBtn.style.opacity = '1'
      })
      exportBtn.addEventListener('mouseleave', () => {
        exportBtn.style.backgroundColor = '#5b6167'
        exportBtn.style.opacity = '0.8'
      })

      exportBtn.addEventListener('click', () => {
        try {
          const jsonData = generateJSON()
          if (jsonData) {
            const filename = getMatchInfo() + '.json'
            downloadJSON(jsonData, filename)
          } else {
            alert('No data found to export.')
          }
        } catch (error) {
          console.error('Error generating JSON:', error)
          alert('Error generating JSON data.')
        }
      })

      sideFilter.insertAdjacentElement('afterend', exportBtn)
    })
  }

  function initializeExportButton () {
    setTimeout(addExportButton, 500)
    setTimeout(addExportButton, 1500)
    setTimeout(addExportButton, 3000)

    const observer = new MutationObserver(mutations => {
      let shouldCheck = false
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true
        }
      })
      if (shouldCheck) {
        setTimeout(addExportButton, 300)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  initializeExportButton()
  
  function removeAds() {
    const botdAd = document.querySelector('#botd-tp.wf-card.mod-ifb');
    if (botdAd) {
      botdAd.remove();
    }
    
    const adLabels = document.querySelectorAll('.wf-label');
    adLabels.forEach(label => {
      if (label.textContent.trim() === 'Advertisement') {
        label.remove();
      }
    });
  }
  
  function initializeAdRemoval() {
    setTimeout(removeAds, 100);
    setTimeout(removeAds, 500);
    setTimeout(removeAds, 1000);
    
    const observer = new MutationObserver(() => {
      setTimeout(removeAds, 50);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  initializeAdRemoval();
}
