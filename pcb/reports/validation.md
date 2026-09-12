# Routing validation

Netlist, schematic placement, PCB placement and TypeScript checks pass. No DRC suppression is applied. Both pipeline 9 and pipeline 7 create 131 trace paths; the current routing output includes 78 vias and one bottom GND pour.

Final build fails with 96 trace-to-board-edge errors. Six tests pass and the no-error-records test fails. The pill-hole regression test confirms contact and clearance violations remain detected by the committed conservative checks patch. See ../../TS_ISSUES.md and routing-build.txt for details.

The preview/pcb.png image shows the updated DNP header placement. The historical routing-difficulty report predates the headers. preview/routing.png is the current unvalidated routing draft. No hardware qualification is implied.
