/**
 * sorting.spec.ts — generated from specs/sorting.md. Covers the "Sort products" dropdown
 * on the inventory page and the product order each option produces.
 */
import { test, expect, STANDARD_USER_STATE } from './fixtures';

// Every test starts signed in as standard_user from the state saved by auth.setup.ts.
test.use({ storageState: STANDARD_USER_STATE });

const NAMES_A_TO_Z = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
];
const PRICES_LOW_TO_HIGH = ['$7.99', '$9.99', '$15.99', '$15.99', '$29.99', '$49.99'];

// Price sorts check prices, not names: two products cost $15.99 and their relative order
// is not specified (see specs/sorting.md).
const SORT_CASES = [
  {
    title: 'sorts by name, Z to A',
    choices: ['Name (Z to A)'],
    by: 'name',
    expected: [...NAMES_A_TO_Z].reverse(),
  },
  {
    title: 'sorts by price, low to high',
    choices: ['Price (low to high)'],
    by: 'price',
    expected: PRICES_LOW_TO_HIGH,
  },
  {
    title: 'sorts by price, high to low',
    choices: ['Price (high to low)'],
    by: 'price',
    expected: [...PRICES_LOW_TO_HIGH].reverse(),
  },
  {
    title: 'returns to name A to Z after another sort',
    choices: ['Price (high to low)', 'Name (A to Z)'],
    by: 'name',
    expected: NAMES_A_TO_Z,
  },
] as const;

// .open() lives in the spec, not the fixture, so navigation stays visible here.
test.beforeEach(async ({ inventoryPage }) => {
  await inventoryPage.open();
});

test.describe('Sorting', () => {
  test('lists products by name, A to Z, by default @smoke', async ({ inventoryPage }) => {
    await expect(inventoryPage.activeSort).toHaveText('Name (A to Z)');
    await expect(inventoryPage.itemNames).toHaveText(NAMES_A_TO_Z);
  });

  for (const { title, choices, by, expected } of SORT_CASES) {
    test(`${title} @regression`, async ({ inventoryPage }) => {
      // Checking the label after each choice proves every step took effect, so the
      // "back to A to Z" case can't pass by never leaving the default.
      for (const choice of choices) {
        await inventoryPage.sortBy(choice);
        await expect(inventoryPage.activeSort).toHaveText(choice);
      }

      const list = by === 'name' ? inventoryPage.itemNames : inventoryPage.itemPrices;
      await expect(list).toHaveText([...expected]);
    });
  }
});
