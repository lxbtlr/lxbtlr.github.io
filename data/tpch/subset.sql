-- Cut the published subset of the TPC-H corpus (make subset-tpch): the runs
-- listed in runs.txt and every row they reference or that hangs off them.
-- Runs on a scratch COPY of the full database, from this directory.
PRAGMA foreign_keys = OFF;
CREATE TEMP TABLE keep_run(run_id INTEGER PRIMARY KEY);
.import runs.txt keep_run

DELETE FROM run               WHERE run_id NOT IN (SELECT run_id FROM keep_run);
DELETE FROM run_counter       WHERE run_id NOT IN (SELECT run_id FROM run);
DELETE FROM run_quality_event WHERE run_id NOT IN (SELECT run_id FROM run);
DELETE FROM run_canary        WHERE run_id NOT IN (SELECT run_id FROM run);
DELETE FROM run_timeline      WHERE run_id NOT IN (SELECT run_id FROM run);

-- Batches the kept runs came from; environment observations from those batches.
DELETE FROM ingest_batch WHERE batch_id NOT IN (SELECT batch_id FROM run);
DELETE FROM run_canary   WHERE batch_id NOT IN (SELECT batch_id FROM ingest_batch);
DELETE FROM run_timeline WHERE batch_id NOT IN (SELECT batch_id FROM ingest_batch);
DELETE FROM run_environment  WHERE batch_id NOT IN (SELECT batch_id FROM ingest_batch);
DELETE FROM environment_fact WHERE env_obs_id NOT IN (SELECT env_obs_id FROM run_environment);

-- Build and task chain.
DELETE FROM task        WHERE task_id NOT IN (SELECT task_id FROM run);
DELETE FROM null_sample WHERE task_id NOT IN (SELECT task_id FROM task);
DELETE FROM build_event WHERE build_event_id NOT IN (SELECT build_event_id FROM run);
DELETE FROM binary      WHERE binary_id NOT IN (SELECT binary_id FROM build_event);
DELETE FROM build_spec  WHERE spec_id NOT IN (SELECT spec_id FROM build_event);
-- machine, machine_snapshot, spec_capture, dataset, query, engine, pmu_event,
-- csv_column, header_*, quality_rule, canary, schema_migrations: small, kept whole.

PRAGMA foreign_keys = ON;
PRAGMA foreign_key_check;
