# SELFIE

Applicazione web di produttività personale.
Permette la gestione di eventi,attività e progetti in un calendario.
Inoltre, si possono creare e gestire pomodoro timer e note con todo-list.

### Componenti del team di lavoro

-   Alessio Prato
-   Andrea Santilli
-   Leonardo Pinna

## Lanciare in locale l'applicazione

### Avviare l'istanza di mongodb (container o su host)

Prima di avviare il server, avviare MongoDB per permettere al connessione.

Lanciare Server e Client insieme
```(bash)
./start.sh
```

Per accedere all'applicazione via browser locale in modalità sviluppo, accedere a http://localhost:8000

Se necessarie dipendenze per client e/o server
```(bash)
cd server
npm install
```
```(bash)
cd client
npm install
```



## Scelte implementative

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

