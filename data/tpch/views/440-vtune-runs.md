# vtune runs: data

One row per VTune collection: runtime, GHz, cycles and instructions per tuple. SF 1 only.

```sql
SELECT * FROM fig_vtune_runs
WHERE sf = 1
```
