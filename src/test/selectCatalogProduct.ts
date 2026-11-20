import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/** Select through the same searchable control used by keyboard and pointer users. */
export async function selectCatalogProduct(user: ReturnType<typeof userEvent.setup>, label: string, optionName: string, index = 0) {
  await user.click((await screen.findAllByRole('combobox', { name: label }))[index]);
  await user.click(await screen.findByRole('option', { name: optionName }));
}
