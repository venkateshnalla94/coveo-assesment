"use client";

import type { Subscribable } from "@coveo/headless";
import { useSyncExternalStore } from "react";

type HeadlessController<TState> = Subscribable & {
  state: TState;
};

export function useControllerState<TState>(controller: HeadlessController<TState>) {
  return useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.state,
    () => controller.state,
  );
}
