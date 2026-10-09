# Features are self-registering modules that also expose tools to the Assistant

Each feature (Map, Assistant, Guides, Flare, Weather, Group, Vision) lives in its own module. It declares its screen, its home tile, whether it applies to Solo Hikes, Group Hikes, or both, and what it needs offline. One registry wires the modules into the app. We expect to keep adding features during and after a 20-hour build, so a new feature should mean one new folder and one registry line, without editing the existing ones.

Modules can also register **tools** that the Assistant may call, for example "distance to next Waypoint" or "fire Flare". This way the Assistant's abilities grow with each feature instead of being hard-coded in one prompt.

## Consequences

- The app shell, not individual features, owns navigation and the home screen.
- A feature that needs another feature talks to it through that module's public interface, never by importing its internals.
