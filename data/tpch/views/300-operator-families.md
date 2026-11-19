# operator families
tab: chart

Single-threaded runtime per TPC-H query and build at SF 1, split by operator family from Linux perf sampling. T = Typer, TW = Tectorwise and VW = a minimally modernized version of Tectorwise. Typer is not split by operator.

```sql
SELECT machine, sf, query, query_order,
       CASE f.build WHEN 'VW:cmake_defaults' THEN 'VW' ELSE f.build END AS build,
       build_short,
       build_order, family, family_order, ms, pct, run_ms, solid
FROM fig_operator_families f
WHERE f.sf = 1
  AND f.build NOT IN ('VW:par_crc32', 'Typer@HEAD', 'VW:jd_all_pc')
  AND f.query <> 'Q5'
```

```json
{
 "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
 "description": "Operator families, every query: untraced median runtime per TPC-H query and build, split by each operator family's share of perf-sampled cycles. Typer builds are not split.",
 "data": {
  "name": "table"
 },
 "params": [
  {
   "name": "machine",
   "value": "burrata",
   "bind": {
    "input": "select",
    "options": [
     "burrata",
     "roquefort",
     "manchego",
     "dubliner"
    ],
    "name": "Machine "
   }
  },
  {
   "name": "mode",
   "value": "ms",
   "bind": {
    "input": "select",
    "options": [
     "ms",
     "pct"
    ],
    "labels": [
     "Runtime ms",
     "% of cycles"
    ],
    "name": "Show "
   }
  }
 ],
 "transform": [
  {
   "filter": "datum.machine === machine && datum.build !== 'VW:par_crc32'"
  },
  {
   "calculate": "mode === 'pct' ? datum.pct : datum.ms",
   "as": "value"
  }
 ],
 "facet": {
  "column": {
   "field": "query",
   "type": "ordinal",
   "sort": {
    "field": "query_order"
   },
   "header": {
    "title": null,
    "labelOrient": "bottom",
    "labelFontWeight": "bold",
    "labelPadding": 4
   }
  }
 },
 "spacing": 6,
 "spec": {
  "width": 134,
  "height": 200,
  "mark": {
   "type": "bar",
   "cornerRadiusEnd": 0,
   "tooltip": true
  },
  "encoding": {
   "x": {
    "field": "build_short",
    "type": "nominal",
    "sort": [
     "T",
     "TW",
     "VW"
    ],
    "title": null,
    "scale": {
     "paddingInner": 0.12,
     "paddingOuter": 0.1
    },
    "axis": {
     "labelAngle": 0,
     "ticks": false,
     "domain": false,
     "labelFontSize": 9,
     "labelPadding": 3,
     "labelAlign": "center",
     "labelBaseline": "top"
    }
   },
   "y": {
    "field": "value",
    "type": "quantitative",
    "stack": "zero",
    "title": null,
    "axis": {
     "labelExpr": "mode === \"pct\" ? datum.label + \"%\" : (datum.index == 1 ? datum.label + \" ms\" : datum.label)"
    }
   },
   "color": {
    "field": "family",
    "type": "nominal",
    "title": null,
    "scale": {
     "domain": [
      "Hashing",
      "Inlined hashing",
      "Join",
      "Selection",
      "Aggregation",
      "Projection",
      "Other",
      "Runtime (compiled, not split)"
     ],
     "range": [
      "#fc8d62",
      "#e5c494",
      "#8da0cb",
      "#66c2a5",
      "#e78ac3",
      "#ffd92f",
      "#a6d854",
      "#b3b3b3"
     ]
    },
    "legend": {
     "orient": "top",
     "columns": 4,
     "symbolType": "square",
     "labelLimit": 170,
     "columnPadding": 10,
     "labelExpr": "datum.label === \"Runtime (compiled, not split)\" ? \"Compiled, not split\" : datum.label"
    }
   },
   "order": {
    "field": "family_order",
    "type": "quantitative",
    "sort": "ascending"
   },
   "opacity": {
    "condition": {
     "test": "mode === 'pct' && datum.solid == 1",
     "value": 0.35
    },
    "value": 1
   },
   "tooltip": [
    {
     "field": "query"
    },
    {
     "field": "build"
    },
    {
     "field": "family"
    },
    {
     "field": "ms",
     "type": "quantitative",
     "format": ".1f",
     "title": "ms"
    },
    {
     "field": "pct",
     "type": "quantitative",
     "format": ".1f",
     "title": "% of cycles"
    },
    {
     "field": "run_ms",
     "type": "quantitative",
     "format": ".1f",
     "title": "run ms"
    }
   ]
  }
 },
 "resolve": {
  "scale": {
   "y": "shared"
  }
 }
}
```
