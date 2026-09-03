// The signed-in user's role, shared with any screen that needs to gate content.
//
// The role was previously only known to AppNavigator, which used it to filter
// the drawer, the tabs and the registered stack screens. Screens rendered
// *inside* the navigator had no way to read it, so HomeScreen's module grid
// advertised moderator-only modules to everyone — the tile rendered, and
// tapping it went nowhere because the route was never registered.

import React, { createContext, useContext } from 'react';

const RoleContext = createContext('user');

export function RoleProvider({ role, children }) {
  return <RoleContext.Provider value={role || 'user'}>{children}</RoleContext.Provider>;
}

/** The current user's role. Defaults to 'user' outside a provider (e.g. tests). */
export const useRole = () => useContext(RoleContext);

export default RoleContext;
