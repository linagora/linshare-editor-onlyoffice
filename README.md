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

## Configurations
### Enable authorization by JWT token for requests coming from OnlyOffice document server.

From Document server side, change the server configuration of `services.CoAuthoring.token.enable.request.outbox` to `true` and define the JWT secret key in `services.CoAuthoring.secret.outbox.string`.

From `linshare-editor-onlyoffice-backend` side, use the following configuration, note that both services must share a same `secret`
```
{
  "documentServer": {
      "signature": {
        "request": {
          "incoming": {
            "enable": "true",
            "algorithm": "HS256",
            "secret": "secret",
            "authorizationHeader": "authorization",
            "authorizationHeaderPrefix": "Bearer "
          }
        }
      }
    }
  }
}
```
