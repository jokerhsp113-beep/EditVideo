import type { SectionTimeline } from "../types";
import { s00 } from "./s00";
import { s01 } from "./s01";
import { s02 } from "./s02";
import { s03 } from "./s03";
import { s04 } from "./s04";
import { s05 } from "./s05";
import { s06 } from "./s06";
import { s07 } from "./s07";
import { s08 } from "./s08";

export const TIMELINES: Record<string, SectionTimeline> = {
  "00": s00, "01": s01, "02": s02, "03": s03, "04": s04,
  "05": s05, "06": s06, "07": s07, "08": s08,
};

export const SECTION_IDS = Object.keys(TIMELINES);
