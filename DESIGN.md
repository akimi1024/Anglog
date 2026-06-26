# anglog — データ設計（Phase 1）

DynamoDB 単一テーブル設計。MVP は GSI + FilterExpression + geohash で対応し、
データ増大時は DynamoDB Streams → 検索エンジン（OpenSearch/Typesense等）を追加する段階的方針。

## エンティティ
- **User**: プロフィール
- **Catch（釣果）**: 本体
- **ParkingSpot（駐車場）**: 全ユーザー共同編集
- **天気**: Catch に 1:1 で埋め込み（別アイテムにしない）

## Catch フィールド
| 項目 | 説明 | 検索利用 |
|---|---|---|
| catchId | 識別子 | |
| userId | 所有者 | スコープ（自分） |
| caughtAt | 釣行日時（任意/過去日OK） | **期間絞り込み・新着ソート** |
| species | 魚種 | **絞り込み** |
| size | サイズ(cm等) | |
| count | 数(尾数) | |
| method | 釣り方 | **絞り込み** |
| tackle | タックル（竿等） | |
| reel | リール | |
| memo | メモ | |
| imageKeys[] | S3 の画像キー | |
| lat / lon | 緯度経度（任意・後から補完可） | |
| geohash | lat/lon から算出 | **地図bbox絞り込み** |
| areaName | エリア名（県/釣り場名） | **エリア名絞り込み** |
| weather | 天気スナップショット（map: 天候/気温/風/気圧等） | |
| isPublic | 公開フラグ（当面は常に true） | スコープ（全体） |
| createdAt / updatedAt | 監査 | |

## アクセスパターン（確定）
### 釣果
- C1 作成（本人）
- C2 自分の一覧（新しい順）
- C3 自分の絞り込み検索（魚種/釣り方/期間/エリア、**全条件 任意のAND**）
- C4 自分の1件詳細
- C5 全公開の一覧（新着フィード）
- C6 全公開の絞り込み検索（同上、任意AND）
- C7 全公開の1件詳細
- C8 編集（本人）
- C9 削除（本人）
### 駐車場
- P1 作成（本人、場所/料金/詳細＋登録/更新日時）
- P2 地図bbox/釣り場周辺で取得
- P3 編集（**全ユーザー可**、料金/メモ更新、最終編集者・updatedAt 記録）
### その他
- U1 プロフィール取得

## 単一テーブル設計（叩き台）
テーブル名: `anglog` / 主キー: `PK`, `SK`

| アイテム | PK | SK | 主な属性 |
|---|---|---|---|
| Catch | `CATCH#<catchId>` | `META` | 上記フィールド一式 |
| ParkingSpot | `PARK#<parkingId>` | `META` | lat/lon, geohash, fee, memo, createdAt, updatedAt, lastEditedBy |
| User | `USER#<userId>` | `PROFILE` | 表示名 等 |

### GSI
| GSI | PK | SK | 用途 |
|---|---|---|---|
| **GSI1**（自分・日時） | `USER#<userId>` | `<caughtAt>` | C2/C3：自分の一覧・絞り込み（期間=SK範囲、魚種/釣り方=Filter） |
| **GSI2**（公開フィード） | `PUBLIC`（将来シャード `PUBLIC#0..n`） | `<caughtAt>` | C5/C6：全公開の新着・絞り込み |
| **GSI3**（地理/geohash） | `<type>#<geohashPrefix>` 例 `CATCH#9q5c` | `<geohash>#<caughtAt>` | 地図bbox：Catch/Parking の範囲取得（type で種別分離） |

### クエリ戦略（C3/C6 = 任意AND）
- 駆動軸を1つ選び、残りは FilterExpression：
  - **エリア(地図bbox)指定あり** → GSI3 を覆う geohash prefix を複数 Query → 残り(魚種/釣り方/期間/isPublic/userId)を Filter
  - **エリア指定なし** → GSI1(自分) or GSI2(公開) を caughtAt 範囲で Query → 残りを Filter
- **C4/C7 詳細** → `GetItem(PK=CATCH#<catchId>)` で直接取得
- **U1** → `GetItem(PK=USER#<id>, SK=PROFILE)`
- **P2** → GSI3 の `PARK#<prefix>` を Query
- **P3** → `GetItem(PK=PARK#<id>)` → 更新（所有者チェックなし＝共同編集）

### 注意・将来対応
- **geohash bbox**：表示範囲を覆う prefix 群を計算して複数 Query（ライブラリ例: ngeohash）。prefix 長でセル粒度を調整。
- **GSI2 のホットパーティション**：`PUBLIC` 単一キーは規模拡大で偏る → `PUBLIC#<0..n>` シャーディングで分散（MVPは単一でOK）。
- **複合検索が重くなったら**：DynamoDB Streams → 検索エンジンへ。
