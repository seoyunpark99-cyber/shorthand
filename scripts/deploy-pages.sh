#!/usr/bin/env bash
# dist/ 를 gh-pages 브랜치로 밀어 GitHub Pages 에 배포한다. 사용: npm run deploy
set -e
cd "$(dirname "$0")/.."
npm run build
rm -rf .gh-pages-tmp
git worktree add -q --detach .gh-pages-tmp
cd .gh-pages-tmp
git checkout -q --orphan gh-pages 2>/dev/null || git checkout -q gh-pages
git rm -rfq . >/dev/null 2>&1 || true
cp -r ../dist/. .
touch .nojekyll
git add -A
git commit -qm "deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" || true
git push -f origin HEAD:gh-pages
cd ..
git worktree remove --force .gh-pages-tmp
echo "deployed: https://seoyunpark99-cyber.github.io/shorthand/"
