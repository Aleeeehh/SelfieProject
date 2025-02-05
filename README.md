# SELFIE

Personal productivity web application.
It allows the management of events, tasks, and projects in a calendar.
Additionally, you can create and manage Pomodoro timers and notes with to-do lists.

### Team members 

-   Alessio Prato
-   Andrea Santilli
-   Leonardo Pinna

## Launch the application locally

Start the MongoDB instance (container or on the host):
Before starting the server, make sure MongoDB is running to allow the connection.

If you have MongoDB installed locally, you can start it with
```(bash)
mongod
```

Run Server and Client together within the project folder
```(bash)
./start.sh
```

To access the application via a local browser in development mode, go to http://localhost:8000.


If dependencies are required for the client and/or server, install them before running the application.
```(bash)
cd server
npm install
```
```(bash)
cd client
npm install
```

