# Compact PCB placement

A 68 × 68 mm X-shaped PCB frame with 58 top-side placed components/pads, 80 mm opposite-motor spacing, four 7.6 mm collar openings, and an ESP32-S3 antenna overhanging the nose. The central body is 36 mm wide; nominal neighboring 46 mm prop discs have 10.57 mm clearance. PCB thickness is 1.0 mm, two layers, FR-4. The fabrication target is 1 oz copper and ENIG, to be specified at order time.

## Run

Requires Bun. Dependencies are locked.

```sh
cd pcb
bun install --frozen-lockfile
bun run check
bun run build -- --routing-disabled --pcb-png --svgs
bun test
bun run typecheck
bun run dev
```

`index.circuit.tsx` is the source. `geometry.json` owns the outline and motor locations; `keepouts.json` records unenforced copper and mechanical requirements. The CAD viewer consumes the compiled output, not a second hand-placed board.

## Placement decisions

- U1 at (0, 10.5): every solder pad stays over the PCB; only the antenna body overhangs. Keep antenna space clear in the final assembled product.
- U2 at (0, -1.5), rotated 180°: near the center with local VDD/VDDIO/REGOUT capacitors. Configure firmware sensor axes from the actual package orientation.
- U3 and L1 form a compact cluster at the rear-left battery input. Input/output bypassing stays local; route these switching loops manually first. PS/SYNC is tied to VBAT for forced PWM; FB returns to V3V3.
- One Q/D/RG/RPD/CM group on each arm. Motor solder pads and flyback diodes stay close to the drain; GPIO gate traces travel inward. CM footprints are across motor terminals, not VBAT–GND. Also fit suppression at actual motor terminals if noise tests require it.
- Programming pads along the right edge. TP1 GND, TP2 **3V3_TEST**, TP3 controller TX, TP4 controller RX, TP5 EN, TP6 BOOT. TP2 is a measurement point, not an invitation to parallel an external supply with the regulator. Use a 3.3 V logic programmer.
- BAT1 is positive, BAT2 negative. Use a polarity-verified battery pigtail; no unverified connector footprint is assumed.
- Holes H5/H6 reserve potential printed-part attachment locations; no hardware should press beneath the IMU.

## Pin assignment

| Function | GPIO | Module pad |
|---|---:|---:|
| SPI clock | 12 | 16 |
| SPI MOSI | 11 | 15 |
| SPI MISO | 13 | 17 |
| IMU CS | 8 | 12 |
| IMU interrupt | 14 | 18 |
| Motor M1 | 39 | 35 |
| Motor M2 | 40 | 36 |
| Motor M3 | 41 | 37 |
| Motor M4 | 42 | 38 |
| Battery ADC | 1 | 5 |
| UART TX / RX | 43 / 44 | 39 / 40 |
| BOOT / EN | 0 / — | 4 / 45 |

M1 is front-right, M2 rear-right, M3 rear-left, M4 front-left; +Y is forward. CW/CCW in CAD is a proposed alternating arrangement, not a verified ESP-FC mixer order. Firmware, rotation and sensor-axis configuration remain a separate task.

## JLCPCB sourcing

Exact EasyEDA footprints plus local OBJ/STEP models were imported using:

```sh
bunx tsci import C2913206 --jlcpcb --download --use-exact-footprint
```

Repeated for C97633, C15516, C20917, C8678 and C2041714. Reimporting may overwrite generated files; the board overrides the unreadable imported AO3400A schematic symbol with a pin box and retains its footprint/model. Importer-generated pin aliases such as `pin7` on TPS63031 are wired by verified numeric pad mapping.

See [bom.csv](bom.csv) for the selected parts. Generic passive footprints carry explicit JLCPCB candidate codes; they are not all individually imported vendor footprints. Stock and pricing are not reserved. Capacitor effective capacitance and inductor saturation require qualification under actual operating conditions.

## Validation scope

See [reports/validation.md](reports/validation.md). Checks cover connectivity and placement; there are no routed copper traces. The independent netlist assertions cover regulator pin mapping, sensor reserved pins, SPI mapping and all four low-side motor circuits. Nothing here validates thrust, thermal margins, RF performance or flight firmware.

## Manufacturer references

- [ESP32-S3-MINI-1 datasheet](https://documentation.espressif.com/esp32-s3-mini-1_mini-1u_datasheet_en.html)
- [ICM-20602 datasheet](https://invensense.tdk.com/wp-content/uploads/2020/11/DS-000176-ICM-20602-v1.1.pdf)
- [TPS63030/TPS63031 datasheet](https://www.ti.com/lit/ds/symlink/tps63030.pdf)
- [AO3400A datasheet](https://www.aosmd.com/sites/default/files/res/datasheets/AO3400A.pdf)
- [Selected Bourns inductor listing](https://jlcpcb.com/partdetail/BOURNS-SRN30151R5Y/C2041714)
- [ESP-FC firmware](https://github.com/rtlopez/esp-fc)

The user's two supplied specifications are preserved under `docs/`.

Battery retention uses one 2.5 mm zip tie through H5/H6 (1.8 × 3.2 mm rounded slots) at x=±13.5, y=-5 mm, with a thin insulating pad. The top strap lane is kept clear of components. No printed battery saddle is required. Fit and slip testing remain necessary.
