# linshare-editor-onlyoffice

A backend application acts as a middleware between OnlyOffice document server and LinShare

## Initial setup steps

### Install dependencies
```
npm install
```

### Save public key to Linshare
```
LINSHARE_USER=root@localhost.localdomain LINSHARE_PASS=adminlinshare LINSHARE_HOST=http://localhost:30000 bash ./config/config_key.sh
```
> LINSHARE_USER and LINSHARE_PASS are Linshare administrator's username and password.

## Development

### Create a customized config file for development
```
cp ./config/default.json ./config/development.json
```

Some of notable configurations are:

- **linshare.baseUrl**: base url to LinShare api.
- **db.conectionString**: connection string to a MongoDB sever.


### Start server
```
npm start
```

### Run your unit tests
```
npm run test
```
