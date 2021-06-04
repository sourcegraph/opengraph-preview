# Sourcegraph preview project

Lifecycle:

- Bot visits `http://localhost:3000/github.com/sourcegraph/go-diff/-/blob/diff/parse.go?hash=L29-35`
- Extract the repository name, revision, and file path
- Extract line range from the hash parameter
- Fetch the highlighted range from the Sourcegraph API
- Render the code snippet template, screenshot it with Puppeteer, and retrieve the image buffer
- Return the image

## Developing

- Copy `.env.sample` and name it `.env`
  - Generate a Sourcegraph access token (from your local instance) and copy it into `SOURCEGRAPH_TOKEN=`
- `npm install` to install packages
- `npm run dev` runs the development server
- The server should be running at `http://localhost:3000`

## Development routes

- Generates HTML (to screenshot): `http://localhost:3000/debug/html/github.com/sourcegraph/go-diff/-/blob/diff/parse.go?hash=L29-35`
