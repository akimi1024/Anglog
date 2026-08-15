// 合成シードデータ登録スクリプト（スクレイピングなし・実在スポット×魚種のもっともらしいデータ）
// 対象エリア: 淡路島 / 和歌山 / 福井 / 三重
// 使い方:
//   1) ログイン済みサイトの localStorage から idToken をコピー
//   2) TOKEN='<idToken>' node scripts/seed.mjs
//
// POST /catches を叩くので、geohash / GSIキー / 当時の天気取得は既存の create.ts が処理する。

const API = "https://7g2r8b940f.execute-api.ap-northeast-1.amazonaws.com";
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("TOKEN 環境変数が未設定です。例: TOKEN='eyJ...' node scripts/seed.mjs");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// caughtAt は直近92日以内（Open-Meteoの過去天気が取れる範囲）。JSTの h:min をUTCに変換。
const iso = (y, m, d, h = 5, min = 30) =>
  new Date(Date.UTC(y, m - 1, d, h - 9, min)).toISOString();

// 実在スポット（おおよその緯度経度）
const S = {
  // 淡路島
  sumoto: { area: "淡路島（洲本）", lat: 34.34, lon: 134.9 },
  iwaya: { area: "淡路島（岩屋）", lat: 34.58, lon: 135.02 },
  yura: { area: "淡路島（由良）", lat: 34.28, lon: 134.98 },
  fukura: { area: "淡路島（福良）", lat: 34.25, lon: 134.72 },
  // 和歌山
  kada: { area: "和歌山（加太）", lat: 34.28, lon: 135.06 },
  kushimoto: { area: "和歌山（串本）", lat: 33.47, lon: 135.78 },
  wakayamaKita: { area: "和歌山（北港）", lat: 34.24, lon: 135.13 },
  tanabe: { area: "和歌山（田辺）", lat: 33.73, lon: 135.38 },
  hatsushima: { area: "和歌山（初島）", lat: 34.08, lon: 135.13 },
  // 福井
  obama: { area: "福井（小浜）", lat: 35.5, lon: 135.74 },
  tsuruga: { area: "福井（敦賀）", lat: 35.65, lon: 136.07 },
  mikuni: { area: "福井（三国）", lat: 36.22, lon: 136.15 },
  echizen: { area: "福井（越前海岸）", lat: 35.98, lon: 136.05 },
  otomi: { area: "福井（音海）", lat: 35.55, lon: 135.55 },
  // 三重
  ago: { area: "三重（英虞湾・志摩）", lat: 34.3, lon: 136.82 },
  owase: { area: "三重（尾鷲）", lat: 34.07, lon: 136.19 },
  tsu: { area: "三重（津）", lat: 34.72, lon: 136.52 },
  toba: { area: "三重（鳥羽）", lat: 34.48, lon: 136.84 },
  yokkaichi: { area: "三重（四日市）", lat: 34.96, lon: 136.63 },
  kumano: { area: "三重（熊野）", lat: 33.89, lon: 136.1 },
};

// method: lure | bait | other
const catches = [
  // --- 淡路島 ---
  { species: "タチウオ", ...S.sumoto, size: 80, count: 3, method: "lure", tackle: "ワインド", caughtAt: iso(2026, 7, 10, 19, 0), memo: "太刀魚シーズン、指3〜4本。夕マズメ好調。" },
  { species: "アオリイカ", ...S.iwaya, size: 22, count: 2, method: "other", tackle: "エギ 3.5号", caughtAt: iso(2026, 6, 22, 5, 0), memo: "エギング。深場を攻めて600g級も。" },
  { species: "ハマチ", ...S.yura, size: 42, count: 2, method: "lure", tackle: "ジグ 40g", reel: "4000番", caughtAt: iso(2026, 7, 24, 6, 0), memo: "青物回遊、朝一ナブラ撃ち。" },
  { species: "アジ", ...S.fukura, size: 24, count: 14, method: "bait", tackle: "サビキ 3号", caughtAt: iso(2026, 7, 3, 5, 30), memo: "サビキで数釣り、中アジ主体。" },
  { species: "ガシラ", ...S.sumoto, size: 20, count: 6, method: "bait", tackle: "探り釣り", caughtAt: iso(2026, 7, 30, 20, 0), memo: "テトラ周りの根魚。夜。" },
  { species: "マダコ", ...S.iwaya, count: 3, method: "other", tackle: "タコエギ", caughtAt: iso(2026, 7, 6, 9, 0), memo: "淡路のタコ、1kg頭。" },

  // --- 和歌山 ---
  { species: "アオリイカ", ...S.kada, size: 21, count: 3, method: "other", tackle: "エギ 3.0号", caughtAt: iso(2026, 6, 18, 5, 0), memo: "加太エギング、藻場周り。" },
  { species: "グレ", ...S.kushimoto, size: 35, count: 2, method: "bait", tackle: "フカセ 1.5号", caughtAt: iso(2026, 7, 12, 6, 30), memo: "串本磯、口太グレ。" },
  { species: "チヌ", ...S.wakayamaKita, size: 38, count: 1, method: "bait", tackle: "ヘチ", caughtAt: iso(2026, 7, 17, 6, 0), memo: "北港の落とし込み、コーナー際。" },
  { species: "キス", ...S.tanabe, size: 21, count: 15, method: "bait", tackle: "投げ 天秤", caughtAt: iso(2026, 7, 8, 7, 0), memo: "砂浜からの投げ、良型混じり。" },
  { species: "カンパチ", ...S.kushimoto, size: 40, count: 1, method: "lure", tackle: "ジグ 60g", reel: "5000番", caughtAt: iso(2026, 7, 26, 6, 0), memo: "シオ（カンパチ幼魚）、ナブラ撃ち。" },
  { species: "タチウオ", ...S.hatsushima, size: 78, count: 4, method: "lure", tackle: "テンヤ", caughtAt: iso(2026, 8, 1, 19, 0), memo: "初島の夏タチ、指3本。" },

  // --- 福井 ---
  { species: "アオリイカ", ...S.obama, size: 20, count: 2, method: "other", tackle: "エギ 3.5号", caughtAt: iso(2026, 6, 25, 5, 0), memo: "小浜エギング、朝マズメ。" },
  { species: "キス", ...S.tsuruga, size: 22, count: 12, method: "bait", tackle: "投げ 天秤", caughtAt: iso(2026, 7, 9, 7, 0), memo: "敦賀の砂浜、ピンギス混じり。" },
  { species: "マダイ", ...S.otomi, size: 38, count: 1, method: "bait", tackle: "ぶっこみ", caughtAt: iso(2026, 7, 15, 5, 30), memo: "音海の夜明け前、真鯛ヒット。" },
  { species: "アジ", ...S.mikuni, size: 25, count: 10, method: "bait", tackle: "サビキ 3号", caughtAt: iso(2026, 6, 30, 5, 0), memo: "三国港内、サビキで良型。" },
  { species: "ヒラメ", ...S.echizen, size: 45, count: 1, method: "lure", tackle: "ミノー 12cm", caughtAt: iso(2026, 7, 20, 6, 0), memo: "越前海岸のサーフ、朝一で座布団級。" },
  { species: "メバル", ...S.tsuruga, size: 23, count: 5, method: "lure", tackle: "ワーム 2インチ", caughtAt: iso(2026, 6, 14, 20, 0), memo: "メバリング、常夜灯周り。" },

  // --- 三重 ---
  { species: "アオリイカ", ...S.ago, size: 23, count: 3, method: "other", tackle: "エギ 3.5号", caughtAt: iso(2026, 6, 21, 5, 0), memo: "英虞湾エギング、良型連発。" },
  { species: "グレ", ...S.owase, size: 33, count: 2, method: "bait", tackle: "フカセ 1.5号", caughtAt: iso(2026, 7, 13, 6, 30), memo: "尾鷲の地磯、梅雨グレ。" },
  { species: "チヌ", ...S.tsu, size: 40, count: 1, method: "bait", tackle: "紀州釣り", caughtAt: iso(2026, 7, 18, 6, 0), memo: "津の堤防、ダンゴ釣り。" },
  { species: "キス", ...S.toba, size: 20, count: 13, method: "bait", tackle: "投げ 天秤", caughtAt: iso(2026, 7, 5, 7, 0), memo: "鳥羽の砂浜、数釣り。" },
  { species: "タチウオ", ...S.yokkaichi, size: 82, count: 3, method: "lure", tackle: "ワインド", caughtAt: iso(2026, 8, 3, 19, 0), memo: "四日市の夏タチ、指4本。" },
  { species: "カサゴ", ...S.kumano, size: 21, count: 6, method: "bait", tackle: "探り釣り", caughtAt: iso(2026, 7, 28, 20, 0), memo: "熊野の磯際、根魚数釣り。" },
];

const run = async () => {
  let ok = 0;
  for (const c of catches) {
    const body = {
      species: c.species,
      caughtAt: c.caughtAt,
      size: c.size,
      count: c.count,
      method: c.method,
      tackle: c.tackle,
      reel: c.reel,
      areaName: c.area,
      memo: c.memo,
      imageKeys: [],
      isPublic: true,
      location: { lat: c.lat, lon: c.lon },
    };
    const res = await fetch(`${API}/catches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    console.log(res.status, c.species, c.area);
    if (res.ok) ok++;
    else console.error("  失敗:", await res.text());
    await sleep(300); // 天気API等に優しく
  }
  console.log(`\n完了: ${ok}/${catches.length} 件登録`);
};

run();
