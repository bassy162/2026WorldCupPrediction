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
            if (appState.knockout[mId] === p2 && p2 !== '未定') { p2State = 'winner'; p1State = 'loser'; }

            colHtml += `<div class="match-box">` +
                       `<div class="team-line ${p1State}" onclick="selectWinner('${mId}','${p1}')">${getFlagImg(p1)}<span class="team-name">${p1}</span></div>` +
                       `<div class="team-line ${p2State}" onclick="selectWinner('${mId}','${p2}')">${getFlagImg(p2)}<span class="team-name">${p2}</span></div>` +
                       `</div>`;
        });
        colHtml += '</div>';
        board.innerHTML += colHtml;
    });

    // 優勝バナーの制御
    const banner = document.getElementById('championBanner');
    if (champion && champion !== '未定') {
        document.getElementById('championName').innerText = champion;
        document.getElementById('championFlag').src = `https://flagcdn.com/w80/${flagCodeMap[champion]}.png`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }

    // ② すべての試合(31試合)が予測された場合のみ、画像保存ボタンを活性化
    validateSaveButton();
}

// ② 選択解除機能および依存関係自動削除ロジック
function selectWinner(matchId, winnerName) {
    if (!winnerName || winnerName === '未定') return;
    
    if (appState.knockout[matchId] === winnerName) {
        // すでに同じチームが選ばれている場合は「解除」
        delete appState.knockout[matchId];
        cascadeClear(matchId);
    } else {
        // 新しく選ばれた場合
        appState.knockout[matchId] = winnerName;
        cascadeClear(matchId);
    }
    saveToURL();
    renderTournament();
}

// 下流の試合結果を再帰的にクリアする補助関数
function cascadeClear(matchId) {
    let currentId = matchId;
    while (currentId && matchStructure[currentId]) {
        let nxt = matchStructure[currentId].next;
        if (nxt) {
            delete appState.knockout[nxt];
            currentId = nxt;
        } else {
            break;
        }
    }
}

function validateSaveButton() {
    const btnSave = document.getElementById('btnSaveImage');
    if (!btnSave) return;
    
    // 全31試合が埋まっているかチェック
    let filledCount = 0;
    for(let k in liveMatches) {
        if(appState.knockout[k] && appState.knockout[k] !== '未定') filledCount++;
    }
    
    if(filledCount === 31) {
        btnSave.disabled = false;
        btnSave.innerText = "📸 予想画像を生成して保存";
    } else {
        btnSave.disabled = true;
        btnSave.innerText = `📸 予想画像を生成して保存 (${filledCount}/31 試合選択済)`;
    }
}

// --- 4. 保存・共有・インフラ管理 ---
// ③ パラメータ付きURLの作成・クリップボードへの自動保存機能
function copyShareURL() {
    try {
        let jsonStr = JSON.stringify(appState);
        let base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        let shareURL = window.location.origin + window.location.pathname + "?data=" + base64;
        
        navigator.clipboard.writeText(shareURL).then(() => {
            alert("📋 予想データを保存したURLをクリップボードにコピーしました！SNSでのシェアやブックマークとして保存できます。");
        }).catch(() => {
            alert("コピーに失敗しました。URLのパラメータをご利用ください: " + shareURL);
        });
    } catch (e) {
        alert("データの文字列化に失敗しました。");
    }
}

function saveToURL() {
    try {
        if (window.location.protocol === 'file:') return; 
        let jsonStr = JSON.stringify(appState);
        let base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        let newUrl = window.location.origin + window.location.pathname + "?data=" + base64;
        if (window.history && window.history.replaceState) window.history.replaceState({path: newUrl}, '', newUrl);
    } catch (e) {}
}

function loadFromURL() {
    try {
        if (window.location.protocol === 'file:') return; 
        let urlParams = new URLSearchParams(window.location.search);
        let dataParam = urlParams.get('data');
        if (dataParam) {
            appState = JSON.parse(decodeURIComponent(escape(atob(dataParam))));
            document.getElementById('navThird').disabled = false;
            renderThirdSelection();
            if (appState.thirdSelected.length === 8) {
                document.getElementById('navKnockout').disabled = false;
                renderTournament();
                switchTab('knockoutTab');
            }
        }
    } catch (e) {}
}

function switchTab(tabId) {
    document.querySelectorAll('.section-content').forEach(c => c.classList.add('section-hidden'));
    document.getElementById(tabId).classList.remove('section-hidden');
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    
    let activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
    if(activeBtn) activeBtn.classList.add('active');
    
    window.scrollTo(0, 0);

    if(tabId === 'knockoutTab') {
        setTimeout(() => {
            const wrapper = document.getElementById('tournamentWrapper');
            const board = document.getElementById('bracketBoard');
            if(wrapper && board) wrapper.scrollLeft = (board.scrollWidth - wrapper.clientWidth) / 2;
        }, 100);
    }
}

function saveTournamentAsImage() {
    const element = document.getElementById('tournamentWrapper');
    let originalOverflow = element.style.overflowX;
    element.style.overflowX = 'visible';

    html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
    }).then(canvas => {
        element.style.overflowX = originalOverflow;
        let dataUrl = canvas.toDataURL("image/png");
        document.getElementById('modalImage').src = dataUrl;
        document.getElementById('imageModal').style.display = "block";
    }).catch(err => {
        element.style.overflowX = originalOverflow;
        alert("画像の作成に失敗しました。スクリーンショット機能をご利用ください。");
    });
}

function closeModal() {
    document.getElementById('imageModal').style.display = "none";
}

// 初期起動コード
window.addEventListener('DOMContentLoaded', () => {
    renderGroupStage();
    loadFromURL();
});
