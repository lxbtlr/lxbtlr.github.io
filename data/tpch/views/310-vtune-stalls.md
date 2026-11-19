# vtune stalls
tab: chart

Cycles per TPC-H query and build at SF 1 from VTune: retiring (useful work) plus the Sirin and Ailamaki stall categories. Show switches between share of runtime, share of stall time (retiring hidden) and milliseconds.

```sql
SELECT machine, sf, query, query_label,
       CASE f.build WHEN 'VW:cmake_defaults' THEN 'VW' ELSE f.build END AS build,
       build_short,
       build_order, category, category_order, is_stall, value_ms, pct_of_stall,
       stall_ms, total_ms
FROM fig_vtune_breakdown f
WHERE f.sf = 1
  AND f.build NOT IN ('Typer@HEAD', 'VW:jd_all_pc')
  AND f.query <> 5
```

```json
{
 "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
 "description": "Runtime per TPC-H query and build, split into retiring and the Sirin & Ailamaki stall categories.",
 "data": {
  "name": "table"
 },
 "params": [
  {
   "name": "machine",
   "value": "dubliner",
   "bind": {
    "input": "select",
    "options": [
     "dubliner",
     "manchego"
    ],
    "name": "Machine "
   }
  },
  {
   "name": "mode",
   "value": "pct",
   "bind": {
    "input": "select",
    "options": [
     "pct",
     "stall",
     "ms"
    ],
    "labels": [
     "% of runtime",
     "% of stall time",
     "Runtime ms"
    ],
    "name": "Show "
   }
  }
 ],
 "transform": [
  {
   "filter": "datum.machine == machine && (mode != 'stall' || datum.category != 'Retiring')"
  },
  {
   "calculate": "100 * datum.value_ms / datum.total_ms",
   "as": "pct_of_total"
  },
  {
   "calculate": "mode == 'pct' ? datum.pct_of_total : mode == 'stall' ? datum.pct_of_stall : datum.value_ms",
   "as": "y"
  }
 ],
 "facet": {
  "column": {
   "field": "query_label",
   "type": "ordinal",
   "sort": {
    "field": "query"
   },
   "title": null,
   "header": {
    "labelOrient": "bottom",
    "labelPadding": 4
   }
  }
 },
 "spacing": 8,
 "spec": {
  "width": 134,
  "height": 200,
  "mark": {
   "type": "bar",
   "width": 22
  },
  "encoding": {
   "x": {
    "field": "build_short",
    "type": "nominal",
    "sort": {
     "field": "build_order",
     "op": "min"
    },
    "title": null,
    "axis": {
     "labelAngle": 0,
     "labelFontSize": 9,
     "labelPadding": 3,
     "ticks": false,
     "domain": false
    }
   },
   "y": {
    "field": "y",
    "type": "quantitative",
    "stack": "zero",
    "axis": {
     "title": {
      "expr": "mode == 'pct' ? '% of runtime' : mode == 'stall' ? '% of stall time' : 'Runtime ms'"
     }
    }
   },
   "color": {
    "field": "category",
    "type": "nominal",
    "scale": {
     "domain": [
      "Retiring",
      "Execution",
      "Dcache",
      "Decoding",
      "Branch misp.",
      "Icache",
      "Machine clears"
     ],
     "range": [
      "#fc8d62",
      "#e78ac3",
      "#8da0cb",
      "#66c2a5",
      "#ffd92f",
      "#e5c494",
      "#a6d854"
     ]
    },
    "sort": [
     "Retiring",
     "Execution",
     "Dcache",
     "Decoding",
     "Branch misp.",
     "Icache",
     "Machine clears"
    ],
    "title": null,
    "legend": {
     "orient": "top",
     "direction": "horizontal",
     "columns": 4
    }
   },
   "order": {
    "field": "category_order",
    "type": "quantitative"
   },
   "tooltip": [
    {
     "field": "query_label",
     "title": "Query"
    },
    {
     "field": "build",
     "title": "Build"
    },
    {
     "field": "category",
     "title": "Category"
    },
    {
     "field": "value_ms",
     "title": "ms",
     "format": ".1f"
    },
    {
     "field": "pct_of_total",
     "title": "% of runtime",
     "format": ".1f"
    },
    {
     "field": "pct_of_stall",
     "title": "% of stall",
     "format": ".1f"
    },
    {
     "field": "stall_ms",
     "title": "Stall ms",
     "format": ".1f"
    },
    {
     "field": "total_ms",
     "title": "Runtime ms",
     "format": ".1f"
    }
   ]
  }
 },
 "resolve": {
  "scale": {
   "x": "independent"
  }
 }
}
```
