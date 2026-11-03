# App patterns

Patterns for dense interactive apps (internal review and operations tools) built on the tokens. They describe anatomy, states and the tokens each part reads; the framework components that draw them belong to the app ([specialising](specialising.md)). Every pattern here is for the app medium only.

## App shell

One frame for every screen of the app: a left sidebar, then a main panel that stacks an optional environment banner, a navbar, a toolbar and the content. The content scrolls inside the panel; the sidebar, banner, navbar and toolbar stay in place.

**Sidebar.** On the surface (`--mq-surface`) with a `--mq-border-light` hairline on its right edge, `--mq-sidebar-width` wide.

- Brand block at the top: the wordmark, and under it the product name in muted Outfit 500 at the label size. The block keeps one height expanded or collapsed, so the toggle below it never moves.
- Navigation in groups. A group opens with an eyebrow in tertiary text; the first group may have none. Each link carries a Lucide icon in `--mq-decoration`, its label in muted Outfit 500, and an optional count at the right in Geist Mono, tertiary. Hover: ink on `--mq-surface-alt`. The current page (`aria-current="page"`): navy text and icon on `--mq-accent-pale`, its count navy.
- A count shows only when it is above zero. A count that asks for the person's action (what waits for them) is a filled badge, `--mq-on-accent` on `--mq-accent`, Geist Mono 600, with the small radius: never a pill. Every other count stays plain text.
- The signed-in person at the foot, in a block on the canvas with a `--mq-border-light` border and the medium radius: a round avatar with initials (`--mq-on-accent` on `--mq-accent`), the name, the roles as small mono chips (a role not held is struck through in tertiary), and the session line in muted text, such as "Session open · expires after 8 h of inactivity". Sign-out opens from the name.
- A toggle on the sidebar's edge collapses and expands it. It carries `aria-expanded` and an accessible name that says the action (expand the navigation, collapse the navigation).

**Rail.** The collapsed sidebar, `--mq-sidebar-rail-width` wide. The monogram replaces the wordmark; links become icons alone, centred in 40 by 36 px targets, each label moving to the link's tooltip and accessible name; groups are separated by a hairline instead of their eyebrow; the person shows as the avatar alone. The only count kept is the action badge, at the icon's top right.

**Environment banner.** Above the navbar on every environment except production, an unknown environment included, never on production. One line of ink text at the label size, Outfit 500, on `--mq-warning-tint`, with a `--mq-warning-fill` bottom border and a `--mq-warning` icon, as a `status` region. It is genuine system status, so it takes the warning colours ([colour](colour.md)).

**Navbar.** On the surface with a hairline below: a screen icon (a white Lucide icon on a 32 px navy tile with the medium radius), the page title as the page's `h1` in Outfit 500 at the h3 size, and a one-line subtitle in muted text at the label size. Global actions, such as search, sit at the right.

**Toolbar.** On the canvas with a hairline below: the screen's filters in one row that wraps, a flexible gap, then right-aligned controls. Each screen fills it; a screen without filters leaves it out.

**Spacing.** Side padding `--mq-space-6`, `--mq-space-4` on phones, plus the device's safe-area inset.

| State | What changes |
| :-- | :-- |
| Expanded | The full sidebar |
| Rail | As above; the app may start on the rail and keep the person's choice |
| Drawer, below 768 px | The sidebar leaves the layout. A menu button at the left of the navbar opens it in full over the content, with `--mq-shadow-medium`; it closes on a link, on Escape and on a tap outside. The edge toggle is hidden |
| Phone, below 480 px | The navbar's subtitle and screen icon are hidden |
| Service unavailable | The shell stays. Counts are hidden, never shown as 0, since a count that could not be measured is missing, not zero ([data patterns](data-patterns.md)); the content shows the error state |
| Not production | The environment banner shows |

The drawer slides in within 200 ms and appears at once under `prefers-reduced-motion`.

Stays in the app: the routes and their grouping, the count values and which count asks for action, the session and its timeout, the environment and where it comes from, and the search.
