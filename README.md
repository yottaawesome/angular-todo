# Angular TODO app

## Introduction

An Angular todo app with an ASP.NET Core Minimal API backend.

## Prerequisites

- .NET 10 SDK. You can get this via Visual Studio (recommended) or [manually downloading it](https://dotnet.microsoft.com/download).
- [Node.js](https://nodejs.org/) and npm.
- Visual Studio Code for the Angular client. Visual Studio is recommended for the Server.

If this is your first time running an ASP.NET Core HTTPS app locally, trust the development certificate:

```powershell
dotnet dev-certs https --trust
```

## Run the server

Open the TodoServer.slnx solution with Visual Studio and run it. Alternatively, you can also run it via the CLI. From the repository root:

```powershell
dotnet run --project src\Server\TodoServer\TodoServer.csproj --launch-profile https
```

The HTTPS profile serves the API at `https://localhost:7058`. The client expects this URL for development builds. Make sure the port is allowed and nothing locally is blocking it.

## Run the client

In a second terminal in the `src\Client` directory, install dependencies and start Angular:

```powershell
npm install
npm start
```

You can also use `ng serve`. After this, open `http://localhost:4200/` in your browser.

## Useful commands

Run server tests:

```powershell
Set-Location src\Server
dotnet test --no-restore
```

Run client tests:

```powershell
Set-Location src\Client
npm test -- --watch=false
```

Build the client:

```powershell
Set-Location src\Client
npm run build
```

## Implementation notes

* I've used Minimal API, as this is the latest version of Web API, and Microsoft officially recommends it over classical Web API controllers.
* An in-memory data store is used to store the items. In a production app, you would use some data abstraction framework like Entity Framework, Linq2DB, etc, over a database. You would also need some way to version and maintain the schema.
* I've applied ARIA tags to where they make sense. These aren't required, just a statement that accessibility matters.
* I've structured the client and server how I would expect a production codebase should look like. That being said, the minimal version was a lot smaller given the app itself is fairly trivial.
* LLMs (specifically Copilot+GPT-5.5) were used for review, fixes, and for unit test and documentation generation. The bulk of the coding was done manually as I thought this would be a good exercise.
* The client will enter a visible error state if the server is unavailable.
