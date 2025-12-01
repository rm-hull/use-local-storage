# Project: use-local-storage

## Project Overview

This project is a TypeScript-based React hook, `@rm-hull/use-local-storage`, designed for synchronizing React component state with the browser's `localStorage`. It leverages the Jotai library for efficient, atom-based state management, ensuring seamless data synchronization across multiple browser tabs and graceful handling of Server-Side Rendering (SSR).

The core functionality is exposed through the `useLocalStorage` hook, which returns an object containing the `value` from localStorage, a `setValue` function to update it, and an `isLoading` flag to manage hydration state in SSR environments.

## Building and Running

The project uses Yarn for package management.

-   **Install Dependencies:**
    ```bash
    yarn install --immutable-cache
    ```

-   **Run Development Server:**
    ```bash
    yarn dev
    ```

-   **Build for Production:**
    ```bash
    yarn build
    ```
    This command uses `tsup` to compile the TypeScript source into CommonJS and ESM formats, including type definitions.

-   **Run Tests:**
    ```bash
    yarn test
    ```
    To run tests with coverage reports:
    ```bash
    yarn test:coverage
    ```

-   **Linting:**
    ```bash
    yarn lint
    ```

## Development Conventions

-   **State Management:** State is managed using Jotai atoms. A central `localStorageAtom` holds the state of all keys managed by the hook.
-   **Cross-tab Sync:** The hook listens for `storage` and `local-storage` events to synchronize state across tabs. A custom `local-storage` event is dispatched after a value is set to ensure components within the same tab also re-render.
-   **SSR Safety:** The code includes checks for `typeof window === 'undefined'` to prevent errors during server-side rendering. The `isLoading` state helps manage the initial client-side hydration.
-   **Versioning and Releasing:** The project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing to npm. The release process is automated via GitHub Actions, as defined in `.github/workflows/ci.yml`. To release a new version, a developer should run `yarn changeset` on a feature branch, commit the resulting markdown file, and merge the branch into `main`.

## Advanced Features

### Custom Serializer

You can provide a custom serializer to transform the data before it's stored and after it's retrieved. This is useful for encrypting data or transforming it in other ways.

A silly example that reverses the string before writing it to localStorage:
```ts
const reverseSerializer = {
  serialize: (value: string) => value.split('').reverse().join(''),
  deserialize: (value: string) => value.split('').reverse().join(''),
};

const { value } = useLocalStorage('my-key', { serializer: reverseSerializer });
```

A more practical use case would be to use a library like `crypto-js` to encrypt the data before storing it.
