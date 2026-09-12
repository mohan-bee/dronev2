# Routing validation

Netlist, schematic placement, PCB placement and TypeScript checks pass. No DRC suppression is applied. Both pipeline 9 and pipeline 7 create 131 trace paths; the current routing output includes 73 vias and one bottom GND pour.

Final build fails with 99 trace-to-board-edge errors. Five tests pass and the no-error-records test fails. The pill-hole regression test confirms contact and clearance violations remain detected by the committed conservative checks patch. See ../../TS_ISSUES.md and routing-build.txt for details.

The preview/pcb.png image and historical routing-difficulty report are placement-stage artifacts. preview/routing.png is the current unvalidated routing draft. No hardware qualification is implied.
