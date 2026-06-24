# anglog — TODO / ロードマップ

釣果記録を共有するレスポンシブWebアプリ。**目標: 収益化（可能なら）＋ TypeScript 学習。**

## 体制
- **実装**: 本人が全コードを書く（CDK / Next.js / Lambda 等）。
- **レビュー**: Claude はレビュアー兼ガイド（コードは原則書かない）。設計先行レビュー → 実装レビュー。
- 詰まった時のデフォルト支援度: 概念ヒント＋見るべきAPI/ドキュメントの方向まで。

## 確定スタック（フルサーバーレス + CDK / AWS・月¥2000以内）
- フロント: Next.js + TypeScript（モバイルファースト）
- API: API Gateway (HTTP API) + Lambda
- DB: DynamoDB（オンデマンド / geohash で地理検索 / GSI / 分析は →S3→Glue→Athena）
- 認証: Amazon Cognito（10,000 MAU 無期限無料）
- 画像: S3（署名付きURL）
- IaC: AWS CDK (TypeScript)
- 地図: MapLibre GL JS + OpenStreetMap（無料）
- 天気: Open-Meteo（過去天気・無料）
- コスト監視: AWS Budgets（¥2000アラート）
- リポジトリ: pnpm workspace モノレポ / Node 22

---

## Phase 0. 基盤（← 今ここ）
**Definition of Done**
- [ ] `git init` 済み・`.gitignore`（node_modules, cdk.out, .env 等）整備
- [ ] pnpm workspace モノレポ構成
  - [ ] `apps/web` … Next.js (App Router) + TypeScript
  - [ ] `packages/infra` … AWS CDK (TypeScript)
  - [ ] `packages/shared` … 共有型（エンティティ/APIの型）
- [ ] ルート `tsconfig` を strict（`strict: true`, `noUncheckedIndexedAccess` 等）
- [ ] ESLint + Prettier 設定・`pnpm lint` / `pnpm format` が通る
- [ ] `pnpm build` が全パッケージで通る（空でもビルドOK）
- [ ] `CLAUDE.md` 作成（概要・コマンド・構成・規約）
- [ ] 初回コミット → レビュー依頼

## Phase 1. データ設計（最重要・コード前にレビュー）
- [ ] エンティティ定義: user / catch（釣果）/ parking（駐車場）/ weather（天気スナップショット）
- [ ] **DynamoDB 単一テーブル設計**（PK/SK 命名）
- [ ] **アクセスパターン一覧**を文書化（取得/一覧/絞り込み/地図範囲/期間 …）
- [ ] GSI 設計（必要な検索軸ごと）
- [ ] geohash による地理検索方針
- [ ] API 契約（エンドポイント＋ `packages/shared` の型）
- [ ] 設計レビュー通過 → 実装着手

## Phase 2. インフラ土台（CDK）
- [ ] DynamoDB テーブル + GSI
- [ ] Cognito User Pool / App Client
- [ ] S3 バケット（画像・署名付きURL前提・CORS）
- [ ] API Gateway (HTTP API) + hello Lambda
- [ ] AWS Budgets（¥2000 アラート）
- [ ] `cdk deploy` 成功 / IAM 最小権限 / RemovalPolicy 確認

## Phase 3. 認証（Cognito）
- [ ] サインアップ / ログイン / ログアウト（web）
- [ ] JWT を API に付与 → Lambda 側で検証（authorizer）
- [ ] 認証必須ルートの保護

## Phase 4. 釣果CRUD（中核）
- [ ] Lambda ハンドラ + DynamoDB アクセス層
- [ ] 入力検証（zod 等）
- [ ] web: 一覧 / 詳細 / 作成 / 編集（モバイルファースト）
- [ ] 位置・日時は任意/手入力（**過去日OK**・後から補完可）
- [ ] 全体公開で表示

## Phase 5. 地図（MapLibre）
- [ ] 地図表示（OSM タイル）
- [ ] ピン留め（釣果地点の設定/編集）
- [ ] 表示範囲(bbox)を geohash で検索（過剰 read 防止）

## Phase 6. 天気（Open-Meteo）
- [ ] 位置+日時確定時に過去天気を取得しスナップショット保存
- [ ] 失敗時のフォールバック / 二重取得防止

## Phase 7. 駐車場
- [ ] 駐車場 CRUD（釣果と共通化を検討）
- [ ] 地図上に駐車場ピン

## Phase 8. PWA / レスポンシブ仕上げ
- [ ] manifest / Service Worker / ホーム追加
- [ ] スマホUX調整・Lighthouse 確認

## Phase 9. 収益化準備
- [ ] 収益モデル決定（プレミアム機能 / 広告 / アフィリエイト 等）
- [ ] Stripe 決済（課金する場合）
- [ ] 利用規約・プライバシーポリシー
- [ ] **位置情報の粗化（丸め）オプション**（個人情報配慮）
- [ ] フォロー機能＋公開/非公開（プレミアム連動の検討）

## Phase 10. 公開
- [ ] フロント配信（Amplify or S3+CloudFront）
- [ ] 独自ドメイン / HTTPS
- [ ] コスト再確認・本番監視

---

## メモ / 留意点
- 位置情報は個人情報性が高い → 共有時の粗化を早めに設計余地として残す。
- ¥2000 を超え始めたら収益化フェーズのサイン。Dynamo read 最適化 / CloudFront キャッシュを検討。
- 共有は当面「全体公開のみ」。非公開/フォローは Phase 9。
