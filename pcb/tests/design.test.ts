import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import geometry from "../geometry.json";
const data = JSON.parse(
  readFileSync(new URL("../dist/index/circuit.json", import.meta.url), "utf8"),
);
const components = data.filter((x: any) => x.type === "source_component");
test("DNP headers retain all connection holes and pin assignments", () => {
  for (const name of ["JPROG", "JBAT", "JM1", "JM2", "JM3", "JM4"]) {
    const source = components.find((x: any) => x.name === name);
    expect(source).toBeDefined();
    const pcb = data.find((x: any) => x.type === "pcb_component" && x.source_component_id === source.source_component_id);
    expect(pcb.do_not_place).toBe(true);
    expect(data.filter((x: any) => x.type === "pcb_plated_hole" && x.pcb_component_id === pcb.pcb_component_id)).toHaveLength(name === "JPROG" ? 6 : 2);
  }
  expect(components.some((x: any) => x.ftype === "simple_test_point")).toBe(false);
  ["GND", "V3V3", "UART_TX", "UART_RX", "EN", "BOOT"].forEach((n, i) => expect(net("JPROG", i + 1)).toBe(n));
  expect(net("JBAT", 1)).toBe("VBAT");
  expect(net("JBAT", 2)).toBe("GND");
  for (let i = 1; i <= 4; i++) {
    expect(net(`JM${i}`, 1)).toBe("VBAT");
    expect(net(`JM${i}`, 2)).toBe(`M${i}_SWITCHED`);
  }
});
const net = (ref: string, pin: number) => {
  const c = components.find((x: any) => x.name === ref);
  const p = data.find(
    (x: any) =>
      x.type === "source_port" &&
      x.source_component_id === c.source_component_id &&
      x.pin_number === pin,
  );
  return data.find(
    (x: any) =>
      x.type === "source_net" &&
      x.subcircuit_connectivity_map_key === p?.subcircuit_connectivity_map_key,
  )?.name;
};
test("power domains and fixed regulator connections follow datasheets", () => {
  expect(net("U1", 3)).toBe("V3V3");
  for (const p of [1, 10]) expect(net("U3", p)).toBe("V3V3");
  for (const p of [5, 6, 7, 8]) expect(net("U3", p)).toBe("VBAT");
  for (const p of [3, 9, 11]) expect(net("U3", p)).toBe("GND");
  expect(net("U3", 4)).toBe(net("L1", 1));
  expect(net("U3", 2)).toBe(net("L1", 2));
});
test("sensor reserved pins and reference capacitor have distinct handling", () => {
  expect(net("U2", 7)).toBeUndefined();
  for (const pin of [8, 9, 10, 11, 12, 13, 15])
    expect(net("U2", pin)).toBe("GND");
  for (const pin of [1, 16]) expect(net("U2", pin)).toBe("V3V3");
  expect(net("U2", 14)).toBe("REGOUT");
  expect(net("CREG", 1)).toBe("REGOUT");
  for (const [imu, mcu] of [
    [2, 16],
    [3, 15],
    [4, 17],
    [5, 12],
  ])
    expect(net("U2", imu)).toBe(net("U1", mcu));
});
test("all four motor stages use VBAT, flyback diodes, gate pulls and terminal capacitors", () => {
  for (let n = 1; n <= 4; n++) {
    expect(net(`D${n}`, 1)).toBe("VBAT");
    expect(net(`D${n}`, 2)).toBe(`M${n}_SWITCHED`);
    expect(net(`Q${n}`, 1)).toBe(`M${n}_GATE`);
    expect(net(`Q${n}`, 2)).toBe("GND");
    expect(net(`Q${n}`, 3)).toBe(`M${n}_SWITCHED`);
    expect(net(`RG${n}`, 1)).toBe(net("U1", 34 + n));
    expect(net(`RG${n}`, 2)).toBe(`M${n}_GATE`);
    expect(net(`RPD${n}`, 1)).toBe(`M${n}_GATE`);
    expect(net(`RPD${n}`, 2)).toBe("GND");
    expect(net(`CM${n}`, 1)).toBe("VBAT");
    expect(net(`CM${n}`, 2)).toBe(`M${n}_SWITCHED`);
  }
});
test("placement output has no error records, routing and correct mechanics", () => {
  expect(data.filter((x: any) => x.type.endsWith("_error"))).toEqual([]);
  expect(data.filter((x: any) => x.type === "pcb_trace").length).toBeGreaterThan(0);
  expect(
    data
      .filter((x: any) => x.type === "pcb_component")
      .every((x: any) => x.layer === "top"),
  ).toBe(true);
  expect(data.filter((x: any) => x.type === "pcb_component")).toHaveLength(48);
  expect(
    Math.hypot(
      geometry.motors[0].x - geometry.motors[2].x,
      geometry.motors[0].y - geometry.motors[2].y,
    ),
  ).toBeCloseTo(80, 4);
  expect(80 / Math.sqrt(2) - geometry.propDiameter).toBeGreaterThan(10);
});
test("zip-tie slots and top strap lane stay clear of electronics", () => {
  const r = geometry.batteryRetention;
  const slots = data.filter((x: any) => x.type === "pcb_hole" && x.hole_shape === "pill");
  expect(slots).toHaveLength(2);
  expect(slots.map((x: any) => x.x)).toEqual(r.slotX);
  for (const slot of slots) {
    expect(slot.y).toBe(r.y);
    expect(slot.hole_width).toBe(r.slotWidth);
    expect(slot.hole_height).toBe(r.slotHeight);
    expect(slot.hole_height).toBeGreaterThan(r.tieWidth);
  }
  for (const c of data.filter((x: any) => x.type === "pcb_component")) {
    const overlaps = c.center.x + c.width / 2 > -14.4 &&
      c.center.x - c.width / 2 < 14.4 &&
      c.center.y + c.height / 2 > r.y - r.tieWidth / 2 - 0.1 &&
      c.center.y - c.height / 2 < r.y + r.tieWidth / 2 + 0.1;
    expect(overlaps).toBe(false);
  }
});
