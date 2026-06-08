#!/bin/sh
# Maven Wrapper Script
# This script is a simplified version. In a real project, use:
# mvn wrapper:wrapper to generate the full wrapper.

# Check if Maven is installed
if command -v mvn &> /dev/null; then
    mvn "$@"
else
    echo "Maven not found. Please install Maven 3.9+ or use the full Maven wrapper."
    echo "To install Maven wrapper properly, run: mvn wrapper:wrapper"
    exit 1
fi
