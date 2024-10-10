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


## Lanciare Server e Client insieme, dentro il tuo specifico branch

```(bash)
./start.sh (anche per aggiornare la pagina sul browser)
```

## Lanciare MongoDB

```(bash)
brew services start mongodb-community@7.0
mongod (lancia il databese)
mongosh (shell mongo)
```

## Visualizzare Eventi creati su MongoDB
```(bash)
mongosh
use selfie_db
db.events.find()
```

## Cancellare eventi all'interno di MongoDB
```(bash)
db.events.deleteOne({ owner: "Utente-Prova" })
```


Comandi MondoDB: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#std-label-install-mdb-community-macos

