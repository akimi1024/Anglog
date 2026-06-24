# Anglog（アングログ）- Claude Code 引き継ぎドキュメント

## プロジェクト概要

釣りスポットの記録・共有アプリ。既存の釣り情報サイト（fishing.ne.jp等）の課題である
「場所の詳細がない・駐車場情報がない・天気が分からない・見づらい」を解決する。

### コンセプト
- 行く前に複数スポットを比較して意思決定できる
- 駐車場・天気・釣果をワンストップで確認できる
- まず自分用の記録ツールとして使い、後から公開機能を追加する

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js（TypeScript）+ Tailwind CSS |
| バックエンド | Python + FastAPI |
| DB | DynamoDB（PynamoDB） |
| 地図 | Google Maps API |
| 天気 | OpenWeatherMap API（リアルタイム取得、DB保存なし） |
| インフラ | AWS Lambda / API Gateway / CloudFront / Cognito / S3 |
| IaC | AWS CDK（TypeScript） |

---

## データモデル（DynamoDB）

### spotsテーブル

| キー | 値 |
|---|---|
| PK | `user_id` |
| SK | `spot_id`（UUID） |

**属性：**
```
name        : str  # スポット名
lat         : float  # 緯度
lng         : float  # 経度
parking     : str  # 駐車場情報（テキスト）
memo        : str  # フリーメモ
is_public   : bool  # 公開フラグ（フェーズ2で使用）
images      : list  # S3のキー一覧
created_at  : str  # ISO8601
updated_at  : str  # ISO8601
```

### fishingLogsテーブル（フェーズ2以降）

| キー | 値 |
|---|---|
| PK | `spot_id` |
| SK | `logged_at`（ISO8601） |

**属性：**
```
user_id     : str
weather     : str  # 天気メモ
tide        : str  # 潮汐メモ
temperature : float
catch       : list  # [{fish: "アジ", count: 3}, ...]
memo        : str
```

---

## 機能一覧

### フェーズ1（MVP・自分用）

- [ ] スポット登録（地図でピン立て・スポット名・駐車場メモ・フリーメモ・写真）
- [ ] スポット一覧表示（リスト＋地図）
- [ ] スポット詳細表示
- [ ] スポット編集・削除
- [ ] 各スポットの現在天気表示（OpenWeatherMap APIリアルタイム取得）
- [ ] Cognito認証（自分だけが使う）

### フェーズ2（公開・共有）

- [ ] `is_public` フラグONで他ユーザーに公開
- [ ] 公開スポットの閲覧（ログイン不要）
- [ ] 釣果ログの記録・表示
- [ ] スポット検索・フィルタ（魚種・地域等）

---

## APIエンドポイント（フェーズ1）

```
GET    /spots              # スポット一覧取得
POST   /spots              # スポット登録
GET    /spots/{spot_id}    # スポット詳細取得
PUT    /spots/{spot_id}    # スポット更新
DELETE /spots/{spot_id}    # スポット削除
GET    /spots/{spot_id}/weather  # 天気取得（OpenWeatherMap proxy）
POST   /spots/{spot_id}/images   # 画像アップロード（S3）
```

---

## ディレクトリ構成（予定）

```
/
├── frontend/          # Next.js
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
├── backend/           # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── models/    # PynamoDB models
│   │   └── schemas/   # Pydantic schemas
│   └── requirements.txt
├── infra/             # AWS CDK
│   ├── lib/
│   └── bin/
└── CLAUDE.md
```

---

## 設計方針

- DBはDynamoDB固定（固定費ゼロが最優先）
- 天気はAPIリアルタイム取得、DBに保存しない
- フェーズ1は認証済みユーザー（自分）のみ使用
- `is_public`フラグだけ最初から持たせておく（フェーズ2への布石）
- Shiftlyと同じスタックで統一する

---

## TODO（着手順）

1. リポジトリ作成
2. CDKでインフラ雛形作成（Lambda / API GW / DynamoDB / Cognito）
3. FastAPIでスポットCRUD実装
4. Google Maps APIでピン立てUI実装
5. OpenWeatherMap API連携
6. S3画像アップロード実装
7. フロント全体組み上げ

---

## 備考

- アプリ名：Anglog（アングログ）
- Shiftlyが落ち着いてから着手予定
- Google Maps APIは無料枠（月200ドル相当）を超えないよう注意
