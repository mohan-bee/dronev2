# Open issues

Placement prototype only. Routing is intentionally deferred; do not order these outputs.

- **Confirmed tscircuit blocker — keepouts:** `tsci check netlist` fails with `Unsupported component type "pcbkeepout"` in the installed core despite the element being documented. Keepout requirements are recorded in `pcb/keepouts.json` and displayed in CAD; they must be implemented as actual copper exclusions before routing. Placement builds omit the unsupported JSX rather than pretending the exclusions are enforced.
- **Imported AO3400A schematic symbol:** schematic placement reports colliding top/bottom inner labels on the imported 0.68 × 0.4-unit symbol. Resolved with an explicit readable pin-box symbol while preserving the JLCPCB footprint, model and verified G/S/D mapping.

- **Battery connector:** YY702030 specifies M.X2.0, whose mating part/polarity is unconfirmed. This revision uses marked solder pads and a separately verified pigtail.
- **Mechanical validation:** collar fit, retention, arm stiffness, guard flex, assembled antenna clearance, and battery insulation need physical checks. Motors, props and battery in CAD are dimensional envelopes, not certified vendor models. No flight or mass claim is validated.
- **Power qualification:** TPS63031 low-battery radio load, motor startup current, inductor saturation and capacitor DC-bias derating require verification before manufacture.
- **Manufacturing release:** pin mapping review, routed DRC, copper keepouts and actual JLCPCB stock/assembly quotation remain required.
- **Resolved tooling reference gap:** linked CLI/element files in the original local skill were absent. The CLI bootstrap installed working project-local references; installed help/types and manufacturer documents were also used.

- **Motor mount procurement:** a dimensioned rubber mount for the 7 mm motor and 1 mm PCB has not been selected. The 7.6 mm PCB apertures and collar geometry remain placeholders. Confirm bore, panel groove, flange retention and resistance to motor tilt before changing holes or buying mounts.
- **Zip-tie battery retention:** two 1.8 × 3.2 mm rounded slots accept the proposed 2.5 mm tie. Use a thin insulating pad and smooth slot edges; verify actual tie thickness/head and pack dimensions, longitudinal slip, and avoid compressing the pouch or bending the PCB. The 20 × 30 mm pack is centered at (0, -5), overhanging the rear center edge by 2 mm. Prototype fit remains required.
