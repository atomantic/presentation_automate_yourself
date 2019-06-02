#!/usr/bin/env bash

git clone git@github.com:$1/$2.git
cd $2
if [ -f "README.md" ]; then
    echo "✅ contains README.md"
else
    echo "🚨 no README.md!"
fi
npm i >/dev/null 2>&1
npm test
