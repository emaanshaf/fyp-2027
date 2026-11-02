import { showWebAlert } from '../webAlerts';

const makeDialogs = (overrides = {}) => ({
  alert: jest.fn(),
  confirm: jest.fn(() => false),
  prompt: jest.fn(() => null),
  ...overrides,
});

describe('browser alert fallback', () => {
  it('shows a plain notice without buttons', () => {
    const dialogs = makeDialogs();

    showWebAlert('Saved', 'The Quran is available offline.', [], dialogs);

    expect(dialogs.alert).toHaveBeenCalledWith('Saved\n\nThe Quran is available offline.');
    expect(dialogs.confirm).not.toHaveBeenCalled();
  });

  it('fires a single button after acknowledging the notice', () => {
    const onPress = jest.fn();
    const dialogs = makeDialogs();

    showWebAlert('Error', 'Try again.', [{ text: 'OK', onPress }], dialogs);

    expect(dialogs.alert).toHaveBeenCalled();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('maps two buttons to confirm and runs the chosen action', () => {
    const cancel = jest.fn();
    const confirm = jest.fn();
    const buttons = [
      { text: 'Cancel', style: 'cancel', onPress: cancel },
      { text: 'Remove', style: 'destructive', onPress: confirm },
    ];

    showWebAlert('Remove', 'Remove this bookmark?', buttons, makeDialogs({ confirm: () => true }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();

    showWebAlert('Remove', 'Remove this bookmark?', buttons, makeDialogs({ confirm: () => false }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('offers a numbered menu for three or more buttons', () => {
    const deleteUser = jest.fn();
    const prompt = jest.fn(() => '3');
    const dialogs = makeDialogs({ prompt });

    showWebAlert('Manage user', 'Choose an action.', [
      { text: 'Make moderator', onPress: jest.fn() },
      { text: 'Make user', onPress: jest.fn() },
      { text: 'Delete', style: 'destructive', onPress: deleteUser },
    ], dialogs);

    expect(prompt).toHaveBeenCalledWith(
      expect.stringContaining('3. Delete'),
      ''
    );
    expect(deleteUser).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the menu is dismissed or the answer is not a choice', () => {
    const action = jest.fn();
    const buttons = [
      { text: 'One', onPress: action },
      { text: 'Two', onPress: action },
      { text: 'Three', onPress: action },
    ];

    showWebAlert('Pick', null, buttons, makeDialogs({ prompt: () => null }));
    showWebAlert('Pick', null, buttons, makeDialogs({ prompt: () => '99' }));
    showWebAlert('Pick', null, buttons, makeDialogs({ prompt: () => 'not a number' }));

    expect(action).not.toHaveBeenCalled();
  });
});
