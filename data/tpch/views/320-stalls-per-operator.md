# stalls per operator
tab: chart

For one TPC-H query at SF 1: each operator's runtime (its share of perf-sampled cycles times the untraced runtime), split by top-down stall category and grouped by build. The categories depend on what each machine's performance counters can measure. Operators under 1.5% of the run are merged.

```sql
SELECT machine, stall_model, sf, query, query_order,
       CASE f.build WHEN 'VW:cmake_defaults' THEN 'VW' ELSE f.build END AS build,
       build_order, build_ms, op_order, operator, op_family, op_label, op_ms,
       op_share, category, category_key, category_order, frac, ms
FROM fig_stalls_per_operator f
WHERE f.sf = 1
  AND f.build NOT IN ('Typer@HEAD', 'VW:jd_all_pc')
  AND f.query <> 'Q5'
```

```json
{
 "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
 "description": "Stalls per operator: for the selected query, each operator's runtime (its share of cycles x untraced runtime) split by top-down category; grouped by build. Categories depend on the machine's PMU model.",
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
   "name": "q",
   "value": "Q1",
   "bind": {
    "input": "select",
    "options": [
     "Q1",
     "Q3",
     "Q6",
     "Q9",
     "Q18"
    ],
    "name": "Query "
   }
  },
  {
   "name": "smode",
   "value": "ms",
   "bind": {
    "input": "select",
    "options": [
     "ms",
     "pct"
    ],
    "labels": [
     "Runtime ms",
     "% of operator"
    ],
    "name": "Show "
   }
  }
 ],
 "transform": [
  {
   "filter": "datum.machine === machine && datum.query === q"
  },
  {
   "calculate": "smode === 'pct' ? 100 * datum.frac : datum.ms",
   "as": "value"
  },
  {
   "calculate": "datum.build + '  (' + format(datum.build_ms, '.1f') + ' ms)'",
   "as": "build_head"
  },
  {
   "calculate": "smode === 'pct' ? format(datum.op_ms, '.1f') + ' ms' : format(100 * datum.op_share, '.0f') + '%'",
   "as": "end_label"
  }
 ],
 "facet": {
  "row": {
   "field": "build_head",
   "type": "nominal",
   "sort": {
    "field": "build_order"
   },
   "header": {
    "title": null,
    "labelAngle": 0,
    "labelAlign": "left",
    "labelOrient": "top",
    "labelAnchor": "start",
    "labelFontWeight": "bold",
    "labelPadding": 1,
    "labelFontSize": 12
   }
  }
 },
 "spacing": 4,
 "resolve": {
  "scale": {
   "y": "independent"
  }
 },
 "spec": {
  "width": 480,
  "height": {
   "step": 20
  },
  "encoding": {
   "y": {
    "field": "op_label",
    "type": "nominal",
    "title": null,
    "sort": {
     "field": "op_order",
     "op": "min"
    },
    "axis": {
     "ticks": false,
     "domain": false,
     "labelLimit": 250,
     "labelFontSize": 12
    }
   }
  },
  "layer": [
   {
    "mark": {
     "type": "bar",
     "height": {
      "band": 0.85
     },
     "tooltip": true
    },
    "encoding": {
     "x": {
      "field": "value",
      "type": "quantitative",
      "stack": "zero",
      "title": null,
      "axis": {
       "tickCount": 6,
       "labelFontSize": 11,
       "labelExpr": "smode === \"pct\" ? datum.label + \"%\" : (datum.index == 1 ? datum.label + \" ms\" : datum.label)"
      }
     },
     "color": {
      "field": "category",
      "type": "nominal",
      "title": null,
      "scale": {
       "domain": [
        "Retiring",
        "Front end",
        "Bad speculation",
        "Other (incl. bad spec.)",
        "Back end: memory",
        "Back end: core",
        "Back end"
       ],
       "range": [
        "#fc8d62",
        "#66c2a5",
        "#ffd92f",
        "#ffd92f",
        "#8da0cb",
        "#e78ac3",
        "#8da0cb"
       ]
      },
      "legend": {
       "orient": "top",
       "columns": 3,
       "symbolType": "square",
       "labelLimit": 220
      }
     },
     "order": {
      "field": "category_order",
      "type": "quantitative",
      "sort": "ascending"
     },
     "tooltip": [
      {
       "field": "build"
      },
      {
       "field": "op_family",
       "title": "family"
      },
      {
       "field": "operator"
      },
      {
       "field": "category"
      },
      {
       "field": "frac",
       "type": "quantitative",
       "format": ".0%",
       "title": "of operator"
      },
      {
       "field": "ms",
       "type": "quantitative",
       "format": ".1f",
       "title": "ms"
      },
      {
       "field": "op_ms",
       "type": "quantitative",
       "format": ".1f",
       "title": "operator ms"
      },
      {
       "field": "op_share",
       "type": "quantitative",
       "format": ".0%",
       "title": "of run"
      }
     ]
    }
   },
   {
    "transform": [
     {
      "aggregate": [
       {
        "op": "sum",
        "field": "value",
        "as": "tot"
       },
       {
        "op": "min",
        "field": "end_label",
        "as": "end_label"
       }
      ],
      "groupby": [
       "op_label",
       "op_order"
      ]
     }
    ],
    "mark": {
     "type": "text",
     "align": "left",
     "dx": 5,
     "fontSize": 12
    },
    "encoding": {
     "x": {
      "field": "tot",
      "type": "quantitative"
     },
     "text": {
      "field": "end_label"
     }
    }
   }
  ]
 }
}
```
