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
