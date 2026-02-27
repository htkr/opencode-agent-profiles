# Solafune 建設コスト予測: 外部データ候補検討メモ

- 作成日: 2026-02-27
- 対象コンペ: https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1
- 対象議論:
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=discussion&id=&topicId=861d625d-e712-4647-98d3-dde5fb84bcb2
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=discussion&id=&topicId=2148bee9-9bae-4420-8a2e-5ba55c47d7c9

## 1. 事実整理（議論とデータ仕様）

1. 外部データは運営方針として許可されている（2026-02-25の公式アナウンス）。
2. 議論では、公式出典の建設統計（日本/フィリピン）＋為替で、外部データ単体予測でも RMSLE 約0.07 が報告されている。
3. 競技データは `geolocation_name` × `quarter_label` × `country` を軸にした回帰で、期間は 2019-01-01 から 2024-12-31 の四半期集約（Sentinel-2/VIIRS も四半期中央値）。
4. ルール上、利用可ライセンスは CC / CC BY / MIT / BSD / U.S. Public Domain / Apache 2.0（加えて運営判断の追加可）。有償・限定配布・商用不可は不可。

### 公開確認できた既存タブラー列（抜粋）

`data_id`, `geolocation_name`, `quarter_label`, `country`, `year`, `deflated_gdp_usd`, `us_cpi`, `developed_country`, `landlocked`, `region_economic_classification`, `access_to_airport`, `access_to_port`, `access_to_highway`, `access_to_railway`, `straight_distance_to_capital_km`, `seismic_hazard_zone`, `flood_risk_class`, `tropical_cyclone_wind_risk`, `tornadoes_wind_risk`, `koppen_climate_zone`, `sentinel2_tiff_file_name`, `viirs_tiff_file_name`, `construction_cost_per_m2_usd`（trainのみ）

## 2. 候補評価の基準

- 結合可能性: `country`・`geolocation_name`・`quarter_label` に無理なく寄せられるか。
- 目的変数近接性: `construction_cost_per_m2_usd` への直接/間接の寄与が強いか。
- 時系列整合性: 四半期時点で利用可能な情報だけで作れるか（将来情報混入を防ぐ）。
- ライセンス整合性: コンペルールの許可ライセンスに適合するか。
- 実装コスト: 取得安定性、前処理難易度、欠損率。

## 3. 外部データ候補（優先度付き）

| 優先度 | 候補 | 主な入手元 | 主な結合キー | 期待効果 | リスク/注意 |
|---|---|---|---|---|---|
| A | 日本/フィリピンの建設単価・工事費関連統計（公式原系列） | e-Stat 建築着工統計、PSA 建設許可統計 | `country`,`geolocation_name`,`quarter_label` | 目的変数に最も近く、議論実績でも高効果 | 実質リークに近い強さ。ルール許可でも説明責任が必要 |
| A | 四半期為替（JPY/USD, PHP/USD） | 公的為替データ（中央銀行/公的統計/FRED等） | `country`,`quarter_label` | 現地通貨→USD換算の誤差低減 | 日次/月次→四半期集約設計が必要 |
| A | 同統計内の補助系列（件数、床面積、用途別、構造別など） | e-Stat / PSA 同系表 | `country`,`geolocation_name`,`quarter_label` | 単価以外の構造差を補足、汎化しやすい | 表定義変更・欠損補完が必要 |
| B | 建設資材価格指数（セメント、鋼材、建材指数） | 各国公的統計/中央銀行/国際機関 | `country`,`quarter_label`（可能なら地域） | コスト変動ドライバを直接反映 | ライセンスと更新遅延の確認が必須 |
| B | 建設労務費・賃金指数（地域別） | 労働統計（公的統計） | `country`,`geolocation_name or region`,`quarter_label` | 人件費要因を補強 | 地域粒度ミスマッチが起こりやすい |
| B | エネルギー・燃料価格（電力、軽油等） | 公的エネルギー統計 | `country`,`quarter_label` | 施工コストの変動要因として有効 | 地域差が弱い場合は寄与限定 |
| C | 災害イベント時系列（台風接近回数、地震強度など） | IBTrACS, USGS など公開DB | `geolocation_name`,`quarter_label` | 既存の静的ハザード分類を動的化 | 前処理負荷が高い、過学習注意 |
| C | 景気・金利系時系列（政策金利、信用コスト） | 公的統計/中央銀行 | `country`,`quarter_label` | 国別の時期要因を補強 | 既存の `deflated_gdp_usd`,`us_cpi` と冗長化しやすい |

## 4. 実装の推奨順序

1. A群のうち「公式建設統計 + 為替」を先行実装し、ベースライン差分を確認。
2. 同じ出典から取れる補助系列（件数/床面積/用途等）を追加し、CVで寄与分解。
3. B群（資材・労務・エネルギー）を順次追加し、冗長特徴を削減。
4. C群は最終段階で採用判断（計算コストと過学習リスクを評価）。

## 5. 実装時のチェックポイント

- 期間整合: 2019Q1-2024Q4 の範囲で四半期集約し、将来情報を混ぜない。
- 地理整合: `geolocation_name` の表記ゆれ（都道府県コード付き名称、州/県名）を正規化。
- 再現性: 取得スクリプト、変換ルール、欠損補完ルールを固定。
- ライセンス: データごとに利用規約URL・ライセンスを記録（最終提出時の出典明記を想定）。

## 6. 参照リンク

- コンペ概要（データ出典・ルール）
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=about
- ルール（許可ライセンス条件）
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=about
- 外部データ是非の議論
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=discussion&id=&topicId=861d625d-e712-4647-98d3-dde5fb84bcb2
- 公式方針（外部データ許可）
  - https://solafune.com/ja/competitions/1918ccd7-eb06-4cfc-822f-a9823c63b2c1?menu=discussion&id=&topicId=2148bee9-9bae-4420-8a2e-5ba55c47d7c9
- データソース（競技ページ記載）
  - https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00600120&tstat=000001016965
  - https://openstat.psa.gov.ph/PXWeb/pxweb/en/DB/DB__2G__CONS__BGP/0012G4CBPC0.px/?rxid=bdf9d8da-96f1-4100-ae09-18cb3eaeb313
  - https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
  - https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_MONTHLY_V1_VCMSLCFG
