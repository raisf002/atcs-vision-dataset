#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Jalankan sebagai root melalui sudo." >&2
  exit 1
fi

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="/opt/atcs-vision-dataset/worker"
STATE_DIR="/var/lib/atcs-capture"
ENV_FILE="/etc/atcs-capture.env"

apt-get update
apt-get install -y --no-install-recommends ffmpeg ca-certificates curl

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ belum tersedia. Pasang Node.js terlebih dahulu, lalu jalankan installer ini kembali." >&2
  exit 1
fi

NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "${NODE_MAJOR}" -lt 20 ]]; then
  echo "Node.js 20+ diperlukan; terdeteksi $(node --version)." >&2
  exit 1
fi

id -u atcs-capture >/dev/null 2>&1 || useradd --system --home-dir "${STATE_DIR}" --create-home --shell /usr/sbin/nologin atcs-capture
install -d -o atcs-capture -g atcs-capture -m 0750 "${TARGET_DIR}" "${STATE_DIR}"
install -m 0750 "${SOURCE_DIR}/capture.mjs" "${TARGET_DIR}/capture.mjs"
install -m 0644 "${SOURCE_DIR}/systemd/atcs-capture.service" /etc/systemd/system/atcs-capture.service
install -m 0644 "${SOURCE_DIR}/systemd/atcs-capture.timer" /etc/systemd/system/atcs-capture.timer

if [[ ! -f "${ENV_FILE}" ]]; then
  install -m 0600 -o root -g root "${SOURCE_DIR}/capture.env.template" "${ENV_FILE}"
  echo "Buat ${ENV_FILE} dari template, isi URL aplikasi dan token ingest, lalu aktifkan timer." >&2
else
  echo "Konfigurasi ${ENV_FILE} sudah ada dan tidak ditimpa." >&2
fi

systemctl daemon-reload
echo "Worker terpasang. Setelah konfigurasi env diisi, jalankan: sudo systemctl enable --now atcs-capture.timer" >&2
