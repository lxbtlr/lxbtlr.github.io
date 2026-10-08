NODE=bun run
ELEVENTY=$(NODE) eleventy

all: build

deps:
	bun install

build: deps
	$(ELEVENTY)

serve: deps
	$(ELEVENTY) --serve

clean:
	rm -rf _site

.PHONY: all deps build serve clean
