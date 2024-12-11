# SELFIE

Progetto di Tecnologie Web

### REQUISITI MINIMI DA AGGIUNGERE/MODIFICARE
-   Mantenere la time machine attiva su tutta l'interfaccia, se cambio pagina non si deve resettare. Se la time machine cambia orario, deve cambiare anche il pomodoro.
-   Editare un evento già impostato
-   Aumentare il contrasto nei colori, in particolare il colore degli eventi del calendario (colore nome evento su sfondo del medesimo colore)
-   Disallineamento nelle colonne del calendario (per tutti i possibili browser, e testa anche con mouse con rotella)
-   Tutte le cose che vengono aggiunte/cambiano, devono venire aggiunte/essere cambiate senza refreshare la pagina (in particolare calendario, per view day, week, month, ma anche progetti, attività, ecc.)
-   Uniformare formato date ed ore (TUTTE NEL FORMATO ITALIANO)
-   Time machine deve influenzare OGNI SINGOLO COMPONENTE DEL PROGETTO, quindi sia calendario, che pomodoro, che attività, che progetti, che note!
-   Notifiche decisamente più evidenti, magari utilizzando il sistema di notifica del sistema operativo (con Notification API). Mettere un filtro "mostra X notifiche" come nella home, e magari appena ne arriva una, mostrarla a schermo e fai sentire un suono. Magari implementa una libreria che permetta la notifica del sistema operativo, ma magari anche via email e/o whatsapp.
- Campo "indirizzo" nel register: email o di casa?
- Correggi tutti gli input time per il pomodoro (in alcuni casi non posso mettere un numero con più di una cifra)
- gestione partecipanti dei progetti distinti, non ci può essere un medesimo utente più volte nello stesso progetto (in particolare l'owner)
- Scroll calendario attività progetto da migliorare (immagino intenda, da migliorare la view gantt dei progetti)
- tutti i bottoni accessibili (se c'è una checkbox, deve potersi spuntare anche se clicco il testo affianco), CONCENTRIAMOCI SULL'USABILITA' DI QUALSIASI COSA, CI SI SOFFERMA MOLTO!
- "Invia evento ad utente" o lo tolgo oppure lo miglioro che mandi il form con "Crea" e non con "Invia ad utente"
- Da fixare visuale gantt dei progetti.
- Correggi in modo definitivo i bug di visualizzazione eventi/pomodoro event su cui hai messo una toppa (pomodoro session con allDay, pomodorSession ripetuto, allDay ripetuto.. deve funzionare anche sul server remoto in cui fai il deploy)
- fixa todoList, c'è un caso in cui si bugga
- Controlla che quando si modifica un oggetto(evento,attività, progetto), tale modifica sia reale, funzioni, e influenzi anche quello degli altri utenti se sono coinvolti in quell'oggetto (nel caso in cui sia condiviso)
- La creazione attività nel pannello attività, deve avere gli stessi campi della creazione attività nel pannello calendario.
- La creazione di evento pomodoro nel pannello pomodoro, deve avere gli stessi campi della creazione evento pomodoro nel pannello calendario.
- metti il "-" per andare indietro di un anno a sinistra della data, nel pannello calendario
- MIGLIORA/FIXA IN GENERALE QUALSIASI COSA SU CUI POTREBBE FARE STORIE, IN PARTICOLARE UI E USABILITA' SONO FONDAMENTALI! CERCHIAMO DI IMMAGINARCI/PREVEDERE SU COSA POTREBBE FARE STORIE (ANCHE COSE MOLTO PICCOLE)


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
2. copiare i file build del server sul server UNIBO: "scp <path_to_project>/server/dist <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
3. copiare i file build del client sul server UNIBO: "scp <path_to_project>/server/webapp/build <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
4. copiare il file package.json del server sul server UNIBO: "scp <path_to_project>/server/package.json <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html"
5. entrare tramite ssh nella rete UNIBO: "ssh <nome_utente>@eva.cs.unibo.it:/home/web/site232402/html" (password: password di ateneo)
6. entrare nella folder dei file caricati: "cd /home/web/site232402/html"
7. Se non ancora fatto, aggiungere a PATH npm e node: "export PATH=/usr/local/node/bin:$PATH"
8. eseguire "npm install"
9. entrare su gocker: "ssh <nome_utente>@gocker.cs.unibo.it" (password di ateneo)
10. Avviare il container del database: "start mongo site232402"
11. Avviare il container del server: "start node-20 site232402 dist/server.js"
12. Verificare il corretto avvio del server: "logs site232402"
13. Usare la mongosh: "mongosh site232402" (inserire la password mostrata come risultato del comando "start mongo" precedente)
