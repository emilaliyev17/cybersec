#!/bin/bash
set -e

cd "$(dirname "$0")"

SLIDES_DIR="frontend/public/slides"

echo "=== PPTX to PNG Slide Converter (macOS Keynote) ==="
echo ""

# Check Keynote
if [ ! -d "/Applications/Keynote.app" ]; then
  echo "ERROR: Keynote is not installed."
  exit 1
fi

# Presentation definitions: id|filename
PRESENTATIONS=(
  "ai-best-practices|StrategyBRIX - AI Best Practices & Responsible Usage Training.pptx"
  "phishing-awareness|StrategyBRIX - Phishing Awareness Training.pptx"
)

for entry in "${PRESENTATIONS[@]}"; do
  IFS='|' read -r id pptx <<< "$entry"

  echo "Processing: $pptx"

  if [ ! -f "$pptx" ]; then
    echo "  ERROR: File not found: $pptx"
    continue
  fi

  out_dir="$SLIDES_DIR/$id"
  tmp_dir=$(mktemp -d)
  abs_pptx="$(pwd)/$pptx"

  # Clean output directory
  rm -rf "$out_dir"
  mkdir -p "$out_dir"

  echo "  Exporting slides via Keynote..."

  osascript <<EOF
tell application "Keynote"
  activate
  open POSIX file "$abs_pptx"
  delay 4
  set theDoc to front document
  export theDoc as slide images to POSIX file "$tmp_dir" with properties {image format:PNG, skipped slides:false}
  close theDoc without saving
end tell
EOF

  # Rename exported files (Keynote exports as slide.001.png, slide.002.png, etc.)
  i=1
  for f in $(ls "$tmp_dir/"*.png 2>/dev/null | sort); do
    num=$(printf "%02d" $i)
    cp "$f" "$out_dir/slide-${num}.png"
    ((i++))
  done

  count=$((i - 1))
  echo "  Exported $count slides to $out_dir/"

  # Optimize images to max 1920px width
  echo "  Optimizing images..."
  for f in "$out_dir/"*.png; do
    sips --resampleWidth 1920 "$f" > /dev/null 2>&1 || true
  done

  rm -rf "$tmp_dir"
  echo "  Done."
  echo ""
done

echo "=== Conversion complete ==="
echo ""
# Print summary
for entry in "${PRESENTATIONS[@]}"; do
  IFS='|' read -r id pptx <<< "$entry"
  count=$(ls "$SLIDES_DIR/$id/"*.png 2>/dev/null | wc -l | tr -d ' ')
  echo "  $id: $count slides"
done
