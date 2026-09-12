**Yes—an ESP-based microdrone can fly smoothly. For your single-PCB build, I would choose an ESP32-S3, a supported SPI IMU, four 716 brushed motors, and 46 mm propellers.** The image above is Espressif’s reference-drone style, not a render of your proposed PCB. Espressif’s own hardware reference uses the same **716-motor + 46 mm-propeller class**, so this is a sensible starting point rather than an arbitrary combination. ([Espressif Systems][1])

The important distinction: **good components make smooth flight possible; matched propulsion, clean power, firmware timing, and tuning make it happen.** I would not promise “zero lag” or perfect hovering from a component list alone.

I’ve put the component selections, sourcing links, supporting circuitry, and mechanical checks into a workbook:

**[Download the drone component plan and BOM workbook](sandbox:/mnt/data/Tiny_ESP_Drone_Component_Plan.xlsx)**

## 1. My selected main electronics

For this version, I would move away from the earlier ESP-12F approach and use:

> **ESP32-S3-MINI-1-N8 + ICM-20602 over SPI + four AO3400A motor switches + TPS63031 3.3 V power supply.**

### JLCPCB sourcing

These are the **stock figures reported by JLCPCB’s public listings/search snapshots checked on 12 September 2026**. They are not reserved quantities or a checkout confirmation; JLC’s dynamically loaded inventory was not consistently exposed when opening the pages.

| Function                       | Exact component              |  JLCPCB code | Quantity | Reported stock | Listed unit price |
| ------------------------------ | ---------------------------- | -----------: | -------: | -------------: | ----------------: |
| **ESP controller**             | **ESP32-S3-MINI-1-N8**       | **C2913206** |        1 |          4,997 |         US$4.6743 |
| **IMU**                        | **TDK InvenSense ICM-20602** |   **C97633** |        1 |          5,436 |         US$6.2652 |
| **3.3 V buck-boost regulator** | **TPS63031DSKR**             |   **C15516** |        1 |          6,592 |         US$1.1645 |
| **Motor switching MOSFET**     | **Alpha & Omega AO3400A**    |   **C20917** |        4 |        987,885 |    US$0.0847 each |
| **Motor flyback diode**        | **MDD SS34**                 |    **C8678** |        4 |      5,123,772 |    US$0.0349 each |

Sources, in table order: ESP module, IMU, regulator, MOSFET, and diode. ([JLCPCB][2])

That is approximately **US$12.58 for these core electronic components**, before supporting passives, PCB fabrication, assembly, shipping, and taxes.

**Assembly warning:** the selected ESP module and ICM-20602 are listed as **Standard PCBA only**. Do not budget this as a basic “US$2 PCB” order; get a complete assembly quote before committing. ([JLCPCB][3])

### Why these particular parts?

**ESP32-S3 rather than ESP8266/ESP-12F:** ESP-FC recommends ESP32/ESP32-S3, while its ESP8266 support is no longer actively developed. For a new performance-focused board, I would start on the supported platform. The MINI module also lets you avoid designing the bare chip’s flash, crystal, and RF circuitry yourself. ([GitHub][4])

**ICM-20602 rather than QMI8658A:** I know you previously preferred QMI8658A. For this build, firmware compatibility matters more than saving a few dollars: ESP-FC explicitly lists **ICM20602**, while QMI8658 is not in its supported-IMU list. ICM42688 is also supported, but I could not reliably confirm its JLC stock, so it is not my final selection. ([GitHub][4])

**AO3400A:** its on-resistance is specified at a **2.5 V gate drive**, making it a reasonable candidate for switching these motors from 3.3 V GPIO. Still, its headline current rating is not a guarantee that a tiny PCB footprint will stay cool—test it with your actual propeller load. ([Alpha & Omega Semiconductor][5])

---

## 2. Motors, propellers, and battery to buy

### My propulsion selection

| Part           | Selected specification                                                            | Quantity for one drone | Store and observed availability                                        |
| -------------- | --------------------------------------------------------------------------------- | ---------------------: | ---------------------------------------------------------------------- |
| **Motors**     | **716 brushed coreless, 3.7 V, 7 × 16 mm body, 0.8 mm shaft; two CW and two CCW** |               4 motors | **iFuture:** ₹120 listing, marked in stock                             |
| **Propellers** | **46 mm, 0.8 mm mounting hole, CW/CCW pair**                                      |                2 pairs | **RC Market City:** ₹40 per pair, marked in stock; code **RMC-700075** |
| **Battery**    | **YY702030, 1S 400 mAh, seller-rated 30C, ordinary 4.2 V LiPo**                   |                      1 | **Quartz Components:** ₹237; **67 listed in stock**                    |

Motor specifications and listing: iFuture. Propeller dimensions, pairing, and availability: RC Market City. Battery specifications and availability: Quartz Components. ([iFuture Technology][6])

**One procurement issue needs resolving:** iFuture’s page says “CW+CCW pair” near the purchase button, but its detailed package section says one motor. **Ask them to confirm that your order contains two CW and two CCW motors before paying.** I would also buy a spare set and compare the motors rather than assume every generic 716 performs identically. ([iFuture Technology][6])

### Why I selected separate 46 mm props

The listed motor shaft is **0.8 mm**, and these props explicitly specify a **0.8 mm hole**. Their diameter is also the default size in Espressif’s 716-motor reference. This is a better-defined starting point than using whatever unlabelled propellers happen to arrive with the motors. **Do not enlarge or drill the propeller holes to make a mismatched set fit.** ([iFuture Technology][6])

### Battery details that matter

The selected battery is **7 × 20 × 30 mm**, with an **M.X2.0 female connector** and **4.2 V maximum charging voltage**. Do not assume its connector is interchangeable with PH2.0 or BT2.0; confirm the mating connector and polarity before designing that connection. ([QuartzComponents][7])

Espressif’s reference specifies 300 mAh, with 350 mAh as an option. The **400 mAh pack is my currently sourced option**, not a claim that a larger battery automatically improves flight. Weigh it and include it in the thrust test before freezing the PCB shape. ([Espressif Systems][1])

**The unresolved performance variable is the generic motor batch:** the seller does not provide a verified thrust curve for this exact motor–propeller combination. I would approve it for flight only after measuring thrust and current.

---

## 3. The supporting circuit your PCB needs

The five main electronic parts are **not** the whole circuit.

### Power architecture

```text
1S LiPo battery
    │
    ├── Battery rail ── four motors
    │                       │
    │                  four MOSFET switches
    │
    └── TPS63031 ── regulated 3.3 V
                         ├── ESP32-S3
                         └── ICM-20602
```

**The motors must not run through the 3.3 V regulator.** The TPS63031 supplies the controller and sensors. TI specifies up to **500 mA output in boost operation with input above 2.4 V**, and up to **800 mA in buck operation under its stated conditions**—not an unconditional 1 A output. Check the 3.3 V rail with the radio active and the motors starting. ([Texas Instruments][8])

### Required supporting parts

| Circuit area                      | What to include                                                                 | Component reference / status                                 |
| --------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **MOSFET gates**                  | Four **100 Ω series resistors**                                                 | **C22775**, 0603; catalog entry verified                     |
| **Motors off during reset**       | Four **100 kΩ gate-to-ground resistors**                                        | **C25803**, 0603; catalog entry verified                     |
| **Battery measurement**           | Two **100 kΩ resistors** and an ADC filter capacitor                            | Same **C25803**; divider produces 2.1 V from a 4.2 V battery |
| **Boot/reset/chip-select pulls**  | Appropriate **10 kΩ resistors**                                                 | **C25804**, 0603; finalize count after schematic             |
| **Reset timing**                  | Appropriate EN timing capacitor                                                 | **C15849**, 1 µF candidate                                   |
| **Regulator capacitors**          | TI reference starts with **10 µF input, 2 × 10 µF output, and 100 nF at VINA**  | Check effective capacitance after DC-bias derating           |
| **Regulator inductor**            | **1.5 µH shielded power inductor**, low resistance, adequate saturation current | **Final stocked MPN still needs selection**                  |
| **IMU/module bypassing**          | Capacitors at the required supply/reference pins                                | Follow the exact manufacturer reference circuits             |
| **Motor-noise suppression**       | Provision for small ceramic capacitors at the motor terminals                   | Fit and evaluate during noise testing                        |
| **Battery-rail bulk capacitance** | Provision for a low-ESR capacitor near the power entry                          | Final value/package after transient and mass checks          |
| **Programming**                   | GND, 3V3, TX, RX, EN and BOOT test pads                                         | External programmer; no onboard USB-UART needed              |

The resistor/capacitor candidate identities come from JLC’s catalog; the regulator’s reference values come from TI. **I could not independently verify current inventory for every supporting passive**, so those are explicitly marked separately in the workbook rather than presented as an order-ready manufacturing BOM. ([JLCPCB][9])

For each motor, the flyback diode goes **across the motor**: cathode to battery positive, anode to the MOSFET drain/motor-negative connection. The MOSFET is the low-side switch. Have this power stage and its thermal/current capacity reviewed before ordering.

I would omit **onboard charging, a camera, GPS, displays, and big connectors** from version one. First make the light, clean flight-control board work.

---

## 4. PCB and 3D-printed mechanical design

These are **my proposed design targets**, not measurements from a finished drone.

| Feature                        | Proposed target                                                 |
| ------------------------------ | --------------------------------------------------------------- |
| Configuration                  | **Quad-X, single PCB**                                          |
| PCB construction               | **4 layers, around 1.0 mm thick**, subject to stiffness testing |
| Assembly                       | **All electronic components on the top side**                   |
| Opposite-motor centre distance | **80 mm diagonal**                                              |
| Propellers                     | **46 mm**                                                       |
| All-up mass                    | **Aim for 30–35 g**, including battery and printed parts        |
| Battery location               | Under the centre, positioned to balance the completed drone     |
| Printed parts                  | Keep the combined mass around **3–4 g or less**                 |

At an 80 mm motor diagonal, adjacent motor centres are approximately **56.6 mm apart**. With 46 mm props, that leaves about **10.6 mm between neighbouring propeller discs before adding guards**. The complete propeller footprint will be roughly **103 × 103 mm**, so this is palm-sized—not an 80 mm-wide finished aircraft.

### Placement priorities

Put the **IMU near the centre**, with short SPI traces, away from the switching regulator and large motor-current paths. Put the ESP antenna at an appropriate board edge and follow Espressif’s full antenna keepout; do not tuck it under the battery or copper-filled frame. Keep the converter’s switching loops compact and follow TI’s grounding/layout guidance. ([Espressif Documentation][10])

### The extra 3D parts I would design

| Printed part                      | Proposed construction                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Four motor collars**            | Lightweight split collars for the measured 7 mm motor bodies. A restrained TPU insert is an option; avoid soft mounts that let motors tilt. |
| **Four propeller guards**         | Thin PA12 nylon guards. Start with approximately **50–52 mm internal diameter**, then check clearance under maximum flex.                   |
| **Battery saddle**                | Underside holder for the measured pack, with rounded surfaces and retention that does not squeeze or puncture the pouch.                    |
| **Small canopy and landing nubs** | Minimal cover over the electronics, with antenna clearance and access to programming pads.                                                  |

Print a **motor-fit test piece first**, not the entire frame. A tight collar can damage the motor body; a loose one can change thrust direction.

**Buy moulded flight propellers. I would not use home-printed propellers on this build.**

---

## 5. How to make it responsive instead of “buffering”

### Use existing flight firmware as the starting point

I would start with **ESP-FC**, which lists ESP32-S3, ICM20602, brushed-motor outputs, ESP-NOW reception, and angle mode. It is compatible with Betaflight Configurator, but **it is not simply Betaflight firmware for an ESP board**. You still need the correct build, pin mapping, sensor orientation, motor ordering, and tuning. ([GitHub][4])

### Keep the stabilization loop onboard

Your transmitter should send **what you want the drone to do**. The onboard controller should continuously decide how to adjust the motors.

```text
Handheld transmitter → desired throttle / roll / pitch / yaw

Onboard:
IMU → attitude/rate estimate → controller → four motor outputs
```

My initial implementation targets would be a **500 Hz–1 kHz stabilization loop**, with a supported high-frequency brushed PWM setting, then measurements of timing, motor heating, and vibration before increasing rates. These are starting targets—not settings I have validated on this proposed PCB.

For control, I would use **a dedicated ESP-NOW transmitter**, not a browser page sending an accumulating queue of commands. ESP-FC documents an ESP-NOW receiver and a transmitter-module project; a custom two-gimbal handset still requires compatible transmitter firmware. Its ordinary Wi-Fi configuration mode is separate and does not allow arming while active. ([GitHub][11])

The implementation should always use the **newest valid command**, reject stale data, and have a tested loss-of-link failsafe. More filtering is not automatically better; tune filtering and controller gains against measured vibration rather than hiding a badly balanced motor with excessive smoothing.

### “Stable” does not automatically mean stationary hovering

A six-axis IMU helps control attitude. It does **not**, by itself, provide reliable position hold or automatic height hold. Espressif’s additional flight modes use additional sensing; optical flow and distance sensing would be a separate second-stage project. ([Espressif Systems][12])

For version one, I would target **predictable self-levelling flight with responsive manual control**.

---

## Before ordering the flight PCB

The most useful next test is **one selected motor + one selected propeller + the selected battery**, measuring thrust and current at representative battery voltages. Aim for roughly **2:1 combined maximum static thrust to actual all-up weight** as a design target, rather than a drone that barely lifts off.

Then verify the 3.3 V rail under radio and motor load. Before any free flight, test motor order, rotation, IMU axes, arming, and link-loss behaviour **with the propellers removed**. An external **4.2 V 1S LiPo charger with suitable adjustable current** is also needed; its exact model remains unselected until the battery’s permitted charge current and connector are confirmed.

**My recommendation is this S3 + SPI ICM-20602 + 716/46 mm platform. The main electronics are selected, but I would not call the complete build “ready to manufacture” until the motor-pack ambiguity, regulator inductor, remaining passive stock, schematic review, and thrust test are resolved.**

The [workbook](sandbox:/mnt/data/Tiny_ESP_Drone_Component_Plan.xlsx) separates those unresolved items from the selected parts across four sheets: **core JLC BOM, PCB support, motors/accessories, and build/3D checks**.

[1]: https://docs.espressif.com/projects/espressif-esp-drone/en/latest/hardware.html "Hardware Reference — ESP-Drone documentation"
[2]: https://jlcpcb.com/partdetail/EspressifSystems-ESP32_S3_MINI_1N8/C2913206?utm_source=chatgpt.com "ESP32-S3-MINI-1-N8 | Espressif Systems - JLCPCB"
[3]: https://jlcpcb.com/partdetail/EspressifSystems-ESP32_S3_MINI_1N8/C2913206 "ESP32-S3-MINI-1-N8 | Espressif Systems | JLCPCB"
[4]: https://github.com/rtlopez/esp-fc "GitHub - rtlopez/esp-fc: Flight controller software for hobbyist - build your own flight controller. · GitHub"
[5]: https://www.aosmd.com/sites/default/files/res/datasheets/AO3400A.pdf "https://www.aosmd.com/sites/default/files/res/datasheets/AO3400A.pdf"
[6]: https://ifuturetech.org/product/716-3-7v-micro-coreless-motor/ "https://ifuturetech.org/product/716-3-7v-micro-coreless-motor/"
[7]: https://quartzcomponents.com/products/3-7v-30c-400mah-lithium-polymer-lipo-battery-yy702030?srsltid=AfmBOoqkFMMkyHqjd6un7s3Ryk4hlYQRaNK6XOESmH--RiCSNJXdjM2F "https://quartzcomponents.com/products/3-7v-30c-400mah-lithium-polymer-lipo-battery-yy702030?srsltid=AfmBOoqkFMMkyHqjd6un7s3Ryk4hlYQRaNK6XOESmH--RiCSNJXdjM2F"
[8]: https://www.ti.com/lit/ds/symlink/tps63030.pdf "https://www.ti.com/lit/ds/symlink/tps63030.pdf"
[9]: https://jlcpcb.com/partdetail/0603WAF1000T5E/C22775 "https://jlcpcb.com/partdetail/0603WAF1000T5E/C22775"
[10]: https://documentation.espressif.com/esp32-s3-mini-1_mini-1u_datasheet_en.html "https://documentation.espressif.com/esp32-s3-mini-1_mini-1u_datasheet_en.html"
[11]: https://github.com/rtlopez/esp-fc/blob/master/docs/wireless.md "https://github.com/rtlopez/esp-fc/blob/master/docs/wireless.md"
[12]: https://docs.espressif.com/projects/espressif-esp-drone/en/latest/gettingstarted.html?utm_source=chatgpt.com "Get Started — ESP-Drone documentation - Espressif Systems"
