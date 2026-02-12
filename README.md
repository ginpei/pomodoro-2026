# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Task State Grouping

Tasks are grouped by state: **complete**, **in progress**, **todo**, **later**. Group titles are visually distinct and non-draggable. Drag tasks between groups to change their state and reorder within a group. You cannot drag tasks above the first group title.

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --install yarn .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Deploying to GitHub Pages

This repository deploys via GitHub Actions (`.github/workflows/deploy.yml`) and publishes the `build/` output. In **Settings → Pages**, set **Source** to **GitHub Actions**. You do not need to pick a branch or directory when using the Actions-based deployment.
