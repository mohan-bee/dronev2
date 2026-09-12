import { expect, test } from "bun:test";
import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks";
const check = (x: number) => checkEachPcbTraceNonOverlapping([
  {type: "pcb_hole", pcb_hole_id: "slot", hole_shape: "pill",
    hole_width: 1.8, hole_height: 3.2, x: 0, y: 0},
  {type: "pcb_trace", pcb_trace_id: "trace", route: [
    {route_type: "wire", x, y: -3, width: 0.2, layer: "top"},
    {route_type: "wire", x, y: 3, width: 0.2, layer: "top"}]},
] as any, {minClearance: 0.15});
test("pill DRC patch still rejects copper in and too close to a slot", () => {
  expect(check(0).length).toBeGreaterThan(0);
  expect(check(1.1).length).toBeGreaterThan(0);
  expect(check(1.3)).toEqual([]);
});
