# Vote

Voting webapp mainly used for the indie awards of the video game festival Stunfest based in Rennes, France.

## Motivations and requirements

Here's what is the need for the festival and what solutions we chose and can match yours:

- People needs to vote easily during the festival for one game they liked (through a QR code)
- We want to restrict voting on site, preventing sharing link on social networks and asking for votes.
- We aim at preventing voting multiple times

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`
