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

## Overview: queue boxes and coverage cards

The overview lands a person on what waits for them, then shows how much of each area is covered, in one grammar for every area.

**Queue boxes.** A row of boxes, one per queue, three across and one column on phones. Each box is a link to its list: the surface, a `--mq-border-light` border, the medium radius and `--mq-shadow-small`, `--mq-space-4` padding; on hover the border turns `--mq-border-strong`. In order:

- the queue's name in Outfit 600, with its total at the right in navy Outfit 500 at the figure size, in tabular figures;
- optionally one line per area, its name in ink and its count in navy at the right;
- the age line in tertiary text at the note size: "Oldest waiting for 3 days", the duration in ink.

| State | Shows |
| :-- | :-- |
| Zero | The box stays in place, quiet: the total in tertiary, no area lines, and the age line reads "Nothing waits" |
| The person's own queue, above zero | A navy border and the pale navy fill (`--mq-accent-pale`); the same box at zero is quiet like the others |
| Overdue | The age turns `--mq-warning` and takes a warning icon, so the state never rests on colour alone. The threshold belongs to the app |
| Loading | The box keeps its size with skeleton bars on `--mq-surface-alt`; their shimmer stops under `prefers-reduced-motion` |

**Coverage cards.** One card per area, three across, one column below 1100 px; the same card as a queue box but not a link itself. In order:

- the area's title in Outfit 600, with an "Open →" link at the right in navy;
- the scope in Geist Mono capitals at the eyebrow size, tertiary: what is counted and over which editions ("Coverage of 1'248 texts · every edition served");
- a segmented bar, 12 px high, its ends rounded with the small radius, never a pill, with 2 px gaps between segments ([charts](charts.md), distribution bar);
- the legend under it: per segment a 10 px swatch with the small radius, the label (a link when the segment opens a list), the count in Geist Mono, muted, and the percentage in Geist Mono, tertiary, both right-aligned;
- optionally one take-away line in muted text at the note size.

Rules for the bar:

- The segments take the ordered palette in order, `--mq-chart-series-1` to `--mq-chart-series-4`, and what is left (not yet detected, not yet extracted) takes the remainder fill `--mq-chart-rest`, with a series 4 outline in the bar and the swatch. Five segments therefore need no new hue. A status colour never colours a segment: a segment that needs attention says so in its label.
- A segment below 1 % keeps a 2 px minimum width in the bar, and its legend line reads "< 1 %"; every other percentage is rounded with the largest-remainder method ([data patterns](data-patterns.md)).
- A segment that opens a list is a link in both the bar and the legend, with the same accessible name; one that opens nothing is plain text, never a dead link.
- The bar has an accessible name that states the scope; the legend carries every value in text.
- One edition or every edition served: the scope line says which; the card does not change shape.

Stays in the app: the segment keys, their counts and labels, which segments link where, the overdue threshold, and the queues themselves.

## Review table: filters, condition tile, status pill, code chips

The list behind every review screen: a filter toolbar, then a table whose rows carry a condition tile, a status pill and code chips. It extends the app table of [layout](layout.md), Tables.

**Filters**, in the shell's toolbar (app shell, above):

- **Select with its label inside**: 32 px high, the surface, a `--mq-border` border, the small radius; the label in muted text, the value in ink Outfit 500. Each option ends with its count, and an option whose count is zero is muted but still listed.
- **Segmented control** for a filter in two steps: a track on `--mq-surface-alt` with a `--mq-border` border and the medium radius, its segments with the small radius, each with its count in Geist Mono, tertiary. The selected segment is navy Outfit 500 on the surface with `--mq-shadow-small`; an empty segment is tertiary. A 1 px `--mq-border-strong` rule, 16 px high, separates the two steps. It is a radio group: arrow keys move, and the selection is announced.
- **Clear filters**: a ghost text button that appears once any filter differs from its default, and puts every filter back.

**Table.** The app table wrapper: the surface, a `--mq-border-light` border, the medium radius, `--mq-shadow-small`, scrolling sideways inside itself below its minimum width. Header row on `--mq-surface-alt`, never a navy band; cells with `--mq-space-3` padding and a `--mq-border-light` hairline between rows; text at the table text size.

| State | Shows |
| :-- | :-- |
| Loading | Skeleton rows of the same height, bars on `--mq-surface-alt`; the shimmer stops under `prefers-reduced-motion` |
| Sorted | The sorted header is underlined and carries `aria-sort`; the sort reads in the header's accessible name |
| Hover | The row on `--mq-surface-alt` |
| Keyboard | Rows are reachable with the keyboard (Arrow or J and K keys move, Enter opens); the focused row shows the focus ring, and moving never opens |
| Selected (the open item) | `--mq-accent-pale`, with a 3 px navy edge (`--mq-stroke-tab`) on its first cell |
| Waiting for you | The quiet pale fill `--mq-accent-pale-2`, on that row only, so the others stay quiet |
| Empty | The app empty state ([layout](layout.md), App patterns) in the table's place: "No open item", or, under filters, "No item matches these filters" with a clear-filters action |

**Condition tile.** A short code that identifies a review condition (R1, R2): a navy square (`--mq-on-accent` on `--mq-accent`), the medium radius, the code in Geist Mono 600, 30 px in the list and 32 px in a dialog header, followed by the condition's name in Outfit 600. A tooltip on the tile gives what raised it. It is an identifier, not a state, so every tile is the same navy.

**Status pill.** The item's step, a word in Outfit 500 at the label size with the small radius (never a pill shape despite its name), and under it a detail line in tertiary text at the note size (who, since when). The four states differ by mark style, and each carries its word:

| State | Mark |
| :-- | :-- |
| To decide | Outline: `--mq-border-strong` border, muted text on the surface |
| Confirmation required | The warning mark: `--mq-warning` text and a `--mq-warning-fill` border on `--mq-warning-tint`, since it asks the person to act |
| Under review by a colleague | Pale: navy text and border on `--mq-accent-pale`; the detail line names the colleague |
| Under review by you | Pale, plus a 2 px `--mq-accent-pale` ring around it, and its row takes the waiting-for-you fill |

**Code chip.** A mono code with its name: the code in Geist Mono at the note size on `--mq-surface-alt` with the small radius, then the name in ink. A name too long for its cell is cut with an ellipsis and given in full in a tooltip and the accessible name; a code without a name shows the code alone, never an empty name.

| Variant | Mark |
| :-- | :-- |
| Plain | As above |
| Key code (the one the row is about) | `--mq-accent-pale` with navy text |
| Added | A leading "+" and the code in `--mq-change-added`, with a 1 px ring of the same colour |
| Removed | Struck through, the code in `--mq-change-removed` |

The change colours are apps only and never carry the change alone: the "+" and the strike say it in every theme and in greyscale ([charts](charts.md), App categorical palette).

Stays in the app: the conditions and their codes, the wording of each state, the sort keys, the keyboard shortcuts beyond Arrow and Enter, and which code is the key code.

## Decision modal

A large dialog where one decision is taken: context on the left, process on the right, actions at the foot. Its proportions and pane heights stay fixed from item to item, so nothing jumps while a person works through a list.

**Frame.** On the surface with the overlay radius (`--mq-radius-overlay`) and `--mq-shadow-medium`, inset `--mq-space-5` from the viewport plus the safe-area insets, at most 1320 px wide. Escape closes it, focus stays inside while it is open and returns to the row it came from. Below 768 px it fills the screen with no radius, and its panes stack and scroll as one.

**Header**, with a hairline below:

- at the left, the condition tile (32 px) and the condition's name as the dialog title in Outfit 500 at the h3 size; under it the subject (the product) and an edition badge in the outline mark ("Edition 01.10.2026");
- in the centre, the progress line at a fixed width;
- at the right, the position in mono ("3 / 12"), previous and next buttons, and close.

**Progress line.** Three steps (detected, review, decided): a 22 px circle and a label each, joined by 1.5 px lines.

| Step | Mark |
| :-- | :-- |
| Done | `--mq-accent-pale` circle with a navy ring and a tick; the line after it navy |
| Current | A navy circle with its number in `--mq-on-accent` and a 3 px `--mq-accent-pale` ring; the label in navy Outfit 600 |
| To come | A `--mq-border-strong` ring on the surface, the label tertiary; the line after it `--mq-border` |
| Optional review | The circle dashed, with "optional" in its detail line |
| Required review | The detail line in `--mq-warning` with a warning icon: "required: your confirmation" |

Labels keep one line, cut with an ellipsis and given in full in a tooltip. Where the header is too narrow for title, line and navigation side by side, the line takes its own row under the title.

**Left pane: context**, on the canvas, a hairline on its right edge:

- "The problem": a card with a fixed height of four lines, what the condition means for this item;
- underline tabs ([layout](layout.md), App patterns): the source text ([limitation-text marks](#limitation-text-marks)) and the decision history with its count ([history timeline](#history-timeline)). The chosen tab stays chosen from item to item.

**Right pane: process**, on the surface, in numbered steps (a 22 px navy circle with the number in `--mq-on-accent`, then the step's name in Outfit 500):

1. **Evidence**: one row per code in play, the code chip (review table, above), its name, and its source tag; a reason or quote an agent gave sits under its row in Newsreader italic, muted. The list has a fixed height and scrolls inside.
2. **Decision**: the choice cards, then the form fields.
3. **Result**: what is served today and what will be served after.

**Source tags**, one mark style per source ([colour](colour.md), States by mark style), each with its word:

| Source | Mark |
| :-- | :-- |
| Attached by the regulator | Solid |
| Printed in the text | Pale, like the printed-code mark in the text |
| Proposed by the agent | Dashed: not yet confirmed |
| Candidate from the title | Outline |
| Close code | Quiet |
| Removed by the regulator | Struck through |

**Choice cards.** A radio group of cards, one per answer: a `--mq-border-light` border and the small radius; the title in Outfit 500, one muted line of explanation, and at the right the codes the answer would serve, or "no code" in tertiary italic. Hover on `--mq-surface-alt`; selected: a navy border on `--mq-accent-pale-2`; invalid: a `--mq-danger` border with the error in words under the group. A card that restates what is served today says so in its explanation.

**Result card.** A dashed `--mq-border-strong` border with the medium radius, two rows labelled in Geist Mono capitals, "Today" and "After": the code chips of each, an added code with its "+", a removed one struck through, both in the change-type colours, and "unchanged" in tertiary when nothing moves. Its height is fixed; long names are cut with a tooltip.

**Held decision card.** While a colleague's review is pending it replaces the decision form: `--mq-warning-tint` with a `--mq-warning-fill` border and the medium radius, its title ("Decision to review") in `--mq-warning`, then rows of label and value: the held answer, its reason, the comment, who asked and when. The reviewer sees approve and send back, where send back asks for a comment; the person who asked sees withdraw. Everyone else sees it read-only.

**Alerts**, above the form, each with an icon and a sentence:

- a refused write: a `--mq-danger` border, what was refused and why; the form keeps what the person entered;
- a stale write: an `--mq-info` border, "Decided meanwhile by a colleague, at 14:20"; the item reloads with that decision at the top of its history;
- after a decision: a notice that the change reaches the public site after the next refresh.

**Footer** on the canvas with a hairline above: facts at the left (muted label, ink value), actions at the right, secondary first and the primary last, such as "Confirm and go to next". An action the person cannot take is disabled with its reason shown in words beside it ("Role required: Maintainer"), never refused after a click on an enabled button.

**Closed item.** It opens in its last state, read-only: no form, the result card showing what is served, and only navigation and close in the footer.

Stays in the app: the choices and what each serves, which actions are allowed and why not, the wording of refusals and alerts, the sources and the data.

## Limitation-text marks

How a verbatim source text shows the passages a decision rests on. The text stays the official text: a mark adds a background or an underline, and never changes a word, its case or its order.

**Text box.** Newsreader at a reading size (about 16.5 px) with a loose line height (about 2.2), so a mark never touches the line above it; on the canvas with a `--mq-border-light` border, the medium radius, and `--mq-space-3` by `--mq-space-4` padding. A long text scrolls inside its box (in the decision modal, inside its tab), never the page.

| Mark | Look | Means |
| :-- | :-- | :-- |
| Printed code | Geist Mono, navy text on `--mq-accent-pale`, the small radius | A code the text itself prints |
| Accepted quote | `--mq-accent-pale-2` with a 2 px navy underline | A passage accepted as evidence for a decision |
| Contested printed code | The printed mark with a 2 px `--mq-warning` underline | The printed code this item calls into question |
| Quote pointed at | The accepted quote on `--mq-accent-pale` | While the person points at that quote elsewhere, such as its evidence row |

The contested mark differs from the printed one by its underline, not by colour alone, and the legend names it.

**Legend.** Under the box at the note size in muted text: a swatch for each mark this item uses (the contested mark only where the item has one), then, in tertiary, the editions the text belongs to in mono ("Binding in editions 01.03.2024 to 01.10.2026").

**Quoting a passage.** The text is plain text, so it can be selected with a pointer or the keyboard; the selection shows on `--mq-accent-pale`. When the selection could prove a decision, a popover opens beside it (the surface, a `--mq-border` border, the medium radius, `--mq-shadow-medium`): an eyebrow, "Quote as evidence for", then one small button per code that still needs a quote, its code in mono and its name. When nothing needs a quote, no popover opens. Once quoted, the passage takes the accepted-quote mark, and the decision form lists it as a quote row: a 3 px navy left edge (`--mq-stroke-tab`) on `--mq-accent-pale-2`, the passage in Newsreader italic, and a remove action.

| State | Shows |
| :-- | :-- |
| Printed, quoted, contested | The marks above, each in the legend |
| Selection in progress | The selection on `--mq-accent-pale`; the popover only when a code needs a quote |
| Long text | It scrolls inside its box; the legend stays under it |

Stays in the app: the passages and where they fall in the text, which codes need a quote, matching a quote to the text, and the popover's actions.

## History timeline

The decisions on one item, newest first: who did what, with which values, and which row is in force now. It is read on every item and later as an audit view.

**Filters** above it: a row of toggle buttons, "All" then one per source, each with its count in Geist Mono, tertiary; a `--mq-border` border with the small radius, never a pill. A filter that is on is navy (`--mq-on-accent` on `--mq-accent`), its count in `--mq-accent-pale`, and carries `aria-pressed`.

**Rows.** A vertical list joined by a 1 px `--mq-border` line through the dots. Each row is one line that opens to its details:

- the dot, by origin: a person's decision a filled navy dot, an agent's a dashed `--mq-border-strong` ring, the system's a plain ring, a publication a small square in `--mq-decoration`;
- the date in Geist Mono, muted;
- the source as an icon with its name (in a narrow pane the icon alone, its name in the tooltip and the accessible name);
- the event as a chip with the small radius, one mark style per outcome: accepted or applied in the ring mark (navy border and text), rejected dashed, a person's decision pale (`--mq-accent-pale`), a publication quiet (`--mq-surface-alt`);
- the person, muted; a person the app cannot name reads "Unknown identity" in tertiary italic, never an empty cell or an internal identifier;
- the values in Geist Mono at the right, or "none" in tertiary italic;
- the in-force column, then a chevron that turns when the row opens.

Hover on `--mq-surface-alt`. A row opens with a click or Enter: its details sit under it, aligned with the event, in tertiary text at the note size: the reason code in mono, the note, and the run that produced it as a mono link.

**The row in force.** Exactly one row is live: its in-force column shows a 10 px `--mq-success` dot with the live halo (`--mq-shadow-live`), its name ("in force") in the tooltip and the accessible name. Superseded rows leave the column empty.

**Key.** Under the list, after a hairline: each event mark and each dot with its meaning, in tertiary text at the note size, so no mark is read by colour alone.

| State | Shows |
| :-- | :-- |
| Collapsed, expanded | One line; the line with its details under it |
| Live, superseded | The live dot with its halo; an empty column |
| Filter on, off | The navy toggle; the outlined toggle. "All" turns the others off |
| Loading | Skeleton rows of the same height; the shimmer stops under `prefers-reduced-motion` |
| Empty | "No decision yet" in muted text, in the list's place |
| Unknown person | "Unknown identity", tertiary italic |

Stays in the app: the event types and their wording, the sources, the data, and which row is in force.
