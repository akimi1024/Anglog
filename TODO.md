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
- [x] DynamoDB テーブル + GSI1/2/3（PAY_PER_REQUEST・synth確認・未deploy）
- [x] Cognito User Pool / App Client（email sign-in・SRP・secret無し）— synth確認。OAuth/Hosted UI設定はPhase 3で調整（implicit切る等）
- [x] S3 バケット（非公開・SSE-S3・CORS GET/PUT・autoDeleteObjects）— synth確認
- [x] API Gateway (HTTP API) + hello Lambda（NodejsFunction/esbuild・GET /hello・ApiUrl出力）— synth確認
- [x] AWS Budgets（$13/月・80%/100%通知）— synth確認
- [x] RemovalPolicy: DESTROY（開発中・本番はRETAINへ）
- [x] bootstrap + `cdk deploy`（AWS実体化済み・`GET /hello` 本番疎通確認）
  - API URL: https://6apfkq14we.execute-api.ap-northeast-1.amazonaws.com
- [ ] IAM 最小権限（Lambda→Dynamo/S3 の権限付与は Phase 4 で）

## Phase 3. 認証（Cognito）
- [x] Amplify導入＋設定（ConfigureAmplify / .env.local）
- [x] サインアップ（確認コード）/ ログイン / ログアウト（web）
- [x] ログイン状態表示（Header・useEffect＋Hub）
- [ ] JWT を API に付与 → 検証（authorizer）※Phase 4 とセットで実施
- [ ] 認証必須ルートの保護 ※Phase 4 とセットで実施
- [ ] （任意）Cognito ClientのOAuth/implicit既定の整理

## Phase 4. 釣果CRUD（中核）
- [x] JWTオーソライザ＋認証付き POST /catches（CDK）
- [x] createCatch ハンドラ（zod検証・キー/GSI/geohash組み立て・PutItem）— curl で201＆DynamoDB確認
- [x] GET /catches（公開フィード・GSI2 Query・Page<T>）/ GET /catches/me（自分・GSI1・認証必須）
- [x] GET /catches/{id}（詳細・GetItem・404）
- [x] PUT /catches/{id}（更新・所有者チェック403・GSIキー再構築）/ DELETE /catches/{id}（削除・所有者チェック・204）
- [x] web: 一覧 / 詳細 / 作成 / 編集 / 削除（モバイルファースト・JWT添付fetch）
  - [x] 作成フォーム（/catches/new・認証付きfetch lib/api.ts・CORS設定・UIから201確認）
  - [x] 一覧ページ（/catches・listCatches・useEffectで取得・新しい順表示）
  - [x] 詳細（/catches/[id]・動的ルート）/ 自分の一覧（/catches/me）/ 編集（/catches/[id]/edit・プリフィル）/ 削除ボタン
- [~] 位置・日時は任意/手入力（**過去日OK**・日時UI済／位置は地図=Phase5で）
- [x] 全体公開で表示（公開フィード /catches）

**Phase 4 完了（2026-07-14）。method任意化・zod型整合・CORS・所有者チェック等の学びを含む。**

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
- [ ] **UIデザイン刷新**（現状は素のTailwindで簡素。配色/余白/カード/タイポを整えて「いい感じ」に。デザインシステム or UIライブラリ検討）
- [ ] **レスポンシブ全面対応**（ブレークポイント統一・PC最適化。MVP中は各ページ `max-w-md` のモバイルファースト＋地図のみ最小対応で、PC最適化はここで一括。`md:`/`lg:` を体系的に）

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
