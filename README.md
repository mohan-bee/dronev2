# Drone V2

A compact, two-layer PCB microdrone with an interactive assembly viewer.

[Open the live 3D assembly studio](https://dronev2-cad.vercel.app)

- `pcb/` — tscircuit source, JLCPCB imports, mechanical dimensions, netlist tests and placement drawings.
- `cad/` — Three.js assembly viewer, generated PCB data and Vercel configuration.
- [ISSUES.md](ISSUES.md) — tooling blockers, mechanical assumptions and work required before routing/manufacture.

The two-layer specification supersedes the earlier four-layer proposal. Routing is deliberately disabled. No fabrication or flight release is implied.

![PCB placement](pcb/preview/pcb.png)

See [PCB instructions](pcb/README.md) for setup, validation, sourcing and pin mapping.

See [CAD instructions](cad/README.md) for the viewer, PCB sync, browser tests and deployment. The CAD PR is stacked on the PCB placement PR; merge the PCB first.
