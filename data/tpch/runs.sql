-- Which runs of the full corpus to publish (make subset-tpch). Must return
-- one column of run ids; the result is written to runs.txt.
--
-- The *_perfops builds (baseline, cmake_defaults, fair_best per machine)
-- replace a machine's earlier runs once that machine has any; machines still
-- waiting on theirs keep the earlier runs.
--   burrata   4508 4509 4510 4512
--   manchego  4513 4514 4515
--   roquefort 4516 4517 4518
--   dubliner  4519 4520 4521
--
-- Timing runs of the vectorized engine, SF1, one GCC and one Clang build each
-- (the compiler is in the batch label), published alongside the perfops runs:
--                cmake_defaults gcc/clang   fair_best gcc/clang
--   burrata      4546 4549                  4548 4551
--   dubliner     4547 4552                  4550 4553
--   manchego     4539 4542                  4541 4544
--   roquefort    4538 4543                  4540 4545
WITH perfops(build_event_id) AS (
  VALUES (4508), (4509), (4510), (4512),
         (4513), (4514), (4515),
         (4516), (4517), (4518),
         (4519), (4520), (4521)
),
compilers(build_event_id) AS (
  VALUES (4546), (4549), (4548), (4551),
         (4547), (4552), (4550), (4553),
         (4539), (4542), (4541), (4544),
         (4538), (4543), (4540), (4545)
),
swapped AS (
  SELECT DISTINCT node FROM v_runs
  WHERE build_event_id IN (SELECT build_event_id FROM perfops)
)
SELECT run_id FROM v_runs
WHERE build_event_id IN (SELECT build_event_id FROM perfops)
   OR build_event_id IN (SELECT build_event_id FROM compilers)
   OR (build_event_id BETWEEN 4484 AND 4507
       AND node NOT IN (SELECT node FROM swapped));
