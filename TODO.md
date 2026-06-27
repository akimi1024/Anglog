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

## Phase 0. 基盤
**Definition of Done**
- [x] `git init` 済み・`.gitignore`（node_modules, cdk.out, .env 等）整備
- [x] pnpm workspace モノレポ構成（ルート package.json / pnpm-workspace.yaml / Corepack で pnpm 固定）
  - [x] `apps/web` … Next.js 16 (App Router) + TypeScript + Tailwind（`pnpm dev` 起動確認済み）
  - [~] `packages/infra` … 最小プレースホルダのみ。CDK 実構築は Phase 2
  - [~] `packages/shared` … 最小プレースホルダのみ。型本体と参照配線は Phase 1
- [x] `apps/web` tsconfig strict（root 共通 `tsconfig.base.json` は Phase 1 で導入）
- [~] ESLint は web に同梱。root Prettier / root tsconfig.base は必要時に追加
- [x] `pnpm dev` で web 起動
- [x] `CLAUDE.md` 作成
- [ ] Phase 0 コミット → Phase 1 へ
（注: noUncheckedIndexedAccess 等の追加厳格化は任意。shared/infra の作り込みは各フェーズで実施）

## Phase 1. データ設計（最重要・コード前にレビュー）
- [x] アクセスパターン一覧（DESIGN.md / 釣果C1-C9・駐車場P1-P3・U1）
- [x] DynamoDB 単一テーブル設計（PK/SK・GSI1/2/3）— DESIGN.md
- [x] GSI 設計・任意ANDのクエリ戦略
- [x] geohash による地理検索方針
- [x] 設計レビュー通過
- [x] `packages/shared` に TS 型を定義（Catch/Parking/User/geo＋Create/Update/Search型）
- [x] `packages/shared` の型公開設定（exports/types・node16・dist出力）— build緑
- [ ] web/infra から実 import 確認（Phase 4 で実使用時に確認）
- [x] API 契約（エンドポイント定義・Page<T>・DESIGN.md に記載）

## Phase 2. インフラ土台（CDK）
- [x] CDKプロジェクト雛形（cdk.json/bin/lib/tsconfig）— `cdk synth` 空スタック通過（AWS未接続）
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
