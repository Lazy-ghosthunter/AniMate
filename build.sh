#!/bin/sh
# Generates scripts/config.js from Vercel environment variables.
# Uses a heredoc to avoid shell quoting issues with echo.

# Fail fast if any required variable is missing.
if [ -z "$ANIMATE_API_URL" ]; then
  echo "Error: ANIMATE_API_URL environment variable is not set." >&2
  exit 1
fi
if [ -z "$ANIMATE_CHIBISAFE_URL" ]; then
  echo "Error: ANIMATE_CHIBISAFE_URL environment variable is not set." >&2
  exit 1
fi
if [ -z "$ANIMATE_CHIBISAFE_API_KEY" ]; then
  echo "Error: ANIMATE_CHIBISAFE_API_KEY environment variable is not set." >&2
  exit 1
fi

cat > scripts/config.js << EOF
const base_url = "${ANIMATE_API_URL}";
const chibisafeUrl = "${ANIMATE_CHIBISAFE_URL}";
const chibisafeApiKey = "${ANIMATE_CHIBISAFE_API_KEY}";
EOF
