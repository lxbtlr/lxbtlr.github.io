NODE=bun run
ELEVENTY=$(NODE) eleventy

# TPC-H corpus viewer (data/tpch/). Views are authored in Thunderous-Pupil's
# web/views/*.md; sync-tpch rebuilds views.json there, checking every query
# against the published database, and copies it here minus the views named
# in data/tpch/views-exclude.txt, plus this site's own views in data/tpch/views/.
#   make subset-tpch                pick runs with data/tpch/runs.sql, record
#                                   their ids in data/tpch/runs.txt, then
#                                   corpus-tpch and sync-tpch
#   make corpus-tpch                cut data/tpch/corpus.sqlite from the full
#                                   corpus: exactly the runs in runs.txt
# corpus.sqlite is not tracked: runs.txt is the record, and the deploy
# workflow runs corpus-tpch against the live corpus before building.
#   make sync-tpch DB=export.sqlite publish some other export as-is
TP ?= $(HOME)/projects/Thunderous-Pupil
TPCH = data/tpch
FULL_URL ?= https://cheesemonger.cs.northwestern.edu/alexb/swole/db/corpus.sqlite
CACHE = .cache
FULL ?= $(CACHE)/corpus-full.sqlite

all: build

deps:
	bun install

build: deps cv
	$(ELEVENTY)

serve: deps cv
	$(ELEVENTY) --serve

sync-tpch:
	@if [ -n "$(DB)" ]; then cp "$(DB)" $(TPCH)/corpus.sqlite; fi
	CORPUS_DB=$(CURDIR)/$(TPCH)/corpus.sqlite $(TP)/bin/build-views
	node lib/filter-views.js $(TP)/web/views.json $(TPCH)/views-exclude.txt $(TPCH)/views.json $(TPCH)/views

# The full corpus (~135 MB) is fetched once into .cache/ and refreshed only
# when the server copy is newer. FULL=path uses a local copy instead.
$(CACHE)/corpus-full.sqlite:
	mkdir -p $(CACHE)
	curl -sSf -o $@ $(FULL_URL)

fetch-tpch:
	@if [ -f $(CACHE)/corpus-full.sqlite ]; then \
	  curl -sSf -z $(CACHE)/corpus-full.sqlite -o $(CACHE)/corpus-full.sqlite $(FULL_URL); \
	else $(MAKE) $(CACHE)/corpus-full.sqlite; fi

subset-tpch: $(if $(filter $(CACHE)/corpus-full.sqlite,$(FULL)),fetch-tpch)
	sqlite3 -readonly "$(FULL)" < $(TPCH)/runs.sql > $(TPCH)/runs.txt
	@test -s $(TPCH)/runs.txt || { echo "$(TPCH)/runs.sql selected no runs"; exit 1; }
	$(MAKE) corpus-tpch FULL="$(FULL)" NOFETCH=1
	$(MAKE) sync-tpch

# Rebuild the published database from runs.txt alone; fails if the full
# corpus no longer has every listed run.
corpus-tpch: $(if $(NOFETCH),,$(if $(filter $(CACHE)/corpus-full.sqlite,$(FULL)),fetch-tpch))
	cp "$(FULL)" $(CACHE)/corpus-work.sqlite
	cd $(TPCH) && sqlite3 $(CURDIR)/$(CACHE)/corpus-work.sqlite < subset.sql > $(CURDIR)/$(CACHE)/fk.txt
	@if [ -s $(CACHE)/fk.txt ]; then echo "foreign key violations:"; cat $(CACHE)/fk.txt; exit 1; fi
	@want=$$(grep -c . $(TPCH)/runs.txt); got=$$(sqlite3 $(CACHE)/corpus-work.sqlite 'SELECT COUNT(*) FROM run'); \
	  if [ "$$want" != "$$got" ]; then echo "$(TPCH)/runs.txt lists $$want runs, the corpus has $$got of them"; exit 1; fi
	rm -f $(TPCH)/corpus.sqlite
	sqlite3 $(CACHE)/corpus-work.sqlite "VACUUM INTO '$(TPCH)/corpus.sqlite'"
	rm -f $(CACHE)/corpus-work.sqlite $(CACHE)/fk.txt
	$(MAKE) extra-tpch
	@echo "$(TPCH)/corpus.sqlite: $$(sqlite3 $(TPCH)/corpus.sqlite 'SELECT COUNT(*) FROM run') runs, $$(du -h $(TPCH)/corpus.sqlite | cut -f1)"

# Figure data from runs outside the corpus: each data/tpch/extra/<name>.csv
# becomes table <name> in the published database, so plots and the viewer
# can query it.
extra-tpch:
	@if ls $(TPCH)/extra/*.csv >/dev/null 2>&1; then node lib/import-csv.js $(TPCH)/corpus.sqlite $(TPCH)/extra/*.csv; fi

# CV PDF from the about me data (cv/cv.typ reads _data/*.json); not tracked.
cv: files/Alex_Butler_CV.pdf

files/Alex_Butler_CV.pdf: cv/cv.typ $(wildcard cv/fonts/*) $(wildcard _data/*.json)
	typst compile --root . --font-path cv/fonts cv/cv.typ $@

clean:
	rm -rf _site

.PHONY: all deps build serve cv sync-tpch fetch-tpch subset-tpch corpus-tpch extra-tpch clean
