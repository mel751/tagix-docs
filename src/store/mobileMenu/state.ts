import { createStore, taggedEnum, createAction } from "tagix";
import { ACTION_TYPES, STORE_NAME } from "./constants";

export const MobileMenuState = taggedEnum({
  Closed: {},
  Open: {},
});

export type MobileMenuStateType = typeof MobileMenuState.State;

export const openAction = createAction<undefined, MobileMenuStateType>(ACTION_TYPES.OPEN)
  .withPayload(undefined)
  .withState(() => MobileMenuState.Open({}));

export const closeAction = createAction<undefined, MobileMenuStateType>(ACTION_TYPES.CLOSE)
  .withPayload(undefined)
  .withState(() => MobileMenuState.Closed({}));

export const toggleAction = createAction<undefined, MobileMenuStateType>(ACTION_TYPES.TOGGLE)
  .withPayload(undefined)
  .withState((s) => {
    const isOpen = MobileMenuState.$is("Open")(s);
    return isOpen ? MobileMenuState.Closed({}) : MobileMenuState.Open({});
  });

export const mobileMenuStore = createStore(MobileMenuState.Closed({}), MobileMenuState, {
  name: STORE_NAME,
});

mobileMenuStore.register(ACTION_TYPES.OPEN, openAction);
mobileMenuStore.register(ACTION_TYPES.CLOSE, closeAction);
mobileMenuStore.register(ACTION_TYPES.TOGGLE, toggleAction);

export const openMenu = () => mobileMenuStore.dispatch(openAction);
export const closeMenu = () => mobileMenuStore.dispatch(closeAction);
export const toggleMenu = () => mobileMenuStore.dispatch(toggleAction);
