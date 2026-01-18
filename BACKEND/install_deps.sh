#!/usr/bin/env bash
# Small helper to create a virtualenv and install requirements.
# Usage: ./install_deps.sh [venv_name]
set -euo pipefail
VENV_NAME=${1:-venv}
python3 -m venv "$VENV_NAME"
# shellcheck disable=SC1091
source "$VENV_NAME/bin/activate"
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "Dependencies installed into ./$VENV_NAME (activate with: source $VENV_NAME/bin/activate)"
