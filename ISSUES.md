# Open issues

Placement prototype only. Routing is intentionally deferred; do not order these outputs.

- **Confirmed tscircuit blocker — keepouts:** `tsci check netlist` fails with `Unsupported component type "pcbkeepout"` in the installed core despite the element being documented. Keepout requirements are recorded in `pcb/keepouts.json` and displayed in CAD; they must be implemented as actual copper exclusions before routing. Placement builds omit the unsupported JSX rather than pretending the exclusions are enforced.
- **Imported AO3400A schematic symbol:** schematic placement reports colliding top/bottom inner labels on the imported 0.68 × 0.4-unit symbol. Resolved with an explicit readable pin-box symbol while preserving the JLCPCB footprint, model and verified G/S/D mapping.

- **Battery connector:** YY702030 specifies M.X2.0, whose mating part/polarity is unconfirmed. This revision uses marked solder pads and a separately verified pigtail.
- **Mechanical validation:** collar fit, retention, arm stiffness, guard flex, assembled antenna clearance, and battery insulation need physical checks. Motors, props and battery in CAD are dimensional envelopes, not certified vendor models. No flight or mass claim is validated.
- **Power qualification:** TPS63031 low-battery radio load, motor startup current, inductor saturation and capacitor DC-bias derating require verification before manufacture.
- **Manufacturing release:** pin mapping review, routed DRC, copper keepouts and actual JLCPCB stock/assembly quotation remain required.
- **Resolved tooling reference gap:** linked CLI/element files in the original local skill were absent. The CLI bootstrap installed working project-local references; installed help/types and manufacturer documents were also used.
