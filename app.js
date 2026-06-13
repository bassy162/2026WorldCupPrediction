let appState = { groups: {}, thirdSelected: [], knockout: {} };
let liveMatches = {};

// --- 1. グループリーグ管理 ---
function renderGroupStage() {
    const container = document.getElementById('groupContainer');
    if (!container) return;
    container.innerHTML = '';
    
    groupKeys.forEach(groupName => {
        const teams = groupsData[groupName];
        if(!appState.groups[groupName]) appState.groups[groupName] = ["", "", "", ""];
        
        let html = `<div class="group-card"><h2 class="group-title">Group ${groupName}</h2>`;
        for (let j = 0; j < 4; j++) {
            let options = '<option value="">-- 選択 --</option>';
            teams.forEach(team => {
                let selected = (appState.groups[groupName][j] === team) ? 'selected' : '';
                options += `<option value="${team}" ${selected}>${team}</option>`;
            });
            html += `<div class="rank-row"><div class="rank-label">${j+1}位</div>` +
                    `<select class="rank-select group-select-${groupName}" data-group="${groupName}" data-rank="${j}" onchange="handleGroupSelect(this)">` +
                    `${options}</select></div>`;
        }
        html += '</div>';
        container.innerHTML += html;
    });
    updateSelectOptions();
}

function handleGroupSelect(selectElem) {
    const group = selectElem.getAttribute('data-group');
    const rank = parseInt(selectElem.getAttribute('data-rank'), 10);
    appState.groups[group][rank] = selectElem.value;
    updateSelectOptions();
    saveToURL();
}

function updateSelectOptions() {
    groupKeys.forEach(groupName => {
        const selects = document.querySelectorAll('.group-select-' + groupName);
        let selectedValues = [];
        selects.forEach(s => { if(s.value) selectedValues.push(s.value); });
        selects.forEach(select => {
            const currentValue = select.value;
            for(let m = 0; m < select.options.length; m++) {
                let opt = select.options[m];
                opt.disabled = (opt.value && opt.value !== currentValue && selectedValues.includes(opt.value));
            }
        });
    });
}

function checkGroupCompletion() {
    for (let i = 0; i < groupKeys.length; i++) {
        let groupName = groupKeys[i];
        if (!appState.groups[groupName] || appState.groups[groupName].includes("")) {
            alert("すべてのグループの順位(1位〜4位)を予想してください！");
            return;
        }
    }
    document.getElementById('navThird').disabled = false;
    renderThirdSelection();
    switchTab('thirdTab');
}

// --- 2. 3位選抜管理 ---
function renderThirdSelection() {
    const container = document.getElementById('thirdContainer');
    if (!container) return;
    container.innerHTML = '';
    
    groupKeys.forEach(groupName => {
        const thirdTeam = appState.groups[groupName] ? appState.groups[groupName][2] : "";
        if (!thirdTeam) return;
        let isSelected = appState.thirdSelected.includes(groupName);
        let selClass = isSelected ? ' selected' : '';
        container.innerHTML += `<button class="third-btn${selClass}" onclick="toggleThirdTeam('${groupName}')" id="third_btn_${groupName}">${thirdTeam}<br><span style="font-size:11px;font-weight:normal;">(${groupName}組)</span></button>`;
    });
    updateThirdCount();
}

function toggleThirdTeam(groupName) {
    let idx = appState.thirdSelected.indexOf(groupName);
    if (idx > -1) {
        appState.thirdSelected.splice(idx, 1);
    } else {
        if (appState.thirdSelected.length >= 8) { alert("すでに8チーム選択されています。"); return; }
        appState.thirdSelected.push(groupName);
    }
    const btn = document.getElementById('third_btn_' + groupName);
    if (btn) btn.className = appState.thirdSelected.includes(groupName) ? 'third-btn selected' : 'third-btn';
    updateThirdCount();
    saveToURL();
}

function updateThirdCount() {
    let count = appState.thirdSelected.length;
    document.getElementById('thirdCount').innerText = count;
    document.getElementById('btnGenerateTournament').disabled = (count !== 8);
}

function generateTournament() {
    liveMatches = JSON.parse(JSON.stringify(matchStructure));
    appState.knockout = {};
    saveToURL(); 
    document.getElementById('navKnockout').disabled = false;
    renderTournament();
    switchTab('knockoutTab');
}

// --- 3. トーナメント管理 ---
function resolveTeamStr(code) {
    if (!code || code === '3X') return '';
    let rank = parseInt(code.charAt(0), 10) - 1;
    let group = code.charAt(1);
    if (appState.groups[group] && appState.groups[group][rank]) return appState.groups[group][rank];
    return '';
}

function getFlagImg(teamName) {
    if(!teamName || teamName === '未定') return '<div class="flag-icon" style="background:#475569;"></div>';
    let code = flagCodeMap[teamName];
    if(code) return `<img src="https://flagcdn.com/w40/${code}.png" class="flag-icon" crossorigin="anonymous">`;
    return '<div class="flag-icon" style="background:#475569;"></div>';
}

function renderTournament() {
    liveMatches = JSON.parse(JSON.stringify(matchStructure));
    
    // ④ 公式ルールマトリックスから3位突破の割り当てを自動計算
    let thirdMapping = {};
    if (appState.thirdSelected.length === 8) {
        thirdMapping = getOfficialThirdPlaceMap(appState.thirdSelected);
    }
    
    for (let key in liveMatches) {
        if(liveMatches[key].p1 && liveMatches[key].p1.length === 2) {
            let assignedGroup = thirdMapping[key];
            liveMatches[key].p1 = (liveMatches[key].p1 === '3X') ? (appState.groups[assignedGroup] ? appState.groups[assignedGroup][2] : '') : resolveTeamStr(liveMatches[key].p1);
            liveMatches[key].p2 = (liveMatches[key].p2 === '3X') ? (appState.groups[assignedGroup] ? appState.groups[assignedGroup][2] : '') : resolveTeamStr(liveMatches[key].p2);
        }
    }

    // 勝者データをツリーの先へ自動伝播
    for (let k in appState.knockout) {
        let winner = appState.knockout[k];
        if (winner && liveMatches[k]) {
            let nxt = liveMatches[k].next;
            let pos = liveMatches[k].nextPos;
            if (nxt && liveMatches[nxt]) liveMatches[nxt][pos] = winner;
        }
    }

    const board = document.getElementById('bracketBoard');
    if (!board) return; // トーナメント画面が存在しない場合はスキップ
    board.innerHTML = '';
    
    let champion = appState.knockout['m104'];

    visualLayout.forEach(colData => {
        let isFinalCol = (colData.title === 'FINAL');
        let colHtml = `<div class="bracket-col"><div class="col-header ${isFinalCol ? 'final' : ''}">${colData.title}</div>`;
        
        colData.matches.forEach(mId => {
            let match = liveMatches[mId];
            let p1 = match.p1 || '未定';
            let p2 = match.p2 || '未定';
            let p1State = ''; let p2State = '';
            
            if (appState.knockout[mId] === p1 && p1 !== '未定') { p1State = 'winner'; p2State = 'loser'; }
            if (appState.knockout[mId] === p2 && p2 !== '未定') { p2State = 'winner
