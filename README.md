# SELFIE

Progetto di Tecnologie Web

## Lanciare React Client

```(bash)
cd client
npm install
npm run dev
```

## Lanciare Express Server

```(bash)
cd server
npm install
npm run dev
```


## Lanciare Server e Client insieme

```(bash)
./start.sh (dentro selfie)
```

## Lanciare MongoDB

```(bash)
brew services start mongodb-community@7.0
mongod (lancia il databese)
mongosh (shell mongo)
```

# Visualizzare Eventi creati su MongoDB
```(bash)
mongosh
use selfie_db
db.events.find()
```


Comandi MondoDB: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#std-label-install-mdb-community-macos

