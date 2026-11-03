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

## Sign-in, access refused and error pages

Three ways the app answers a person it cannot serve yet. None of them ever falls back to a framework's default page.

**Sign-in page.** The only page served without a session, so it carries no app bundle: a self-contained page built from `tokens.css` and `fonts.css` alone, on the canvas, centred both ways.

- The wordmark above one card: the surface, a `--mq-border-light` border, the medium radius, `--mq-shadow-small`, `--mq-space-6` padding, at most 420 px wide. The wordmark is not a link, since nothing behind it is reachable yet.
- In the card, in order: an eyebrow in tertiary mono ("Restricted access"), the product name as the `h1`, one muted sentence on what the tool is for, an optional notice, then the one action: a full-width primary button with a sign-in icon ("Sign in with MedQuantis"), and under it a muted hint at the label size naming the account to use and the role the app asks for.
- The legal line under the card, in tertiary Geist Mono ([brand](brand.md)).
- One action only: no second link, no password reset, no sign-up, which belong to the identity provider.

| Arrival | Notice above the button |
| :-- | :-- |
| First visit | None |
| After the session expired | An info notice as a `status` region: an `--mq-info` icon and border, the sentence in ink, such as "Your session expired. Sign in to pick up where you left off." |
| After sign-out | A success notice the same way with `--mq-success`, such as "You are signed out." |

After sign-in the person lands on the page they asked for, never on a default home.

**Access refused page.** For a signed-in person whose account lacks the role the app needs. It replaces the shell, since every page behind it would refuse again: a navbar with the monogram and the product name only (no sidebar, no link into the app), then one card at most 560 px wide.

- A navy icon pill (`--mq-accent-pale`, the medium radius) with a lock icon, the title as the `h1` ("Access refused"), a lead sentence in Outfit 500 naming the missing role in bold, and one muted sentence explaining it.
- A key-value block on the canvas with a `--mq-border-light` border and the medium radius: the signed-in account (avatar, name, address in mono), then the role asked for as a struck-through role chip, beside "Not assigned to this account" in `--mq-danger` with an icon.
- How to get the role, in muted text: who assigns it, and that the person signs in again once it is assigned.
- One primary action, "Switch account": it signs out of the app and of the identity provider, then opens the sign-in page in its signed-out state, and a note under the button says so. Never a redirect back into the app, which would loop.

**Error states inside the shell.** When a screen cannot show its content, the shell stays (sidebar, and the navbar with the screen's own title) and one card takes the content area: centred, at most 560 px wide, on the surface with `--mq-shadow-small`, its text centred. In order: a 40 px icon tile with the medium radius, a status word in Geist Mono capitals at the eyebrow size, the title as an `h2` at the h3 size, one muted sentence no wider than 50 characters, and the actions.

| State | Icon tile | Status word | Body and actions |
| :-- | :-- | :-- | :-- |
| Not found (404) | `--mq-decoration` icon on `--mq-surface-alt` | "Not found", tertiary | What was not found and why that may be, the address asked for in tertiary mono, and a primary action back to the list |
| Service unavailable (503) | `--mq-warning` icon on `--mq-warning-tint` | "Unavailable", `--mq-warning` | That the service does not answer for now, and a primary "Retry". While it retries, the button is disabled with a turning icon; if the service is still down, a muted line under it gives the time of the last attempt ("Still unavailable at the last attempt, at 14:32") in a polite live region. The sidebar's counts are hidden (app shell, above) |
| Unexpected error (500) | `--mq-danger` icon on `--mq-surface-alt` | "Error", `--mq-danger` | That the request failed and what to do if it happens again; the request ID as selectable mono text in a bordered row labelled `X-Request-Id`, with a "Copy" button that confirms once ("Copied"); a secondary action back to the list |

The status word and the icon carry each state together with its colour, never the colour alone ([accessibility](accessibility.md)). Under `prefers-reduced-motion` the icon does not turn and the button reads "Retrying".

Stays in the app: the sign-in address and its return path, the role name and who assigns it, the request ID value, and the wording of each state.
