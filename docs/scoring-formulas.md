# Scoring Formulas

## 1. Search Relevance (`computeSearchScore`)
Components (weights adjustable):
| Component | Formula / Logic | Default Weight |
|-----------|-----------------|----------------|
| Title exact | if title == term | +80 |
| Title contains | substring | +50 |
| Description contains | substring | +10 |
| Issuer contains | substring | +issuerWeight (18) |
| Owner name contains | substring | +ownerNameWeight (22) |
| Phrase all tokens present | all tokens found in title | +15 |
| Contiguous phrase | title includes joined phrase | +10 |
| Word boundary (title) | regex boundary match | +8 |
| Word boundary (owner) | regex boundary match | +5 |
| Short exact title | len ≤15 & exact | +≤5 |
| Partial token (title) | prefix per token | partialTokenTitleBoost (20) |
| Partial token (issuer) | prefix per token | issuerWeight * 0.6 |
| Partial token (owner) | prefix per token | ownerNameWeight * 0.7 |
| Partial token (description) | prefix | +4 |
| Freshness | 30 * e^(-ageDays/14) | 0..30 |

Tuning: `SearchWeightConfig` persisted in local store → recompute each result list.

## 2. Hall of Fame (Normalized 0–100)

Component weight caps (sum 100):
| Component | Max | Logic |
|-----------|-----|-------|
| Evidence | 10 | มีไฟล์หลักฐาน ≥1 = 10 มิฉะนั้น 0 |
| Description | 25 | ตัวอักษรรวม: main description + (trainingBenefits, trainingNextActions, awardLevel, competitionCategory, otherSpecified) และ log(trainingHours) เล็กน้อย → min(effectiveLen / 440, 1)*25 |
| Recency | 15 | recencyRatio = max(0, (28 - ageDays/14)/28) (≈ ลดลงจน ~392 วัน) |
| URL | 5 | มีลิงก์อ้างอิง = 5 |
| Issuer | 10 | issuer length > 5 = 10 |
| Org Level | 15 | map ORG_LEVEL_POINTS (0..20) → * (15/20) |
| Type | 10 | map TYPE_POINTS (0..20) → * (10/20) |
| Owner Bonus | 10 | ดูสูตร ownerAggregateBonus (normalize raw → 0..10) |

Total baseScore = sum(Evidence..Type) (0..90) แล้วบวก Owner Bonus (0..10) → HOF Score = min(baseScore + ownerBonus, 100).

Owner Aggregate Bonus (normalized 0–10):
```
extraCount      = max(0, count - 1) * 20          // ผลงานเพิ่มแต่ชิ้นแรกให้ค่าคงที่ 20 ต่อชิ้น (ก่อน normalize)
evidenceFactor  = ln(totalEvidence + 1) * 5       // ผลตอบแทนลดหลั่นกับจำนวนไฟล์รวม
recencyFactor   = max(0, 15 - latestAgeDays/30)   // ผลงานล่าสุดใหม่ช่วยเพิ่ม
raw             = extraCount + evidenceFactor + recencyFactor
ownerBonus      = min(raw / 50 * 10, 10)          // raw≈50 => 10 เต็ม; เกินถูก cap
```

Explain Breakdown labels = evidence, description, recency, url, issuer, orgLevel, type, ownerBonus(xW)

## 3. Future Signals (Planned)
- Semantic tag overlap boost
- Engagement (views/likes) scaled diminishing returns
- Similarity penalty for near duplicates
