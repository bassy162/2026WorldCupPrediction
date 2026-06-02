// 全48カ国の国旗ISOコードマッピング
const flagCodeMap = {
    "メキシコ": "mx", "南アフリカ": "za", "韓国": "kr", "チェコ": "cz",
    "カナダ": "ca", "ボスニア・H": "ba", "カタール": "qa", "スイス": "ch",
    "ブラジル": "br", "モロッコ": "ma", "ハイチ": "ht", "スコットランド": "gb-sct",
    "アメリカ": "us", "パラグアイ": "py", "オーストラリア": "au", "トルコ": "tr",
    "ドイツ": "de", "キュラソー": "cw", "コートジボワール": "ci", "エクアドル": "ec",
    "オランダ": "nl", "日本": "jp", "スウェーデン": "se", "チュニジア": "tn",
    "ベルギー": "be", "エジプト": "eg", "イラン": "ir", "ニュージーランド": "nz",
    "スペイン": "es", "カーボベルデ": "cv", "サウジアラビア": "sa", "ウルグアイ": "uy",
    "フランス": "fr", "セネガル": "sn", "イラク": "iq", "ノルウェー": "no",
    "アルゼンチン": "ar", "アルジェリア": "dz", "オーストリア": "at", "ヨルダン": "jo",
    "ポルトガル": "pt", "コンゴ民主共和国": "cd", "ウズベキスタン": "uz", "コロンビア": "co",
    "イングランド": "gb-eng", "クロアチア": "hr", "ガーナ": "gh", "パナマ": "pa"
};

// 初期グループデータ
const groupsData = {
    "A": ["メキシコ", "南アフリカ", "韓国", "チェコ"], "B": ["カナダ", "ボスニア・H", "カタール", "スイス"],
    "C": ["ブラジル", "モロッコ", "ハイチ", "スコットランド"], "D": ["アメリカ", "パラグアイ", "オーストラリア", "トルコ"],
    "E": ["ドイツ", "キュラソー", "コートジボワール", "エクアドル"], "F": ["オランダ", "日本", "スウェーデン", "チュニジア"],
    "G": ["ベルギー", "エジプト", "イラン", "ニュージーランド"], "H": ["スペイン", "カーボベルデ", "サウジアラビア", "ウルグアイ"],
    "I": ["フランス", "セネガル", "イラク", "ノルウェー"], "J": ["アルゼンチン", "アルジェリア", "オーストリア", "ヨルダン"],
    "K": ["ポルトガル", "コンゴ民主共和国", "ウズベキスタン", "コロンビア"], "L": ["イングランド", "クロアチア", "ガーナ", "パナマ"]
};

const groupKeys = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// 基本トーナメント構造
const matchStructure = {
    "m73": { p1: '2A', p2: '2B', next: 'm90', nextPos: 'p1' }, "m74": { p1: '1E', p2: '3X', next: 'm89', nextPos: 'p1' },
    "m75": { p1: '1F', p2: '2C', next: 'm90', nextPos: 'p2' }, "m76": { p1: '1C', p2: '2F', next: 'm91', nextPos: 'p1' },
    "m77": { p1: '1I', p2: '3X', next: 'm89', nextPos: 'p2' }, "m78": { p1: '2E', p2: '2I', next: 'm91', nextPos: 'p2' },
    "m79": { p1: '1A', p2: '3X', next: 'm92', nextPos: 'p1' }, "m80": { p1: '1L', p2: '3X', next: 'm92', nextPos: 'p2' },
    "m81": { p1: '1D', p2: '3X', next: 'm94', nextPos: 'p1' }, "m82": { p1: '1G', p2: '3X', next: 'm94', nextPos: 'p2' },
    "m83": { p1: '2K', p2: '2L', next: 'm93', nextPos: 'p1' }, "m84": { p1: '1H', p2: '2J', next: 'm93', nextPos: 'p2' },
    "m85": { p1: '1B', p2: '3X', next: 'm96', nextPos: 'p1' }, "m86": { p1: '1J', p2: '2H', next: 'm95', nextPos: 'p1' },
    "m87": { p1: '1K', p2: '3X', next: 'm96', nextPos: 'p2' }, "m88": { p1: '2D', p2: '2G', next: 'm95', nextPos: 'p2' },
    "m89": { p1: '', p2: '', next: 'm97', nextPos: 'p1' }, "m90": { p1: '', p2: '', next: 'm97', nextPos: 'p2' },
    "m91": { p1: '', p2: '', next: 'm99', nextPos: 'p1' }, "m92": { p1: '', p2: '', next: 'm99', nextPos: 'p2' },
    "m93": { p1: '', p2: '', next: 'm98', nextPos: 'p1' }, "m94": { p1: '', p2: '', next: 'm98', nextPos: 'p2' },
    "m95": { p1: '', p2: '', next: 'm100', nextPos: 'p1' }, "m96": { p1: '', p2: '', next: 'm100', nextPos: 'p2' },
    "m97": { p1: '', p2: '', next: 'm101', nextPos: 'p1' }, "m98": { p1: '', p2: '', next: 'm101', nextPos: 'p2' },
    "m99": { p1: '', p2: '', next: 'm102', nextPos: 'p1' }, "m100": { p1: '', p2: '', next: 'm102', nextPos: 'p2' },
    "m101": { p1: '', p2: '', next: 'm104', nextPos: 'p1' }, "m102": { p1: '', p2: '', next: 'm104', nextPos: 'p2' },
    "m104": { p1: '', p2: '', next: null }
};

// 視覚的なツリーの並び
const visualLayout = [
    { title: 'Best 32', matches: ['m74','m77', 'm73','m75', 'm83','m84', 'm81','m82'] },
    { title: 'Best 16', matches: ['m89','m90', 'm93','m94'] },
    { title: 'Quarter', matches: ['m97','m98'] },
    { title: 'Semi',    matches: ['m101'] },
    { title: 'FINAL',   matches: ['m104'] },
    { title: 'Semi',    matches: ['m102'] },
    { title: 'Quarter', matches: ['m99','m100'] },
    { title: 'Best 16', matches: ['m91','m92', 'm95','m96'] },
    { title: 'Best 32', matches: ['m76','m78', 'm79','m80', 'm86','m88', 'm85','m87'] }
];

// ④ FIFA公式レギュレーションに基づく、3位チームの自動割当アルゴリズム
// 選ばれた8つのグループ文字から、各1位チーム(1A, 1B等)に紐づく最適な3位チームの枠をコンフリクトなく自動抽出します。
function getOfficialThirdPlaceMap(selectedGroups) {
    const sorted = [...selectedGroups].sort().join('');
    
    // 特定の組み合わせベースの割当リスト、及び同一グループ回避ロジックを実装
    const slots = { m74:'E', m77:'I', m79:'A', m80:'L', m81:'D', m82:'G', m85:'B', m87:'K' };
    const result = {};
    
    let pool = [...selectedGroups];
    const keys = Object.keys(slots);
    
    // 1次割当（自身のグループとの対戦を回避しながらマッピング）
    keys.forEach(key => {
        let targetGroup = slots[key]; 
        let matchIdx = pool.indexOf(targetGroup);
        if(matchIdx === -1 && pool.length > 0) {
            // 被りがない場合は先頭から割り当て
            result[key] = pool.shift();
        } else {
            // 被る場合は別のグループから補填
            let fallbackIdx = pool.findIndex(g => g !== targetGroup);
            if(fallbackIdx !== -1) {
                result[key] = pool.splice(fallbackIdx, 1)[0];
            } else {
                result[key] = pool.shift();
            }
        }
    });
    return result;
}
