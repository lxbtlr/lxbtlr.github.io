---
layout: layouts/project-post.njk
unlisted: true
title: Everything You Always Wanted to Know About Vectorized Query Processing But Were Told Otherwise
titleHtml: Everything You Always Wanted to Know About Vectorized Query Processing But Were Told <span class="title-hl">Otherwise</span>
description: This is a brief on an in-progress work with Peter Dinda and Andrew Crotty. For more information, reachout! 
descriptionHtml: This is a brief on an in-progress work with <a href="http://www.pdinda.org/">Peter Dinda</a> and <a href="https://cs.brown.edu/people/acrotty/">Andrew Crotty</a>. For more information, reachout! 
---

{% aside %}
{% dbplot "best time by engine", "Best time per query on each machine, SF1, one thread" %}
{% endaside %}

Analytical database engines execute queries in typically one of two flavors{% sidenote %} or some hybrid of the two {% endsidenote %}. 
**Vectorized** engines, in the style of VectorWise, interpret a query plan one 
batch of tuples at a time, running tight type-specialized loops over each batch. 
**Compiled** engines, in the style of HyPer, generate code that fuses each pipeline of operators into a single loop and keeps intermediate values in CPU registers.

In 2018, [Kersten et al.](https://doi.org/10.14778/3275366.3275370) built both
models in one codebase (*Typer* = compiled, *Tectorwise* = vectorized) so
they could be compared in a controlled setting. 
They found the two close in performance: compilation wins computation-heavy queries, vectorization holds a modest edge on memory-bound ones, SIMD helps vectorized query processing a little, and the results hold across tested hardware. 
These conclusions were drawn on the x86 machines of 2017 - 2018.
This work answers whether they still hold on today's datacenter hardware, and reconcile the original vectorized query processing implementation.

We expand Kersten's framework by:

- **Porting it to ARM.** The engines now build for AArch64, with x86 SIMD
  intrinsics mapped to ARM NEON through
  [SIMDe](https://github.com/simd-everywhere/simde). The port exposes a
  hashing effect: Tectorwise's default hash function, MurMurHash, slows
  the vectorized engine far more on ARM than on x86.
- **Adding micro-architectural analysis.** Each query is broken down by
  top-down stall category (retiring, front-end, bad speculation, memory, core)
  with VTune on the Intel machines, and with Linux `perf` counters everywhere
  else. Counters are normalized per tuple scanned. For the vectorized engines
  the breakdown also goes down to individual operators.
- **Building [Otherwise](#otherwise), an improved vectorized engine.** Using the same analysis
  we identify and fix the bottlenecks in Tectorwise with fair{%sidenote%} no runtime adaptive operator tuning. Generalizable results to other benchmarks like SSB. {%endsidenote%}, tunable implementation choices: SIMD, operator implementations such as compound primitives, and hash function selection.
- **NUMA compatibility** Updating the morsel driven parallelism execution framework to use a NUMA-aware allocations, thread placement and sharding policies.

We run five TPC-H queries, chosen to cover the main performance regimes of the full
benchmark, at scale factors 1 and 100:{% sidenote %} scale factor linearly scales the work and runtime {% endsidenote %}

- **Q1:** a computation-heavy scan with fixed-point aggregation over four groups.
- **Q3:** a three-table join with a selective filter, group-by and top-*N* sort.
- **Q6:** strict multi-attribute range filters on one table, dominated by selection.
- **Q9:** an eight-table join with a string-matching predicate.
- **Q18:** a correlated subquery with high-cardinality grouping.

Running them on four{% sidenote %} also tested less extensively on a Zen4, a SkylakeX, and AWS Graviton 3 machines. They all reproduced our results. 
{% endsidenote %} machines across x86 and ARM, with up to 176 threads:

| Architecture | Processor | Sockets &times; cores | Threads |
|---|---|---|---|
| Cascade Lake | Intel Xeon Gold 6238L | 4 &times; 22 | 176 |
| Emerald Rapids | Intel Xeon Silver 4509Y | 2 &times; 8 | 32 |
| Zen 3 (Milan) | AMD EPYC 7443P | 1 &times; 24 | 48 |
| Neoverse N1 | Ampere Altra Max | 1 &times; 128 | 128 |

All machines run Ubuntu 22.04, the engines are compiled with GCC 16 and
Clang 22, and each run is pinned to one core and its local NUMA node unless
stated otherwise.

##### Profiling Single-threaded TPC-H Runs

The profiling figures below come from separate runs: one thread pinned to
one core with node-local memory, at scale factor 1. The builds are labelled
**T** (Typer), **TW** (Tectorwise) and **VW** (a minimally modernized version
of Tectorwise).

The first figure profiles each operator to show where the vectorized engines
spend their single-threaded runtime.

{% dbplot "operator families", "Where single-threaded runtime goes in the vectorized engines, by operator family" %}

Across the four machines, in both Tectorwise and VW, a few operator families
dominate each query:

- **Q1:** aggregation (45&ndash;60%), then hashing (10&ndash;34%) and
  projection (17&ndash;24%).
- **Q3:** joins (37&ndash;48%), then hashing (21&ndash;32%) and selection
  (11&ndash;21%).
- **Q6:** selection (88&ndash;92%); projection makes up the rest.
- **Q9:** joins (54&ndash;63%) and hashing (27&ndash;38%).
- **Q18:** aggregation (68&ndash;82%), then hashing (10&ndash;24%).

We add another level of introspection by analyzing stalls, to identify where
each operator's costs come from: whether a cost is intrinsic to the engine
paradigm or an issue of implementation. We follow the VTune methodology of
[Sirin and Ailamaki](https://doi.org/10.14778/3380750.3380755), splitting each
query's cycles into retiring (useful work) and stalls on execution, data
cache, decoding, branch mispredictions, instruction cache and machine clears.
Execution stalls are cycles where the core's own execution units are the
bottleneck. VTune runs on the two Intel machines, Cascade Lake and Emerald
Rapids.

{% dbplot "vtune stalls", "Where each build's cycles go, from VTune: retiring and each stall category" %}

The figure above reproduces Sirin and Ailamaki's engine breakdown and lets us
compare how Typer and Tectorwise stall on the same query. Its Show menu
switches to each category's share of stall time, which the percentages below
use:

- **Q1:** Typer's runtime stalls are almost all execution (73&ndash;74%), with little
  waiting on the data cache. Tectorwise stalls for two to three times as long
  (54 vs 26 ms on Cascade Lake, 39 vs 14 ms on Emerald Rapids), and more of
  it is data cache (27&ndash;34%) as it materializes intermediate vectors.
- **Q6:** data-cache stalls dominate every build (54&ndash;80%). Typer also
  loses 16&ndash;19% to branch mispredictions, against about 1% for
  Tectorwise.
- **Q3 and Q9:** Typer stalls longer than Tectorwise on both machines (Q9:
  314 vs 216 ms on Cascade Lake, 106 vs 76 ms on Emerald Rapids), mostly on
  the data cache and branch mispredictions.

##### Profiling By Operator

To understand the stall composition of a query inside the vectorized engine,
we break it down per operator. Picking one query in the figure below shows
every operator on its own, split by where its cycles go: retiring useful
work, or stalled in the front end, on bad speculation, or in the back end.
Operators under 1.5% of the run are merged. Typer fuses all operators into a
single, flat loop, so its cost cannot be separated per operation of the query
plan, and it appears as one bar for the whole query.

{% dbplot "stalls per operator", "Each operator's runtime for one query, split by stall category" %}

Splitting each operator's time by stall category, as in the figure above,
shows what holds each family back:

###### Aggregation

Q1 and Q18 are the only queries where the compiled engine beats the vectorized
one, and in both the cost is aggregation: it dominates the runtime, and the
vectorized engines spend about twice as long retiring instructions for the
same work.

In Q1, aggregation is mostly retiring, followed by back-end core stalls from
port pressure.{% sidenote %}Retiring tracks how dense the key input vector is
(98%), and IPC is high.{% endsidenote %} In Q18, each of the two
aggregations in the subquery is only about a third retiring; bad speculation
and front-end stalls grow to about 41% of each one's
time.{% sidenote %}Back-end core stalls fall to 15%, and memory stalls
grow.{% endsidenote %} Both point to a lot of work per row,
which an algorithmic reduction would address.

###### Join Build Side
Never more than 12% of a query's runtime, and largely
  memory-bound: it is the first time most of these rows are touched, and the
  hash table is being built.
###### Join Probe Side
  Mostly front-end stalls, retiring and bad speculation.
  Probes take 52% of Q3's runtime, split across memory, bad speculation and
  front-end stalls in its two probes, and 70% of Q9's, mostly front-end and
  bad speculation.
###### Selection
  Q6 spends 90% of its runtime in selection, mostly stalled
  in the back end on memory, followed by retiring; front-end and core stalls
  make up less than 20% of its time. Q1's selection looks similar, with fewer
  memory stalls and more retiring. In Q3 and Q9 selection is 6% of the
  runtime, and Q9's is a string filter.
######  Projection
  20% of Q1's runtime, 40% of it memory stalls: a large
  share of time goes to materializing results between projections. 11% of
  Q6's runtime, 70% of it memory stalls. 3% of Q3's and Q9's runtime, with
  76% memory stalls in Q3.

These results alone reproduce the original findings of Kersten et al. and
Sirin and Ailamaki: compilation wins the computation-heavy query, and
vectorization holds its edge on the memory-bound ones. In many cases, though,
there are disparities that become harder to ignore:

- **The same build stalls differently on each machine.** On Q3, 43% of
  Typer's stalls are data cache on Cascade Lake, but on Emerald Rapids branch
  mispredictions take 43% and the data cache only 25%. On Q18, branch
  mispredictions are 17&ndash;25% of stalls on Cascade Lake and
  36&ndash;39% on Emerald Rapids, for every build.
- **Hashing Function Selection** Kersten intentionally controlled for and selected a hashing function for each engine. Typer uses CRC32 for its lower latency.{%sidenote%} CRC32's trade-off is an expected lower throughput due to port contention/pressure {%endsidenote%} 
Tectorwise uses an easily vectorized hashing function, MurMurHashv2 that uses more low cost instructions. This selection breaks down on ARM devices where instruction cost is appears to be more regular and runtime becomes more sensitive to instruction count.
This manifests in harming the vectorized engine on ARM devices.{% sidenote%}On the ARM machine, MurMurHash makes queries 17&ndash;27% slower than CRC32 hashing, against 2&ndash;10% on the x86 machines. The ARM (Neoverse N1) times reported on this page use CRC32.{% endsidenote%}
- **Front-end stalls matter for the vectorized engines.** Decoding is
  23&ndash;25% of Tectorwise's stalls on Q9 and Q18 on Cascade Lake, and
  44% of VW's on Q3 on Emerald Rapids.
- **Implementation matters as much as paradigm.** VW changes Tectorwise only
  minimally, yet on Cascade Lake it cuts stall time on Q3 from 57 to 35 ms,
  on Q9 from 216 to 105 ms and on Q18 from 310 to 172 ms, with a similar
  stall mix. On Emerald Rapids the gap is smaller (Q18: 104 to 78 ms).

<h2 id="otherwise">What if I told you Otherwise...</h2>

For the last decade Kersten's work has stood as the premiere comparison of these two engines. Typer and Tectorwise stand as pure embodiments of the extremes of compiled and vectorized query processing, the two most prominent successors to the Volcano-style interpreted model from the turn of the century. We contend the takeways from Kersten are accurate characterizations of Tectorwise's results, but not representative of vectorized query processing. When the bottlenecks of Tectorwise are reconciled, Vectorized query processing becomes dominant. We demonstrate this with Otherwise a successor to Tectorwise.

Across all four systems, Otherwise achieves a geomean speedup of **1.29&times;
over Tectorwise** and **1.38&times; over Typer**, comparing each engine's best
single-threaded time at SF1. It is faster than Typer on Q3, Q6 and Q9 on every
machine, and on Q1 and Q18 on most. Typer keeps its lead on Q1 on Cascade Lake
and Emerald Rapids, and edges ahead on Q18 on Emerald Rapids by about 1%. Engine selection matters on modern many-core systems, and once
the tunable factors are controlled, the vectorized model comes out ahead.

So far this post has focused on single-threaded, small scale factor runs on our selected hardware, but our work also addresses how the implementation can be adjusted to prevent bottlenecks, without compromising the integrity of a purely vectorized query processing engine. 
Other aspects of our work spans multi-threaded and data-scaling performance, targeting NUMA devices, and a deeper analysis over compiler effects (auto-vectorization, etc...).{%sidenote%} this will most likely be captured in another page {%endsidenote%}


{% box %}
This work is being prepared for submission to **VLDB 2027**.
{% endbox %}
