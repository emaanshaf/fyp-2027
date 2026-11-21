import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme';
import PinModal from '../PinModal';

const mount = (props = {}) => render(
  <ThemeProvider>
    <PinModal
      visible
      mode="setup"
      onSubmit={jest.fn(() => Promise.resolve({ ok: true }))}
      onClose={jest.fn()}
      {...props}
    />
  </ThemeProvider>
);

describe('PinModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks for the PIN twice and saves it when both match', async () => {
    const onSubmit = jest.fn(() => Promise.resolve({ ok: true }));
    const onClose = jest.fn();
    const screen = mount({ onSubmit, onClose });

    fireEvent.changeText(await screen.findByLabelText('PIN'), '1234');
    fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Re-enter your PIN')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Confirm PIN'), '1234');
    await act(async () => {
      fireEvent.press(screen.getByText('Save PIN'));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('1234'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('rejects mismatched PINs without calling the parent', async () => {
    const onSubmit = jest.fn(() => Promise.resolve({ ok: true }));
    const screen = mount({ onSubmit });

    fireEvent.changeText(await screen.findByLabelText('PIN'), '1234');
    fireEvent.press(screen.getByText('Continue'));
    await screen.findByText('Re-enter your PIN');

    fireEvent.changeText(screen.getByLabelText('Confirm PIN'), '4321');
    fireEvent.press(screen.getByText('Save PIN'));

    expect(await screen.findByText('The PINs do not match. Try again.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps a failed verification on screen with the server message', async () => {
    const onSubmit = jest.fn(() => Promise.resolve({
      ok: false,
      message: 'Incorrect PIN. 3 attempts remaining.',
    }));
    const onClose = jest.fn();
    const screen = mount({ mode: 'verify', onSubmit, onClose });

    fireEvent.changeText(await screen.findByLabelText('PIN'), '0000');
    await act(async () => {
      fireEvent.press(screen.getByText('Unlock'));
    });

    expect(await screen.findByText('Incorrect PIN. 3 attempts remaining.')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('will not submit a PIN shorter than the minimum', async () => {
    const onSubmit = jest.fn();
    const screen = mount({ onSubmit });

    fireEvent.changeText(await screen.findByLabelText('PIN'), '12');
    fireEvent.press(screen.getByText('Continue'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText('Re-enter your PIN')).toBeNull();
  });
});
