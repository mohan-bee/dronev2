# Placement validation

Commands run with tscircuit 0.0.2527 and CLI 0.1.2063.

- Netlist: zero errors, zero warnings.
- PCB placement: zero errors, zero warnings; no DRC suppression is applied.
- Schematic placement: no overlapping component bodies or inner labels after the AO3400A symbol override. The tool still recommends gathering all 3.3 V decouplers across different functional sections into one cluster; this is intentionally not followed because each decoupler belongs beside its own device. Trace-simplification suggestions are advisory.
- Build: succeeds with routing disabled; outputs circuit JSON, PCB SVG/PNG and schematic SVG.
- Automated electrical assertions: regulator power domains, IMU reserved/reference pins, SPI connectivity, four motor-driver topologies, component count, layer, no error records, no routed copper, and motor diagonal.
- Routing difficulty: strongest reported local region was 7.8% estimated failure probability inside U1's pad field. This is a heuristic, not a routing guarantee. Power routing remains a manual task.
- IMU SCK straight-line connection: 7.40 mm.

The full build retains warnings for descriptive reference names, generic pin specifications, pad-only components without courtyards, supplier footprint differences, and schematic reference-label styling. These are not placement errors and are not silenced. Review them before fabrication. Keepout support is a confirmed tooling blocker recorded in ISSUES.md.

Battery retention revision: both placement checks pass; five tests / 146 assertions pass, including the rounded slot dimensions and component clearance across the top tie lane. Motor apertures remain provisional pending mount selection.
