# Papercups Chat

This repo contains the code for the chat window that is rendered in an iframe in the [Papercups chat widget](https://github.com/papercups-io/chat-widget). (See https://github.com/papercups-io/chat-widget for more details.)

For a demo of all of this in action, visit https://app.papercups.io/demo

## Getting Started

Run the development server with:

```bash
npm run dev
```

This will start the app at [http://localhost:8080](http://localhost:8080).

You can start editing the page by modifying the components in the `/components` directory. The page auto-updates as you edit the file.

## Development

You'll notice when you start up the code from scratch that nothing gets rendered initially. This is because this component requires certain query params to be set in order to render.

The easiest way to develop within this repo is by running it alongside the [@papercups-io/chat-widget](https://github.com/papercups-io/chat-widget) repo. See the instructions there for more information: https://github.com/papercups-io/chat-widget
