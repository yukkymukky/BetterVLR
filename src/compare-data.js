// Player data fetching utilities
// Handles fetching player stats and info from VLR pages

export async function fetchPlayerData(playerUrl, timespan = "all") {
    try {
        const url = `${playerUrl}?timespan=${timespan}`;

        const response = await fetch(url);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const playerInfo = extractPlayerInfo(doc);
        const statsTable = extractStatsTable(doc);

        return {
            playerInfo,
            statsTable,
            url,
        };
    } catch (error) {
        console.error("Error fetching player data:", error);
        throw error;
    }
}

function extractPlayerInfo(doc) {
    const playerHeader = doc.querySelector(".player-header");
    if (!playerHeader) throw new Error("Player header not found");

    const nameElement = playerHeader.querySelector(".wf-title");
    const name = nameElement ? nameElement.textContent.trim() : "Unknown";

    const realNameElement = playerHeader.querySelector(".player-real-name");
    const realName = realNameElement ? realNameElement.textContent.trim() : "";

    const avatarElement = playerHeader.querySelector(".wf-avatar img");
    const avatar = avatarElement ? avatarElement.src : "";

    const flagElement = playerHeader.querySelector(".flag");
    const countryElement = playerHeader.querySelector(".ge-text-light");
    let country = "";
    let flagClass = "";
    if (flagElement && countryElement) {
        flagClass = flagElement.className;
        country = countryElement.textContent.trim();
    }

    // Extract team/organization information
    let teamLogo = "";
    let teamName = "";
    
    // First, check if "Current Teams" section exists on the page
    const allHeaders = doc.querySelectorAll('h2.wf-label.mod-large');
    let currentTeamsHeader = null;
    
    // Look for a header that contains "Current Teams" text
    for (const header of allHeaders) {
        if (header.textContent.trim().includes('Current Teams')) {
            currentTeamsHeader = header;
            break;
        }
    }
    
    let teamElement = null;
    
    if (currentTeamsHeader) {
        // If "Current Teams" section exists, get the team from that section
        let nextElement = currentTeamsHeader.nextElementSibling;
        while (nextElement) {
            teamElement = nextElement.querySelector('.wf-module-item.mod-first');
            if (teamElement) break;
            nextElement = nextElement.nextElementSibling;
        }
    }
    // If no "Current Teams" section exists, don't show any team (no fallback to past teams)
    
    if (teamElement) {
        const teamLogoElement = teamElement.querySelector("img");
        const teamNameElement = teamElement.querySelector("div[style*='font-weight: 500']");
        
        if (teamLogoElement) {
            teamLogo = teamLogoElement.src;
            // Convert relative URLs to absolute URLs
            if (teamLogo.startsWith("//")) {
                teamLogo = "https:" + teamLogo;
            } else if (teamLogo.startsWith("/")) {
                teamLogo = "https://www.vlr.gg" + teamLogo;
            }
        }
        
        if (teamNameElement) {
            teamName = teamNameElement.textContent.trim();
        }
    }

    const socialLinks = [];
    const linkElements = playerHeader.querySelectorAll('a[target="_blank"]');
    linkElements.forEach((link) => {
        const href = link.href;
        const text = link.textContent.trim();
        if (href && text) {
            socialLinks.push({ href, text });
        }
    });

    return { name, realName, avatar, country, flagClass, socialLinks, teamLogo, teamName };
}

function extractStatsTable(doc) {
    const statsTable = doc.querySelector(".wf-card.mod-table .wf-table");
    if (!statsTable) {
        // Return mock data with N/A values instead of throwing error
        const mockStats = {
            RND: "N/A",
            "Rating": "N/A",
            "ACS": "N/A",
            "K:D": "N/A",
            "ADR": "N/A",
            "KAST": "N/A",
            "KPR": "N/A",
            "APR": "N/A",
            "FKPR": "N/A",
            "FDPR": "N/A",
            "K": "N/A",
            "D": "N/A",
            "A": "N/A",
            "FK": "N/A",
            "FD": "N/A",
            "Matches": "N/A",
        };

        return {
            headers: [],
            rows: [],
            overallStats: mockStats,
            weightedStats: mockStats,
            simpleStats: mockStats,
            agents: [],
        };
    }

    // Extract headers
    const headers = [];
    const headerElements = statsTable.querySelectorAll("thead th");
    headerElements.forEach((th) => {
        headers.push({
            text: th.textContent.trim(),
            title: th.getAttribute("title") || "",
            className: th.className,
        });
    });

    const rows = [];
    const rowElements = statsTable.querySelectorAll("tbody tr:not([data-avg-row])");

    const agents = [];

    // For weighted averages (rounds-based)
    let totalRounds = 0, totalKills = 0, totalDeaths = 0, totalAssists = 0;
    let totalFirstKills = 0, totalFirstDeaths = 0;
    let weightedRating = 0, weightedACS = 0, weightedADR = 0, weightedKAST = 0;
    let totalMatches = 0;

    // For simple averages
    const colFormats = [
        { type: "skip" }, // agent
        { type: "skip" }, // use
        { type: "int" }, // RND
        { type: "float2" }, // Rating
        { type: "float1" }, // ACS
        { type: "float2" }, // K:D
        { type: "float1" }, // ADR
        { type: "pct" }, // KAST
        { type: "float2" }, // KPR
        { type: "float2" }, // APR
        { type: "float2" }, // FKPR
        { type: "float2" }, // FDPR
        { type: "int" }, // K
        { type: "int" }, // D
        { type: "int" }, // A
        { type: "int" }, // FK
        { type: "int" }, // FD
    ];

    const sums = Array(colFormats.length).fill(0);
    let rowCount = 0;

    rowElements.forEach((tr) => {
        const row = [];
        const cellElements = tr.querySelectorAll("td");

        let agentData = { 
            name: "", 
            matches: 0, 
            winRate: "", 
            rating: 0, 
            image: "",
            stats: {} // Store all stats for this agent
        };

        cellElements.forEach((td, index) => {
            const text = td.textContent.trim();
            const cellData = { text, className: td.className };

            // Agent col
            if (index === 0) {
                const img = td.querySelector("img");
                if (img) {
                    cellData.agentImage = img.src;
                    cellData.agentAlt = img.alt;
                    agentData.name = cellData.agentAlt || cellData.text;
                    agentData.image = img.src;
                }
            }

            // Use col
            if (index === 1) {
                const matches = parseInt(text.match(/\((\d+)\)/)?.[1] || "0");
                agentData.matches = matches;
                agentData.winRate = text.split(") ")[1] || "";
                totalMatches += matches;
            }

            // Store individual agent stats
            if (index === 2) agentData.stats.RND = parseInt(text) || 0;
            if (index === 3) agentData.stats.Rating = parseFloat(text) || 0;
            if (index === 4) agentData.stats.ACS = parseFloat(text) || 0;
            if (index === 5) agentData.stats['K:D'] = parseFloat(text) || 0;
            if (index === 6) agentData.stats.ADR = parseFloat(text) || 0;
            if (index === 7) agentData.stats.KAST = text;
            if (index === 8) agentData.stats.KPR = parseFloat(text) || 0;
            if (index === 9) agentData.stats.APR = parseFloat(text) || 0;
            if (index === 10) agentData.stats.FKPR = parseFloat(text) || 0;
            if (index === 11) agentData.stats.FDPR = parseFloat(text) || 0;
            if (index === 12) agentData.stats.K = parseInt(text) || 0;
            if (index === 13) agentData.stats.D = parseInt(text) || 0;
            if (index === 14) agentData.stats.A = parseInt(text) || 0;
            if (index === 15) agentData.stats.FK = parseInt(text) || 0;
            if (index === 16) agentData.stats.FD = parseInt(text) || 0;

            // Rating col
            if (index === 3) {
                agentData.rating = parseFloat(text) || 0;
            }

            // For weighted calculations
            if (index === 2) { // Rounds
                const rounds = parseInt(text) || 0;
                totalRounds += rounds;
            }
            if (index === 3) { // Rating
                const rating = parseFloat(text) || 0;
                const rounds = parseInt(cellElements[2]?.textContent) || 0;
                weightedRating += rating * rounds;
            }
            if (index === 4) { // ACS
                const acs = parseFloat(text) || 0;
                const rounds = parseInt(cellElements[2]?.textContent) || 0;
                weightedACS += acs * rounds;
            }
            if (index === 6) { // ADR
                const adr = parseFloat(text) || 0;
                const rounds = parseInt(cellElements[2]?.textContent) || 0;
                weightedADR += adr * rounds;
            }
            if (index === 7) { // KAST
                const kast = parseFloat(text.replace("%", "")) || 0;
                const rounds = parseInt(cellElements[2]?.textContent) || 0;
                weightedKAST += kast * rounds;
            }
            if (index === 12) totalKills += parseInt(text) || 0;
            if (index === 13) totalDeaths += parseInt(text) || 0;
            if (index === 14) totalAssists += parseInt(text) || 0;
            if (index === 15) totalFirstKills += parseInt(text) || 0;
            if (index === 16) totalFirstDeaths += parseInt(text) || 0;

            // For simple averages
            if (colFormats[index] && colFormats[index].type !== "skip") {
                let val = text.replace("%", "");
                val = parseFloat(val);
                if (!isNaN(val)) sums[index] += val;
            }

            row.push(cellData);
        });

        if (row.length > 0) {
            rows.push(row);
            if (agentData.name) agents.push(agentData);
            rowCount++;
        }
    });

    // Weighted averages (rounds-based)
    const weightedStats = {
        RND: totalRounds,
        "Rating": totalRounds > 0 ? (weightedRating / totalRounds).toFixed(2) : "0.00",
        "ACS": totalRounds > 0 ? Math.round(weightedACS / totalRounds) : 0,
        "K:D": totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "0.00",
        "ADR": totalRounds > 0 ? (weightedADR / totalRounds).toFixed(1) : "0.0",
        "KAST": totalRounds > 0 ? (weightedKAST / totalRounds).toFixed(0) + "%" : "0%",
        "KPR": totalRounds > 0 ? (totalKills / totalRounds).toFixed(2) : "0.00",
        "APR": totalRounds > 0 ? (totalAssists / totalRounds).toFixed(2) : "0.00",
        "FKPR": totalRounds > 0 ? (totalFirstKills / totalRounds).toFixed(2) : "0.00",
        "FDPR": totalRounds > 0 ? (totalFirstDeaths / totalRounds).toFixed(2) : "0.00",
        "K": totalKills,
        "D": totalDeaths,
        "A": totalAssists,
        "FK": totalFirstKills,
        "FD": totalFirstDeaths,
        "Matches": totalMatches,
    };

    // Simple averages
    const simpleStats = {};
    colFormats.forEach((fmt, i) => {
        if (fmt.type === "skip") return;
        const avg = sums[i] / rowCount;
        let text = "";
        if (fmt.type === "int") text = Math.round(avg);
        else if (fmt.type === "float1") text = avg.toFixed(1);
        else if (fmt.type === "float2") text = avg.toFixed(2);
        else if (fmt.type === "pct") text = Math.round(avg) + "%";
        
        // Handle header text - clean up Rating2.0 to just Rating
        let headerText = headers[i]?.text || `col${i}`;
        if (headerText.includes('Rating')) {
            headerText = 'Rating';
        }
        
        simpleStats[headerText] = text;
    });

    return {
        headers,
        rows,
        overallStats: weightedStats, // Default to weighted
        weightedStats,
        simpleStats,
        agents,
    };
}
