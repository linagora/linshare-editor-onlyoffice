# linshare-editor-onlyoffice

## Project setup
```
npm install
```

### Start server for development
```
npm start
```

### Run your unit tests
```
npm run test
```

### Generate key pair and save public key to Linshare
```
LINSHARE_USER=root@localhost.localdomain LINSHARE_PASS=adminlinshare LINSHARE_HOST=http://localhost:30000 ISSUER=unique-issuer bash ./config/config_key.sh
```

> LINSHARE_USER and LINSHARE_PASS are Linshare admin username and password, this is needed in order to save public key to Linshare by sending a request to LINSHARE_HOST.

> ISSUER is an arbitrary string and MUST be unique from existing issuers.