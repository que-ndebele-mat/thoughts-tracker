OWNER := que-ndebele-mat
REPO := thoughts-tracker
BRANCH := main
PORT := 8000

.DEFAULT_GOAL := help

.PHONY: help serve open init repo pages deploy url clean

help:
	@echo "Thoughts Tracker"
	@echo ""
	@echo "  make serve   - run the app locally at http://localhost:$(PORT)"
	@echo "  make open    - open the local server in your browser"
	@echo "  make init    - git init + first commit, if not already a repo"
	@echo "  make repo    - create the GitHub repo (if missing) and push"
	@echo "  make pages   - enable GitHub Pages on the repo (if not already)"
	@echo "  make deploy  - init + repo + pages end to end, prints the live URL"
	@echo "  make url     - print the GitHub Pages URL"
	@echo "  make clean   - no-op (static site, nothing to build)"

serve:
	python3 -m http.server $(PORT)

open:
	open http://localhost:$(PORT)

init:
	@if [ ! -d .git ]; then \
		git init -b $(BRANCH); \
		git add .; \
		git commit -m "Initial commit: Thoughts Tracker"; \
	else \
		echo "git repo already initialized"; \
	fi

repo: init
	@if gh repo view $(OWNER)/$(REPO) >/dev/null 2>&1; then \
		echo "Repo $(OWNER)/$(REPO) already exists on GitHub"; \
		git remote get-url origin >/dev/null 2>&1 || git remote add origin git@github.com:$(OWNER)/$(REPO).git; \
	else \
		gh repo create $(OWNER)/$(REPO) --public --source=. --remote=origin; \
	fi
	git add -A
	git diff --cached --quiet || git commit -m "Update Thoughts Tracker"
	git push -u origin $(BRANCH)

pages: repo
	@if gh api repos/$(OWNER)/$(REPO)/pages >/dev/null 2>&1; then \
		echo "GitHub Pages already enabled"; \
	else \
		gh api -X POST repos/$(OWNER)/$(REPO)/pages -f "source[branch]=$(BRANCH)" -f "source[path]=/"; \
	fi

deploy: pages
	@echo ""
	@echo "Live at: https://$(OWNER).github.io/$(REPO)/"
	@echo "(GitHub Pages can take ~30-60s to finish building on first deploy)"

url:
	@echo "https://$(OWNER).github.io/$(REPO)/"

clean:
	@echo "Nothing to clean - static site, no build artifacts."
