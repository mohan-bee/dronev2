**Yes—we can build this as a two-layer PCB, with the PCB itself forming the drone’s body and all components assembled on top.** Espressif explicitly allows two-layer ESP32-S3 designs, provided the bottom layer remains mostly an uninterrupted ground reference rather than becoming another busy signal-routing layer. ([docs.espressif.com][1])

For your drone, I would keep the selected **ESP32-S3-MINI-1-N8, ICM-20602, TPS63031, and four AO3400A motor switches**.

**Two layers do not inherently create control lag.** The concern is electrical noise and voltage dips from the motors—not “buffering” caused by the layer count. Motor noise can disturb sensors and even reset a controller, so the power layout deserves particular attention. ([Pololu][2])

# 1. PCB specification I would start with

These are **proposed design targets**, not a flight-tested mechanical design.

| Item                | Proposed specification                                     |
| ------------------- | ---------------------------------------------------------- |
| Board construction  | **Two-layer FR-4**                                         |
| Board thickness     | **1.0 mm initially**, then verify stiffness                |
| Copper              | **1 oz on both sides**                                     |
| Surface finish      | **ENIG preferred**                                         |
| Component assembly  | **Top side only**                                          |
| Shape               | **X-shaped PCB that also serves as the frame**             |
| Motor spacing       | **80 mm between opposite motor centres**                   |
| Propellers          | **46 mm**                                                  |
| Motor mounting      | Printed collars attached to the PCB arms                   |
| Battery mounting    | Under the centre, with electrical insulation               |
| Complete drone mass | Continue targeting **30–35 g**, subject to measured thrust |

JLCPCB lists two-layer FR-4, 1.0 mm thickness, 1 oz copper, and ENIG among its manufacturing options. These choices do not establish the final assembly price or component inventory. ([JLCPCB][3])

At an 80 mm motor diagonal, adjacent motor centres are approximately **56.6 mm apart**. With 46 mm propellers, the nominal gap between adjacent propeller discs is approximately **10.6 mm**.

**Do not make the arms extremely thin just to reduce weight.** My preference is to begin with fairly broad, rounded arm roots, then remove material only after checking mass and flex.

# 2. Decide what belongs on each copper layer

| Top copper                                  | Bottom copper                                         |
| ------------------------------------------- | ----------------------------------------------------- |
| All component footprints                    | Mostly connected GND copper                           |
| Battery-positive distribution               | Motor-current return paths through broad ground areas |
| Short motor-switching connections           | Ground connections for controller and power circuitry |
| Regulated 3.3 V distribution                | Only a few short signal crossings where necessary     |
| SPI, motor-control, and programming signals | Required antenna and sensor footprint keepouts        |

The manufacturer-backed principle is **top-side components and signals, with minimal bottom routing**. ([docs.espressif.com][1])

For this design, I would use **one common GND net**, while arranging the components and power branches so motor current does not have to squeeze through the controller/sensor area. Do not create separate, floating “motor ground” and “sensor ground” islands.

There are two important exceptions to a broad ground pour: the **antenna clearance area** and the **local keepout under the IMU package**. The latter follows TDK’s sensor-layout guidance; it is a small footprint-level clearance, not a long slot dividing the whole board. ([Mouser Electronics][4])

# 3. Place components before routing anything

### ESP module: front edge, antenna facing outward

Position the module so its antenna end extends beyond the supporting PCB edge where practical. Keep the battery, motor wires, and printed attachments away from that area. Espressif recommends antenna clearance in the finished product and testing the final assembly’s communication performance. ([Espressif Systems][1])

**Do not remove ground beneath the entire module.** Apply the antenna keepout specifically, while following the recommended land pattern for the rest of the module.

### IMU: near the centre, in a mechanically quiet location

I would put the ICM-20602 near the centre of the drone, but allow a slight offset to avoid a mounting point, heavily flexing area, or hot component.

Keep it away from the regulator’s inductor, motor-current paths, mounting screws, and pressure from the battery holder. TDK specifically warns about mechanical stress, heat sources, vibration, and connectors or test fixtures directly beneath an IMU. ([Mouser Electronics][4])

### Regulator: beside the battery input

Place the TPS63031, its inductor, and its input/output capacitors together as a compact group. Do not scatter them around spare spaces on the PCB. TI’s layout guidance calls for short, wide power connections and closely placed capacitors and inductor.

### Motor circuits: one group near each motor connection

My proposed arrangement is one MOSFET, diode, gate resistor, and gate pull-down near each motor’s solder pads. This keeps the switched motor-negative connection short, while the much lower-current gate-control trace travels along the arm.

### Programming pads: accessible along a side

Keep programming access away from the IMU and outside the battery-holder contact area. You should be able to connect a programmer without removing motors or pressing on the sensor.

# 4. Draw the schematic in five blocks

## A. Battery input and 3.3 V supply

Use this power arrangement:

```text
1S LiPo positive
    |
    +---- Motor 1 positive
    +---- Motor 2 positive
    +---- Motor 3 positive
    +---- Motor 4 positive
    |
    +---- TPS63031 ---- regulated 3.3 V
                           |
                           +---- ESP32-S3 module
                           +---- ICM-20602

Battery negative -------- common GND
```

**The motors connect to the battery rail—not the regulator’s 3.3 V output.**

For the TPS63031, start from TI’s **fixed-3.3 V application circuit**, not the adjustable TPS63030 circuit:

| Item                  | Reference-circuit value / connection             |
| --------------------- | ------------------------------------------------ |
| Inductor              | **1.5 µH**, appropriately rated for peak current |
| Input capacitor       | **10 µF**                                        |
| Output capacitors     | **2 × 10 µF**                                    |
| VINA bypass capacitor | **100 nF**                                       |
| FB pin                | Connect to the 3.3 V output                      |
| EN                    | Defined high for normal always-on operation      |
| PS/SYNC               | High disables power-save mode; low enables it    |

The capacitor values must remain adequate after voltage derating. Follow TI’s local power-ground/control-ground arrangement and exposed-pad requirements.

For the first prototype, I would provision **PS/SYNC high during flight** and reserve space for additional battery-rail bulk capacitance.

**Power-budget caution:** TPS63031 is specified for up to 500 mA in boost operation under its stated conditions; its “1-A switches” description is not a 1 A output guarantee. Espressif recommends a supply capable of at least 500 mA. This makes low-battery, radio-active testing essential before accepting this regulator for the finished drone. ([Texas Instruments][5])

## B. ESP32-S3 minimum circuit

For the module—not a bare ESP32-S3 chip—include:

| Connection              | Implementation                                                        |
| ----------------------- | --------------------------------------------------------------------- |
| 3V3                     | Regulated 3.3 V                                                       |
| Local supply capacitors | **22 µF + 100 nF**, as shown in the module reference                  |
| EN                      | **10 kΩ pull-up to 3.3 V + 1 µF to GND** as the initial reset network |
| BOOT / GPIO0            | Accessible connection to GND for entering download mode               |
| UART                    | TX, RX, and GND programming pads                                      |
| Ground pads             | Connect according to the module land pattern                          |

The module reference provides the supply and reset circuitry; the EN timing should still be checked with the actual regulator.

I would add an external **10 kΩ GPIO0 pull-up** and expose:

```text
GND   3V3_TEST   TX   RX   EN   BOOT
```

Use a **3.3 V-logic programmer**. Label `3V3_TEST` clearly: it should not encourage connecting an external supply in parallel with the onboard regulator.

## C. ICM-20602 circuit

Power **VDD and VDDIO from the regulated sensor supply**, not directly from the LiPo.

Use the manufacturer’s actual capacitor arrangement:

| ICM-20602 connection            | Required external connection   |
| ------------------------------- | ------------------------------ |
| VDD, pin 16                     | **100 nF + 2.2 µF** to GND     |
| VDDIO, pin 1                    | **10 nF** to GND               |
| REGOUT, pin 14                  | **100 nF** to GND              |
| FSYNC, pin 8                    | GND when unused                |
| Reserved pin 7                  | Leave electrically unconnected |
| Reserved pins 9, 10, 11, 12, 15 | GND                            |
| GND, pin 13                     | GND                            |

**REGOUT is not a general-purpose supply output.** Also, do not treat every reserved pin identically.

Use SPI: clock to `SCL/SPC`, MOSI to `SDA/SDI`, MISO from `SA0/SDO`, and a GPIO-controlled `CS`. I would add a **10 kΩ CS pull-up** and reserve an interrupt connection. Do not copy the datasheet’s I²C example with CS permanently tied high.

Place these capacitors immediately beside their corresponding pins. Keep SPI routes short, reasonably similar in length, and away from switching-power traces; respect the under-package copper/via keepout. ([Mouser Electronics][4])

## D. Four brushed-motor driver circuits

Repeat this circuit four times:

```text
VBAT -------------------- Motor positive
                              |
                            MOTOR
                              |
Motor negative ---------------+---- AO3400A DRAIN

AO3400A SOURCE -------------------- GND

ESP motor GPIO ---- 100 Ω --------- AO3400A GATE
                                      |
                                    100 kΩ
                                      |
                                  SOURCE / GND
```

Place the **SS34 diode across the motor connection**:

**Diode cathode → VBAT / motor positive.**
**Diode anode → motor negative / MOSFET drain.**

This low-side-switch and flyback-diode topology is also used in Espressif’s drone reference, although its exact transistor, diode, and resistor choices differ.

The 100 Ω and 100 kΩ values above are my proposed starting values. Put both close to the MOSFET. Verify the actual AO3400A footprint’s gate/source/drain mapping against its datasheet, rather than trusting an imported symbol.

For motor-noise suppression, provision a small ceramic capacitor across each motor’s terminals. Pololu recommends terminal capacitors and short, twisted motor leads; its general starting recommendation is 100 nF. Validate the chosen capacitor with your motor PWM and switching waveform. ([Pololu][2])

**A capacitor between VBAT and GND is not the same connection as a capacitor across the motor.**

## E. Battery-voltage measurement

My proposed measurement circuit is:

```text
VBAT ---- 100 kΩ ----+---- ADC input
                    |
                  100 kΩ
                    |
                   GND

ADC input ---- 100 nF ---- GND
```

The equal resistor divider gives:

$$
V_{\text{ADC}} = V_{\text{battery}}/2
$$

Therefore, a 4.2 V battery produces approximately **2.1 V at the ADC input**.

Calibrate the reported voltage against a multimeter. Battery warnings should use the measured pack voltage, not an assumed value from the resistor labels alone.

# 5. Use a firmware-compatible pin assignment

**Start with ESP-FC’s documented ESP32-S3 defaults** rather than inventing a completely different pinout.

| Function        | ESP32-S3 GPIO |
| --------------- | ------------: |
| IMU SPI clock   |        **12** |
| IMU MOSI        |        **11** |
| IMU MISO        |        **13** |
| IMU chip select |         **8** |
| Motor output 1  |        **39** |
| Motor output 2  |        **40** |
| Motor output 3  |        **41** |
| Motor output 4  |        **42** |
| Battery ADC     |         **1** |
| UART TX         |        **43** |
| UART RX         |        **44** |

These assignments come from ESP-FC’s wiring documentation. Confirm them against the firmware revision you actually build. ([GitHub][6])

**GPIO numbers are not module pad numbers.** Your schematic symbol must map them correctly.

GPIO39–42 also have JTAG functions, so do not connect an external JTAG interface to them while they are motor controls. Avoid assigning motor outputs to the boot-strapping GPIOs **0, 3, 45, and 46**.

ESP-FC lists support for **ESP32-S3, ICM20602, and BRUSHED outputs**. Select the brushed output protocol and verify the physical motor order against the mixer before attaching propellers. ([GitHub][7])

# 6. Routing rules for this two-layer version

### Starting trace widths

These are **initial layout allowances—not guaranteed current ratings**.

| Connection                           | Starting width / approach                                 |
| ------------------------------------ | --------------------------------------------------------- |
| SPI and ordinary signals             | **0.20–0.25 mm**                                          |
| Local fine-pitch escape              | **0.15 mm where necessary**                               |
| Main regulated 3.3 V feed            | **0.8–1.0 mm**                                            |
| Individual motor-current path        | Begin around **1.0–1.5 mm**, wider where practical        |
| Shared battery-positive distribution | Broad copper region; initially allow **2.5–3 mm or more** |
| Ground return                        | Broad connected copper, without narrow bottlenecks        |
| Ordinary vias                        | **0.30 mm drill / 0.60 mm pad**                           |
| General trace clearance              | **0.20 mm**, with reviewed local exceptions               |

These ordinary trace/via choices are comfortably above several of JLCPCB’s published minimum capabilities. Fine-pitch footprints and power paths still need individual review. ([JLCPCB][3])

**Size motor copper using measured loaded current and startup current.** The shared battery feed carries all four motors plus the electronics; a trace that is adequate for one motor is not automatically adequate for the common feed.

### My routing order

**First, finish the regulator’s local placement and connections.** Then route the battery distribution and motor circuits, keeping space reserved for the IMU-to-ESP connection. Route SPI next, followed by programming, battery measurement, and remaining signals.

For this project, I would lock the power and sensor routes before autorouting any remaining low-current connections.

### Ground and switching details

Keep the MOSFET drain copper **compact**, rather than turning each switched motor-negative net into a large copper pour. Give the source-to-ground connection a broad path, and use multiple suitably sized vias wherever substantial motor current changes layers.

Do not allow a bottom-side signal trace to cut across an entire arm or divide the central ground region. A bottom trace can be short yet still create a bad ground bottleneck.

For the TPS63031, reproduce the manufacturer’s local layout closely instead of relying on a generic “connect everything to the ground pour” approach.

# 7. Mechanical and 3D checks

For this version, I would design **motor collars, propeller guards, an insulated battery saddle, and a very small protective canopy**—not a second structural frame.

**Motor collars:** print a fit-test piece using the actual motors. The collar should retain the motor without crushing its casing or allowing the thrust direction to tilt.

**Propeller clearance:** check the full swept disc in CAD, including blade height, guard flex, component height, and motor-wire position. A top-view circle check alone is insufficient.

**Battery holder:** use a proper insulating barrier between the battery and PCB. Keep sharp board edges, solder joints, and protruding hardware away from the pouch. The holder should not press directly beneath the IMU.

**Frame stiffness:** start with 1.0 mm FR-4, but do not assume it is automatically stiff enough. Test arm flex and vibration before committing to a larger batch.

Espressif supplies the module’s recommended footprint and STEP-model resources in its datasheet, which are useful for the enclosure and clearance model.

# 8. Checks before ordering and before flight

| Stage                        | What I would require                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Before PCB order**         | Electrical and layout checks; verified footprints and pin 1; correct diode polarity; antenna clearance; no ground bottlenecks; mechanical clearance model; finalized inductor and capacitor part numbers |
| **First power-up**           | Current-limited bench supply, props removed, checked polarity and 3.3 V rail, no unexpected heating                                                                                                      |
| **Motor testing**            | Props-off motor order and direction; then separate guarded loaded-propulsion testing for current, thrust, and heating                                                                                    |
| **Radio and sensor testing** | Monitor 3.3 V and IMU supply while radio and motors operate; inspect sensor data; verify reset behaviour and loss-of-link failsafe                                                                       |
| **Before free flight**       | Correct IMU axes, calibrated battery reading, verified arming behaviour, measured all-up mass, sufficient measured thrust                                                                                |

ESP-FC specifically instructs users to test motor configuration with propellers removed. ([GitHub][7])

**My recommendation: proceed with two layers for this version.** Keep the design simple, preserve the ground return paths, and give the regulator and IMU placement priority over making the board look symmetrical. The schematic, selected power components, and finished routing still need review before this becomes a manufacturing-ready drone PCB.

[1]: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32s3/pcb-layout-design.html "PCB Layout Design - ESP32-S3 - — ESP Hardware Design Guidelines latest documentation"
[2]: https://www.pololu.com/docs/0J15/9 "Pololu - 9. Dealing with Motor Noise"
[3]: https://jlcpcb.com/capabilities/Capabilities?utm_source=chatgpt.com "PCB Manufacturing & Assembly Capabilities - JLCPCB"
[4]: https://www.mouser.com/pdfDocs/tdk-invensense-an-000393.pdf "AN-000393"
[5]: https://www.ti.com/lit/ds/symlink/tps63030.pdf "TPS6303x High Efficiency Single Inductor	 Buck-Boost Converter With 1-A Switches datasheet (Rev. D)"
[6]: https://github.com/rtlopez/esp-fc/blob/master/docs/wiring.md "esp-fc/docs/wiring.md at master · rtlopez/esp-fc · GitHub"
[7]: https://github.com/rtlopez/esp-fc "GitHub - rtlopez/esp-fc: Flight controller software for hobbyist - build your own flight controller. · GitHub"
