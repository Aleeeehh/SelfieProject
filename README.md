# SELFIE

Progetto di Tecnologie Web

### REQUISITI MINIMI COMPLETATI

-   Uniformare formato date ed ore (TUTTE NEL FORMATO ITALIANO) 
-   tutti i bottoni accessibili (se c'è una checkbox, deve potersi spuntare anche se clicco il testo
    affianco), CONCENTRIAMOCI SULL'USABILITA' DI QUALSIASI COSA, CI SI SOFFERMA MOLTO! 
-   Dimensione bottoni fase/ciclo view pomodoro 
-   metti il "-" per andare indietro di un anno a sinistra della data, nel pannello calendario 
-   Controllo e validazione input register, gestione errori da mostrare all'utente 
-   Controllo, validazione input e gestione errori nella pagina di modifica campi utente 
-   Le checkbox accessibili non devono evidenziarsi se li clicco, e devono avere click pointer 
-   Migliorata, fixata chat e sua relazione con searchform 
-   Migliorato contrasto, e fixata coerenza grafica view day/week/month 
-   Fixato bug ripetizione evento 
-   migliorata animazione topbar 
-   Quando siamo in visuale week/month, ed inseriamo un evento, questo viene visualizzato
    immediatamente 
-   Mantenere la time machine attiva su tutta l'interfaccia, se cambio pagina non si deve resettare.
    (Leo - 20250321)
-   gestione partecipanti dei progetti distinti, non ci può essere un medesimo utente più volte
    nello stesso progetto, in particolare l'owner (Leo - 20250321)
-   fix cambio dell'input ai progetti (ora cambiano solo quando il pulsante aggiorna è premuto)
    (Leo - 20250321)
-   Editare un evento base già esistente (ancora da gestire casi complessi) (Ale - 20250321
- editare un evento complesso (ripetuto, notifiche, risorse..)(per quanto possibile per non fare disastri di dipendenze) (Ale -240325) 

### TASK DI ALE
-   Editare un'attività esistente dalla view calendario (collegandolo alla view activities)
-   Disallineamento nelle colonne del calendario (per tutti i possibili browser, e testa anche con
    mouse con rotella)
-   Notifiche decisamente più evidenti, magari utilizzando il sistema di notifica del sistema
    operativo (con Notification API). Mettere un filtro "mostra X notifiche" come nella home, e
    magari appena ne arriva una, mostrarla a schermo e fai sentire un suono. Magari implementa una
    libreria che permetta la notifica del sistema operativo, ma magari anche via email e/o whatsapp.
-   Uniforma note/progetti/attività: se clicco su uno devo visualizzarlo, e al posto di visualizza
    metti modifica.
-   La creazione attività nel pannello attività, deve avere gli stessi campi della creazione
    attività nel pannello calendario.
- Se voglio editare un'attività corrente, nella View calendario se clicco su di essa, con Cursor pointer, deve portarmi alla visuale modifica attività

### REQUISITI MINIMI DA AGGIUNGERE/MODIFICARE
-   Tutte le cose che vengono aggiunte/cambiano, devono venire aggiunte/essere cambiate senza
    refreshare la pagina (in particolare calendario, per view day, week, month, ma anche progetti,
    attività, ecc.)
-   Se la time machine cambia orario, deve cambiare anche il pomodoro.
-   Time machine deve influenzare OGNI SINGOLO COMPONENTE DEL PROGETTO, quindi sia calendario, che
    pomodoro, che attività, che progetti, che note! (Conviene lavorare lato server per questo)
-   FIXARE VIEW GANTT PROGETTI E TUTTI I BUG AFFINI AI PROGETTI!
-   rendi piu efficiente il caricamento della view mese del calendario
-   "Invia evento ad utente" o lo tolgo oppure lo miglioro che mandi il form con "Crea" e non con
    "Invia ad utente"
-   fixa todoList, c'è un caso in cui si bugga
-   Controlla che quando si modifica un oggetto(evento,attività, progetto), tale modifica sia reale,
    funzioni, e influenzi anche quello degli altri utenti se sono coinvolti in quell'oggetto (anche nel
    caso in cui sia condiviso, che la modifica sia visibile anche agli altri utenti)
-   MIGLIORA/FIXA IN GENERALE QUALSIASI COSA SU CUI POTREBBE FARE STORIE, IN PARTICOLARE UI E
    USABILITA' SONO FONDAMENTALI! CERCHIAMO DI IMMAGINARCI/PREVEDERE SU COSA POTREBBE FARE STORIE
    (ANCHE COSE MOLTO PICCOLE)

### ALTRI REQUISITI (FORSE RIDONDANTI DA NOTE ANDRE)

-   Mantenere la time machine attiva su tutta l'interfaccia
-   Editare un evento già impostato
-   Disallineamento nelle colonne del calendario
-   Refresh informazioni (calendario mensile)
-   Time machine influenza anche pomodoro (e se serve., non ho controllato) progetti ed attività)
-   Notifiche decisamente più evidenti, magari utilizzando il sistema di notifica del sistema
    operativo (con Notification API)
-   gestione partecipanti dei progetti distinti
-   Scroll calendario attività progetto da migliorare
-   Ordine dei "Prossimi eventi" nella home non sempre corretto
-   Orologio alla lunga è sbagliato
-   Pomodoro NON rimane attivo anche se cambio pagina (musica compresa)
-   Se mi trovo all'interno del giorno della scadenza di un'attività me la segna "in ritardo" =>
    togliere l'orario (ora è 01:00) oppure impostare l'orario a 23:59
-   Mettere il radio button per scegliere tra "evento pomodoro", "tutto il giorno" e "ripetuto" nel
    form di creazione dell'evento
-   Non posso togliere il “completata” ad una attività, una volta che l’ho completata
-   Su telefono (Safari?): due eventi che coincidono con l’orario non stanno entrambi nella view
-   Su telefono (Safari?): Note page ha la “X” non allineata al centro, anche la pagina di creazione
    della nota
-   Avviando un link YouTube dal pomodoro, se la view è stretta, escono gli elementi dal loro
    container
-   Quando spunto un'attività relativa ad un progetto come completata, viene traslata verso il basso
    nel gantt e non capisco perchè
-   Un evento “tutto il giorno” nella visualizzazione “month” e “week” viene mostrato su 2 giorni
-   Da IPad, probabilmente anche da altri dispositivi/browser, le colonne della week si muovono
    singolarmente
-   FORSE, non funziona bene il sorting delle note: quando entro nella pagina delle note, queste
    sono ordinate senza un criterio
-   Nel calendario, sulla view giornaliera, in base al giorno che seleziono per vedere gli eventi,
    il calendario non mi permette di creare una attività precedente a quella data. Esempio:
    seleziono il 20 gennaio --> non posso creare attività che scadono il 18 perchè mi da la data
    come non valida

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

(Per accedere al client via browser in modalità sviluppo, accedere a http://localhost:8000)

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

- commenta codice development in server.js, e decommenta codice production
- commenta in params.ts l'url localhost e metti quella del sito
- se da errori, prima di caricare backend e frontend, elimina tutto con "rm -rf *" nella
Cartella html..
- dentro la cartella del progetto, vai su cartella client
- npm install
- npm run build
- cancella cartella node_modules
- scp -r ./build alessio.prato2@eva.cs.unibo.it:/home/web/site232402/html/
- vai in cartella server
- npm install
- npm run build
- cancella cartella node_modules
- scp -r ./* alessio.prato2@eva.cs.unibo.it:/home/web/site232402/html/
- ssh alessio.prato2@eva.cs.unibo.it (entro nel pc remoto del dipartimento)
- cd /home, cd web, cd site232402, cd html
- /usr/local/node/bin/npm install
- ssh alessio.prato2@gocker.cs.unibo.it (entro in gocker)
- start node-17 site232402 dist/server.js

