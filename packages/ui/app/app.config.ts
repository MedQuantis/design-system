// The design system's radii (guidelines/layout.md §Radius): 3 px for controls, 6 px for cards and
// popovers, 12 px for overlays. tailwind.css resolves rounded-sm to 3 px and rounded-md to
// rounded-4xl to 6 px; Nuxt UI draws controls with rounded-md, so their slots take rounded-sm here.
const SMALL = 'rounded-sm';
const OVERLAY = 'rounded-overlay';

// The warning split (guidelines/colour.md §Status colours): the orange is a fill with ink on it,
// never white; on the warning tint the text stays ink and --mq-warning marks only the icon and the
// border; outline text takes --mq-warning, the warning shade readable as text. Nuxt UI draws every
// warning variant from one --ui-warning, so each is set here.
const WARNING_SOLID = 'bg-(--mq-warning-fill) text-(--mq-on-warning-fill)';
const WARNING_TINT = 'bg-(--mq-warning-tint) text-(--mq-ink) ring-(--mq-warning)';
const WARNING_ICON = 'text-(--mq-warning)';
const WARNING_OUTLINE = 'text-(--mq-warning) ring-(--mq-warning)';
const warning = { color: 'warning' } as const;

export default defineAppConfig({
  ui: {
    // Nuxt UI colours onto the scales of the pinned design system's tailwind.css; the library's
    // `error` is the design system's `danger`.
    colors: {
      primary: 'navy',
      error: 'danger',
      success: 'success',
      warning: 'warning',
      info: 'info',
      neutral: 'stone',
    },
    // tailwind-merge must know rounded-overlay is a radius, or it keeps both it and the library's
    // rounded-lg and the stylesheet order decides.
    tv: {
      twMergeConfig: { extend: { theme: { radius: ['overlay'] } } },
    },
    button: {
      slots: { base: SMALL },
      compoundVariants: [
        {
          ...warning,
          variant: 'solid',
          class: `${WARNING_SOLID} hover:bg-(--mq-warning-fill)/75 active:bg-(--mq-warning-fill)/75 disabled:bg-(--mq-warning-fill) aria-disabled:bg-(--mq-warning-fill)`,
        },
        {
          ...warning,
          variant: ['soft', 'subtle'],
          class: {
            base: `${WARNING_TINT} hover:bg-warning-100 active:bg-warning-100 disabled:bg-(--mq-warning-tint) aria-disabled:bg-(--mq-warning-tint)`,
            leadingIcon: WARNING_ICON,
            trailingIcon: WARNING_ICON,
          },
        },
        { ...warning, variant: 'outline', class: WARNING_OUTLINE },
      ],
    },
    alert: {
      compoundVariants: [
        { ...warning, variant: 'solid', class: { root: WARNING_SOLID } },
        {
          ...warning,
          variant: ['soft', 'subtle'],
          class: { root: WARNING_TINT, icon: WARNING_ICON },
        },
        { ...warning, variant: 'outline', class: { root: WARNING_OUTLINE } },
      ],
    },
    input: { slots: { base: SMALL } },
    selectMenu: { slots: { base: SMALL } },
    textarea: { slots: { base: SMALL } },
    // The badge sets its radius per size, after the base slot.
    badge: {
      compoundVariants: [
        { ...warning, variant: 'solid', class: WARNING_SOLID },
        {
          ...warning,
          variant: ['soft', 'subtle'],
          class: { base: WARNING_TINT, leadingIcon: WARNING_ICON, trailingIcon: WARNING_ICON },
        },
        { ...warning, variant: 'outline', class: WARNING_OUTLINE },
      ],
      variants: {
        size: {
          xs: { base: SMALL },
          sm: { base: SMALL },
          md: { base: SMALL },
          lg: { base: SMALL },
          xl: { base: SMALL },
        },
      },
    },
    modal: { variants: { fullscreen: { false: { content: OVERLAY } } } },
    // A drawer rounds the corners that face the page, not the viewport edge.
    slideover: {
      variants: {
        side: {
          top: { content: 'rounded-b-overlay' },
          right: { content: 'rounded-l-overlay' },
          bottom: { content: 'rounded-t-overlay' },
          left: { content: 'rounded-r-overlay' },
        },
        inset: { true: { content: OVERLAY } },
      },
    },
    commandPalette: { slots: { root: OVERLAY } },
  },
});
