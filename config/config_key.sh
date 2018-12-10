#!/bin/bash
if [ "${DEBUG:-0}" -eq 1 ]; then
    set -x
fi
SHELL_DIR="$( cd "$( dirname "$0" )" && pwd )"
LINSHARE_USER=${LINSHARE_USER:-""}
LINSHARE_PASS=${LINSHARE_PASS:-""}
LINSHARE_HOST=${LINSHARE_HOST:-""}
ISSUER=${ISSUER:-"linshare-editor"}
PUBLIC_KEY_FILE=${PUBLIC_KEY_FILE:-"jwt.key.pub"}

cd "$SHELL_DIR" || exit 1

if [ ! "$LINSHARE_USER" ] || [ ! "$LINSHARE_PASS" ] || [ ! "$LINSHARE_HOST" ]; then
    echo "E: Require ENV"
    exit 1
fi

if ! type curl >/dev/null 2>&1; then
    echo "E: Require curl command!"
    exit 1
fi

if [ ! -e "${PUBLIC_KEY_FILE}" ]; then
    echo "E: Missing public key file ${PUBLIC_KEY_FILE}"
    exit 1
fi

PUBLIC_KEY_ONELINE=$(sed ':a;N;$!ba;s/\n/\\n/g' "${PUBLIC_KEY_FILE}")
if ! curl -H 'Accept: application/json' -H 'Content-Type: application/json' "${LINSHARE_HOST}/linshare/webservice/rest/admin/public_keys" -u "${LINSHARE_USER}:${LINSHARE_PASS}" \
-d '{
  "domainUuid" : "LinShareRootDomain",
  "issuer" : "'"$ISSUER"'",
  "publicKey" : "'"$PUBLIC_KEY_ONELINE"'",
  "format" : "PEM"
}' -i 2>/dev/null| head -n1 | grep 200 >/dev/null 2>&1; then
    echo "Error, make sure your ENV variables are correct and issuer is not duplicated"
    exit 1
fi
echo "Success"
