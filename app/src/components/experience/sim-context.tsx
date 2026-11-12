"use client";

import { createContext, useContext, type Dispatch, type RefObject } from "react";
import type { Aggregates } from "@/lib/experience/aggregates";
import type { Derived } from "@/lib/experience/derive";
import type { Action, SimState } from "@/lib/experience/state";

export interface SimValue {
  state: SimState;
  dispatch: Dispatch<Action>;
  view: Derived;
  aggregates: Aggregates;
  studioHref: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export const SimContext = createContext<SimValue | null>(null);

export function useSim(): SimValue {
  const value = useContext(SimContext);
  if (!value) throw new Error("Experience scene rendered outside the simulator");
  return value;
}
