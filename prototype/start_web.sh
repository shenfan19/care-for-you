#!/bin/sh
cd "$(dirname "$0")" || exit 1
echo "Care for You: http://localhost:8765/index.html"
python3 -m http.server 8765 --bind 127.0.0.1
