# use-local-storage

A type-safe React hook for syncing state with `localStorage` that automatically keeps your data in sync across browser tabs and handles SSR gracefully. Built with [Jotai](https://jotai.org/) for efficient state management.

### Why use this instead of react-use's useLocalStorage?

Unlike `react-use`, this library provides:

- **True cross-tab synchronization** - When you update localStorage in one component/tab, all other instances automatically re-render with the new value, even within the same tab
- **Consistent loading states** - The `isLoading` flag helps you handle hydration correctly in SSR scenarios
- **Shared state management** - Multiple components using the same key share a single atom, preventing unnecessary re-renders
- **Simpler API** - Returns a single object with `value`, `setValue`, and `isLoading` instead of a tuple

## Quick Start

```bash
npm install @rm-hull/use-local-storage
# or
yarn add @rm-hull/use-local-storage
```

## Usage Examples

### Basic Counter

```tsx
import { useLocalStorage } from "@rm-hull/use-local-storage";

function Counter() {
  const { value = 0, setValue, isLoading } = useLocalStorage<number>("counter");

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => setValue(value + 1)}>Increment</button>
      <button onClick={() => setValue(undefined)}>Clear</button>
    </div>
  );
}
```

### User Preferences

```tsx
interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
}

function Settings() {
  const { value: prefs, setValue } =
    useLocalStorage<UserPreferences>("user-prefs");

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={prefs?.theme === "dark"}
          onChange={(e) =>
            setValue({
              ...prefs,
              theme: e.target.checked ? "dark" : "light",
            })
          }
        />
        Dark Mode
      </label>
    </div>
  );
}
```

### Shopping Cart

```tsx
interface CartItem {
  id: string;
  name: string;
  quantity: number;
}

function ShoppingCart() {
  const { value: cart = [], setValue } = useLocalStorage<CartItem[]>("cart");

  const addItem = (item: CartItem) => {
    setValue([...cart, item]);
  };

  const removeItem = (id: string) => {
    setValue(cart.filter((item) => item.id !== id));
  };

  return (
    <div>
      <h2>Cart ({cart.length} items)</h2>
      {cart.map((item) => (
        <div key={item.id}>
          {item.name} x {item.quantity}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## Features

- **Auto-sync across tabs** - Changes in one tab are instantly reflected in others
- **Type-safe** - Full TypeScript support with generics
- **SSR-compatible** - Handles server-side rendering gracefully
- **Efficient** - Uses Jotai for optimized re-renders
- **Easy cleanup** - Pass `undefined` to remove items
- **Lightweight** - Minimal bundle size

## Contributer Guidelines

### Releasing a New Version

This project uses [**Changesets**](https://github.com/changesets/changesets) to manage versioning and automated npm publishing.

#### How the release process works

1. **Create a changeset on your feature branch**

   When you’ve made changes you want to release, first create a new branch (not on `main`):

   ```bash
   git checkout -b feature/my-change
   ```

   Make your changes, then run:

   ```bash
   yarn changeset
   ```

   You’ll be prompted to:

   - Choose the type of version bump (patch, minor, or major)
   - Write a short summary of the change

   This command creates a markdown file in the `.changeset/` directory describing your upcoming release.

2. **Commit and push your feature branch**

   ```bash
   git add .changeset
   git commit -m "Add changeset for upcoming release"
   git push -u origin feature/my-change
   ```

3. **Merge the feature branch into `main`**

   - Once your PR is reviewed, merge it into `main`. The `.changeset` file must be present in `main` for the next step.

4. **Automatic version bump and publish**

   - When changes are pushed to `main`, GitHub Actions will automatically:

     - Build the package
     - Apply version bumps based on the `.changeset` file
     - Update the changelog
     - Publish the new version to npm as [`@rm-hull/use-local-storage`](https://www.npmjs.com/package/@rm-hull/use-local-storage)

5. **That's it!**
   Your package is now live on npm with an updated version and changelog.

---

#### Notes

- The npm publish step is automated via GitHub Actions (`.github/workflows/release.yml`).
- Ensure your `NPM_TOKEN` secret is configured in the repository settings under **Settings → Secrets → Actions**.
- Changesets should always be created on feature branches, not directly on `main`.
- No pull requests are created for version bumps; merging your feature branch into `main` triggers the release automatically.
