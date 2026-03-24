---
tipo: padroes-que-funcionam
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Padroes Que Funcionam

## [2026-03-23] Payload de adset que funciona na Meta API v23.0
- **Contexto:** Apos multiplas tentativas, este e o payload minimo que cria adset com sucesso
- **Detalhes:**
  ```json
  {
    "name": "...",
    "campaign_id": "...",
    "status": "PAUSED",
    "targeting": { "geo_locations": { "countries": ["BR"] } },
    "billing_event": "IMPRESSIONS",
    "start_time": "2026-03-24",
    "bid_strategy": "LOWEST_COST_WITH_BID_CAP",
    "bid_amount": 15000,
    "promoted_object": { "pixel_id": "...", "custom_event_type": "PURCHASE" },
    "optimization_goal": "OFFSITE_CONVERSIONS"
  }
  ```
  - Campos como objetos nativos (sem stringify)
  - bid_strategy so quando BIDCAP/COST_CAP + bid_amount presente
  - Omitir bid_strategy para default (custo mais baixo)
- **Tags:** [[Meta-API]] [[adset]] [[payload]]

## [2026-03-23] graphPost com Content-Type application/json
- **Contexto:** Meta API aceita JSON no body do POST (nao precisa de form-data para campos simples)
- **Detalhes:** `Content-Type: application/json` + `JSON.stringify(body)`. Funciona para campaigns, adsets, ads. NAO funciona para `/adimages` (precisa de capability especial).
- **Tags:** [[Meta-API]] [[graphPost]]
