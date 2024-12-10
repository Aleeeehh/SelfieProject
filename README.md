# SELFIE

Progetto di Tecnologie Web

### Componenti del Gruppo

-   Alessio Prato - Mat. 0001081166
-   Andrea Santilli - Mat. 0001069415
-   Leonardo Pinna - Mat. 0001078029

## Scelte implementative

### Linguaggi di programmazione

Abbiamo deciso di utilizzare **TypeScript** perchè si tratta di un linguaggio tipato che permette di
utilizzare un "compilatore" in grado di imporre regole stringenti in fase di compilazione. In questo
modo, siamo stati in grado di individuare e correggere molti errori compile-time che utilizzando
Javascript, per la sua natura non tipata, avremmo individuato solamente a runtime, o addirittura non
individuato.

### Frontend / Client

Come framework client abbiamo utilizzato React, per i seguenti motivi:

-   React permette la generazione di file statici facilmente serviti dal server
-   React sfutta la logica per componenti, che ha facilitato il riutilizzo di componenti in diverse
    parti del sito
-   Almeno un paio di componenti del gruppo avevano esperienza non nulla nell'utilizzo del framework
    React

### Backend / Server

Come backend abbiamo utilizzato NodeJS e il framework ExpressJS, per i seguenti motivi:

-   ExpressJS è un framework attorno al quale sono sviluppate numerose librerie che integrano
    funzionalità anche complesse
-   la struttura per API endpoints di ExpressJS segue un flusso logico coerente e permette di
    incapsulare le funzionalità

### Database

Come database, abbiamo utilizzato MongoDB in quanto previsto dai requisiti di progetto, e per
integrare le funzionalità del server abbiamo utilizzato la libreria Mongoose, facilitando la
connessione tra server e database.

## Lanciare il progetto in fase di sviluppo (development)

### Avviare l'istanza di mongodb (container o su host)

Prima di avviare il server, avviare MongoDB per permettere al connessione.

### Lanciare React Client

```(bash)
cd client
npm install
npm run dev
```

### Lanciare Express Server

```(bash)
cd server
npm install
npm run dev
```

## Eseguire il build del progetto (production)

### Lanciare Server e Client insieme, dentro il tuo specifico branch

```(bash)
./start.sh
```

## Altre istruzioni operative utili

### Visualizzare Eventi creati su MongoDB

```(bash)
mongosh
use selfie_db
db.events.find()
```

### Cancellare eventi all'interno di MongoDB

```(bash)
db.events.deleteOne({ owner: "Utente-Prova" })
```

### Comandi MondoDB

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-os-x/#std-label-install-mdb-community-macos

## Upload su Gocker

0. Lanciare il batch per il build del client: "build_server.sh"
1. Build del server: "cd server && npm run build && cd .."
2. copiare i file build del server sul server UNIBO: "ssh <path_to_project>/server/dist <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
3. copiare i file build del client sul server UNIBO: "ssh <path_to_project>/server/webapp/build <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
4. copiare il file package.json del server sul server UNIBO: "ssh <path_to_project>/server/package.json <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
5. entrare tramite ssh nella rete UNIBO: "ssh <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html" (password: password di ateneo)
6. entrare nella folder dei file caricati: "cd /home/web/site232402/html"
7. Se non ancora fatto, aggiungere a PATH npm e node: "export PATH=/usr/local/node/bin:$PATH"
8. eseguire "npm install"
9. entrare su gocker: "ssh <nome_utente>@gocker.cs.unibo.it" (password di ateneo)
10. Avviare il container del database: "start mongo site232402"
11. Avviare il container del server: "start node-20 site232402 dist/server.js"
12. Verificare il corretto avvio del server: "logs site232402"
13. Usare la mongosh: "mongosh site232402" (inserire la password mostrata come risultato del comando "start mongo" precedente)
