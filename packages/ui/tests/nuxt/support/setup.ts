import { afterEach } from 'vitest';
import { enableAutoUnmount } from '@vue/test-utils';

// Overlays teleport into <body>: unmounting each test's tree removes them, so a test never reads
// the overlay of the one before.
enableAutoUnmount(afterEach);
