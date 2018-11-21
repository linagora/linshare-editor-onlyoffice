#!/bin/bash
if [ "${DEBUG:-0}" -eq 1 ]; then
    set -x
fi
SHELL_DIR="$( cd "$( dirname "$0" )" && pwd )"
LINSHARE_USER=${LINSHARE_USER:-""}
LINSHARE_PASS=${LINSHARE_PASS:-""}
LINSHARE_HOST=${LINSHARE_HOST:-""}
ISSUER=${ISSUER:-""}
KEY_NAME=${KEY_NAME:-"jwtRS256.key"}

cd "$SHELL_DIR" || exit 1

if [ ! "$LINSHARE_USER" ] || [ ! "$LINSHARE_PASS" ] || [ ! "$LINSHARE_HOST" ]; then
    echo "E: Require ENV"
    exit 1
fi

if ! type ssh-keygen >/dev/null 2>&1; then
    echo "E: Require ssh-keygen command!"
    exit 1
fi
if ! type openssl >/dev/null 2>&1; then
    echo "E: Require openssl command!"
    exit 1
fi

if ! type curl >/dev/null 2>&1; then
    echo "E: Require curl command!"
    exit 1
fi

if [ -e "${KEY_NAME}" ]; then
    rm -f "${KEY_NAME}" "${KEY_NAME}.pub"
fi

ssh-keygen -t rsa -b 4096 -f "${SHELL_DIR}/${KEY_NAME}" -N ""
openssl rsa -in "${SHELL_DIR}/${KEY_NAME}" -pubout -outform PEM -out "${SHELL_DIR}/${KEY_NAME}.pub"

PUBLIC_KEY_ONELINE=$(sed ':a;N;$!ba;s/\n/\\n/g' "${KEY_NAME}.pub")
if ! curl -H 'Accept: application/json' -H 'Content-Type: application/json' "${LINSHARE_HOST}/linshare/webservice/rest/admin/public_keys" -u "${LINSHARE_USER}:${LINSHARE_PASS}" \
-d '{
  "domainUuid" : "LinShareRootDomain",
  "issuer" : "'"$ISSUER"'",
  "publicKey" : "'"$PUBLIC_KEY_ONELINE"'",
  "format" : "PEM"
}' -i 2>/dev/null| head -n1 | grep 200 >/dev/null 2>&1; then
    echo "Error, make sure your ENV variables are correct and issuer is not duplicated"
    rm -f "${KEY_NAME}" "${KEY_NAME}.pub"
    exit 1
fi
echo "Success"