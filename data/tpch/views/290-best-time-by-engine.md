# best time by engine
tab: chart

Best (minimum) mean time per machine and query at SF 1, one thread: Typer and Tectorwise from their cmake_defaults builds, Otherwise from every fair_best build.

```sql
-- Best (minimum) mean time per machine, query and engine. Typer and
-- Tectorwise are the cmake_defaults builds; Otherwise is every fair_best
-- build of the vectorized engine.
SELECT node, query, q_number,
       CASE WHEN engine = 'h' THEN 'Typer'
            WHEN config_name LIKE 'cmake_defaults%' THEN 'Tectorwise'
            ELSE 'Otherwise' END AS system,
       ROUND(MIN(mean_ms), 3) AS best_ms,
       COUNT(*)               AS runs_considered
FROM v_runs
WHERE quality = 'clean'
  AND sf_label = 'sf1'
  AND threads  = 1
  AND q_number <> 5
  AND mean_ms IS NOT NULL
  AND (config_name LIKE 'cmake_defaults%'
       OR (engine = 'v' AND config_name LIKE 'fair_best%'))
GROUP BY node, q_number, system
ORDER BY node, q_number, system
```

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {"text": "Query Execution Time (ms)", "orient": "left", "anchor": "middle", "fontSize": 11, "fontWeight": "normal"},
  "facet": {"field": "query", "type": "nominal", "title": null, "sort": {"field": "q_number"},
            "header": {"labelFontSize": 10, "labelPadding": 2}},
  "columns": 1,
  "spacing": 6,
  "spec": {
    "width": 250,
    "height": 70,
    "mark": {"type": "bar", "tooltip": true},
    "encoding": {
      "x": {"field": "node", "type": "nominal", "title": null,
            "axis": {"labelAngle": -40, "labelFontSize": 9},
            "scale": {"paddingInner": 0.25, "paddingOuter": 0.1}},
      "xOffset": {"field": "system", "type": "nominal",
                  "sort": ["Typer", "Tectorwise", "Otherwise"]},
      "y": {"field": "best_ms", "type": "quantitative", "title": null,
            "axis": {"labelFontSize": 9, "titleFontSize": 10, "tickCount": 3}},
      "color": {"field": "system", "type": "nominal", "title": null,
                "scale": {"domain": ["Typer", "Tectorwise", "Otherwise"],
                          "range": ["#fc8d62", "#8da0cb", "#66c2a5"]},
                "legend": {"orient": "top", "direction": "horizontal", "labelFontSize": 10, "symbolSize": 60}}
    }
  },
  "resolve": {"scale": {"y": "independent"}}
}
```
