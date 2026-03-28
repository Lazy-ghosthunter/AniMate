#!/bin/sh
# Generates scripts/config.js from Vercel environment variables.
# Uses a heredoc to avoid shell quoting issues with echo.
cat > scripts/config.js << EOF
const base_url = "${ANIMATE_API_URL}";
const chibisafeUrl = "${ANIMATE_CHIBISAFE_URL}";
const chibisafeApiKey = "${ANIMATE_CHIBISAFE_API_KEY}";
EOF
