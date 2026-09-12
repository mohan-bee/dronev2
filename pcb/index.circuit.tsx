import { Fragment } from "react";
import { ESP32_S3_MINI_1_N8 } from "./imports/ESP32_S3_MINI_1_N8/ESP32_S3_MINI_1_N8";
import { ICM_20602 } from "./imports/ICM_20602/ICM_20602";
import { TPS63031DSKR } from "./imports/TPS63031DSKR/TPS63031DSKR";
import { AO3400A } from "./imports/AO3400A/AO3400A";
import { SS34 } from "./imports/SS34/SS34";
import { SRN3015_1R5Y } from "./imports/SRN3015_1R5Y/SRN3015_1R5Y";
import geometry from "./geometry.json";

// Coordinates are millimetres, +Y is the nose. All electronic parts on top.
// Antenna intentionally overhangs the front edge; every solder pad remains supported.
const capParts: Record<string, [string, string]> = {
  "100nF": ["C14663", "CC0603KRX7R9BB104"],
  "10uF": ["C15850", "CL21A106KAYNNNE"],
  "22uF": ["C45783", "CL21A226MAQNNNE"],
  "1uF": ["C15849", "CL10A105KB8NNNC"],
  "10nF": ["C57112", "0603B103K500NT"],
  "2.2uF": ["C23630", "CL10A225KO8NNNC"],
  "47uF": ["C5440143", "CS3225X7R476K160NRL"],
};
const caps = [
  ["CIN", "10uF", "0805", -10, -12, "VBAT", "GND", "Power"],
  ["COUT1", "10uF", "0805", -14, -2, "V3V3", "GND", "Power"],
  ["COUT2", "10uF", "0805", -10, -2.5, "V3V3", "GND", "Power"],
  ["CVINA", "100nF", "0603", -3.5, -8, "VBAT", "GND", "Power"],
  ["CBULK", "47uF", "1210", -3, -14, "VBAT", "GND", "Power"],
  ["CESP", "22uF", "0805", -11.5, 13, "V3V3", "GND", "Controller"],
  ["CESPHF", "100nF", "0603", -11.5, 10.5, "V3V3", "GND", "Controller"],
  ["CEN", "1uF", "0603", 10, 13, "EN", "GND", "Controller"],
  ["CIMU", "100nF", "0603", 3.5, -1, "V3V3", "GND", "Sensor"],
  ["CIMUB", "2.2uF", "0603", 3.5, -2.9, "V3V3", "GND", "Sensor"],
  ["CIO", "10nF", "0603", 3.5, 1.2, "V3V3", "GND", "Sensor"],
  ["CREG", "100nF", "0603", -3.5, -1.5, "REGOUT", "GND", "Sensor"],
  ["CADC", "100nF", "0603", 10, -8, "VBAT_ADC", "GND", "Battery_sense"],
] as const;
const resistors = [
  ["REN", "10k", 10, 10.5, "V3V3", "EN", "Controller"],
  ["RBOOT", "10k", 10, 8, "V3V3", "BOOT", "Controller"],
  ["RCS", "10k", -3.5, -3, "V3V3", "IMU_CS", "Sensor"],
  ["RADCH", "100k", 10, -1, "VBAT", "VBAT_ADC", "Battery_sense"],
  ["RADCL", "100k", 10, -3, "VBAT_ADC", "GND", "Battery_sense"],
] as const;
const origins: Record<string, [number, number]> = {
  Power: [32, 8],
  Controller: [0, 8],
  Sensor: [32, -12],
  Battery_sense: [50, -12],
  Programming: [-20, -20],
};
const counts: Record<string, number> = {};
function schematic(section: string) {
  const i = counts[section] ?? 0;
  counts[section] = i + 1;
  const [x, y] = origins[section];
  return {
    schSectionName: section,
    schX: x + (i % 3) * 3,
    schY: y - Math.floor(i / 3) * 3,
  };
}
const connection = (from: string, to: string) => (
  <trace key={`${from}-${to}`} from={from} to={`net.${to}`} />
);
export default function Drone() {
  Object.keys(counts).forEach((k) => delete counts[k]);
  return (
    <board
      outline={geometry.outline.map(([x, y]) => ({ x, y }))}
      thickness={1}
      layers={2}
      autorouter={{ local: true, allowViaInPad: false }}
      minTraceWidth={0.15}
      nominalTraceWidth={0.2}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      minBoardEdgeClearance={0.3}
    >
      <net name="GND" isGroundNet nominalTraceWidth={0.5} />
      <net name="VBAT" isPowerNet nominalTraceWidth={0.8} />
      <net name="V3V3" isPowerNet nominalTraceWidth={0.3} />
      <trace from=".JBAT > .pin1" to="net.VBAT" thickness={0.8} />
      <trace from=".JBAT > .pin2" to="net.GND" thickness={0.5} />
      <trace from=".COUT1 > .pin1" to="net.V3V3" thickness={0.3} />
      <trace from=".L1 > .pin1" to="net.SW_L1" thickness={0.6} />
      <trace from=".L1 > .pin2" to="net.SW_L2" thickness={0.6} />
      {geometry.motors.map((m) => <trace from={`.J${m.name} > .pin2`}
        to={`net.${m.name}_SWITCHED`} thickness={0.8} />)}
      <net name="SW_L1" nominalTraceWidth={0.6} />
      <net name="SW_L2" nominalTraceWidth={0.6} />
      {geometry.motors.map((m) => <net name={`${m.name}_SWITCHED`} nominalTraceWidth={0.8} />)}
      {Object.keys(origins).map((name) => (
        <schematicsection name={name} />
      ))}
      <ESP32_S3_MINI_1_N8
        schHeight={6.2}
        name="U1"
        pcbX={0}
        pcbY={10.5}
        allowOffBoard
        schX={0}
        schY={16}
        schSectionName="Controller"
      />
      <ICM_20602
        name="U2"
        pcbX={0}
        pcbY={-1.5}
        pcbRotation={180}
        schX={32}
        schY={-5}
        schSectionName="Sensor"
      />
      <TPS63031DSKR
        schHeight={1.2}
        name="U3"
        pcbX={-7}
        pcbY={-8.5}
        schX={32}
        schY={15}
        schSectionName="Power"
      />
      <SRN3015_1R5Y
        name="L1"
        pcbX={-12}
        pcbY={-8.5}
        schX={38}
        schY={15}
        schSectionName="Power"
      />
      {caps.map(([name, value, footprint, x, y, a, b, section]) => (
        <capacitor
          key={name}
          name={name}
          pcbRotation={name === "CEN" ? 180 : 0}
          capacitance={value}
          supplierPartNumbers={{ jlcpcb: [capParts[value][0]] }}
          manufacturerPartNumber={capParts[value][1]}
          schRotation={-90}
          footprint={footprint}
          pcbX={x}
          pcbY={y}
          {...schematic(section)}
          connections={{ pin1: `net.${a}`, pin2: `net.${b}` }}
        />
      ))}
      {resistors.map(([name, value, x, y, a, b, section]) => (
        <resistor
          key={name}
          name={name}
          resistance={value}
          schRotation={-90}
          footprint="0603"
          pcbX={x}
          pcbY={y}
          {...schematic(section)}
          supplierPartNumbers={{
            jlcpcb: [value === "10k" ? "C25804" : "C25803"],
          }}
          connections={{ pin1: `net.${a}`, pin2: `net.${b}` }}
        />
      ))}
      {[
        [1, "GND"],
        [2, "GND"],
        [3, "V3V3"],
        [4, "BOOT"],
        [5, "VBAT_ADC"],
        [12, "IMU_CS"],
        [15, "IMU_MOSI"],
        [16, "IMU_SCK"],
        [17, "IMU_MISO"],
        [18, "IMU_INT"],
        [35, "M1_PWM"],
        [36, "M2_PWM"],
        [37, "M3_PWM"],
        [38, "M4_PWM"],
        [39, "UART_TX"],
        [40, "UART_RX"],
        [42, "GND"],
        [43, "GND"],
        [45, "EN"],
        ...Array.from({ length: 16 }, (_, i) => [46 + i, "GND"]),
      ].map(([pin, net]) => connection(`.U1 > .pin${pin}`, String(net)))}
      {[
        [1, "V3V3"],
        [2, "IMU_SCK"],
        [3, "IMU_MOSI"],
        [4, "IMU_MISO"],
        [5, "IMU_CS"],
        [6, "IMU_INT"],
        [8, "GND"],
        [9, "GND"],
        [10, "GND"],
        [11, "GND"],
        [12, "GND"],
        [13, "GND"],
        [14, "REGOUT"],
        [15, "GND"],
        [16, "V3V3"],
      ].map(([pin, net]) => connection(`.U2 > .pin${pin}`, String(net)))}
      {[
        [1, "V3V3"],
        [2, "SW_L2"],
        [3, "GND"],
        [4, "SW_L1"],
        [5, "VBAT"],
        [6, "VBAT"],
        [7, "VBAT"],
        [8, "VBAT"],
        [9, "GND"],
        [10, "V3V3"],
        [11, "GND"],
      ].map(([pin, net]) => connection(`.U3 > .pin${pin}`, String(net)))}
      {connection(".L1 > .pin1", "SW_L1")}
      {connection(".L1 > .pin2", "SW_L2")}
      <keepout shape="rect" pcbX={0} pcbY={-1.5} width={2} height={2}
        layers={["top", "bottom"]} excludeRefs={[".U2"]} />
      <keepout shape="rect" pcbX={-18} pcbY={12.5} width={0.6} height={1.8}
        layers={["top", "bottom"]} />
      <copperpour connectsTo="net.GND" layer="bottom" clearance={0.2} boardEdgeMargin={0.4} />
      <keepout shape="rect" pcbX={0} pcbY={21} width={15.4} height={6}
        layers={["top", "bottom"]} />
      {/* Antenna has no supporting PCB from y=18 onward. Reserve this volume in CAD too. */}
      <pinheader name="JPROG" pinCount={6} pitch={2.54} doNotPlace
        pcbX={16} pcbY={-0.35} pcbRotation={90}
        schX={-13} schY={-20} schSectionName="Programming"
        connections={{pin1: "net.GND", pin2: "net.V3V3", pin3: "net.UART_TX",
          pin4: "net.UART_RX", pin5: "net.EN", pin6: "net.BOOT"}} />
      <pinheader name="JBAT" pinCount={2} pitch={2.54} doNotPlace
        pcbX={-10.5} pcbY={-16} schX={47} schY={15} schSectionName="Power"
        connections={{pin1: "net.VBAT", pin2: "net.GND"}} />
      {geometry.motors.map((m, i) => {
        const sx = Math.sign(m.x),
          sy = Math.sign(m.y),
          n = i + 1,
          sec = `Motor_${n}`,
          ox = -20 + i * 20;
        return (
          <Fragment key={m.name}>
            <schematicsection name={sec} />
            <hole name={`H${n}`} diameter={7.6} pcbX={m.x} pcbY={m.y} />
            <AO3400A
              pcbRotation={sx > 0 ? 180 : 0}
              symbol={undefined}
              schWidth={1.2}
              schHeight={0.4}
              name={`Q${n}`}
              pcbX={sx * 21.5}
              pcbY={sy * 18}
              schX={ox}
              schY={-35}
              schSectionName={sec}
              connections={{
                G: `net.M${n}_GATE`,
                S: "net.GND",
                D: `net.M${n}_SWITCHED`,
              }}
            />
            <SS34
              schRotation={-90}
              name={`D${n}`}
              pcbX={sx * 20.65}
              pcbY={sy * 22}
              pcbRotation={0}
              schX={ox + 4}
              schY={-32}
              schSectionName={sec}
              connections={{ cathode: "net.VBAT", anode: `net.M${n}_SWITCHED` }}
            />
            <resistor
              name={`RG${n}`}
              pcbRotation={sx < 0 ? 180 : 0}
              resistance="100"
              footprint="0603"
              pcbX={sx * 17.5}
              pcbY={sy * 16.5}
              schX={ox - 4}
              schY={-35}
              schSectionName={sec}
              supplierPartNumbers={{ jlcpcb: ["C22775"] }}
              connections={{ pin1: `net.M${n}_PWM`, pin2: `net.M${n}_GATE` }}
            />
            <resistor
              name={`RPD${n}`}
              pcbRotation={n === 4 ? 180 : 0}
              resistance="100k"
              schRotation={-90}
              footprint="0603"
              pcbX={sx * 17.5}
              pcbY={sy * 18.5}
              schX={ox}
              schY={-39}
              schSectionName={sec}
              supplierPartNumbers={{ jlcpcb: ["C25803"] }}
              connections={{ pin1: `net.M${n}_GATE`, pin2: "net.GND" }}
            />
            <capacitor
              name={`CM${n}`}
              capacitance="100nF"
              supplierPartNumbers={{ jlcpcb: ["C14663"] }}
              manufacturerPartNumber="CC0603KRX7R9BB104"
              schRotation={-90}
              footprint="0603"
              pcbX={sx * 21}
              pcbY={sy * 25.5}
              schX={ox + 7}
              schY={-35}
              schSectionName={sec}
              connections={{ pin1: "net.VBAT", pin2: `net.M${n}_SWITCHED` }}
            />
            <pinheader name={`JM${n}`} pinCount={2} pitch={2.54} doNotPlace
              pcbX={sx * 27.25} pcbY={sy * 21.5}
              pcbRotation={sx < 0 ? 180 : 0}
              schX={ox + 5.5} schY={-39} schSectionName={sec}
              connections={{pin1: "net.VBAT", pin2: `net.M${n}_SWITCHED`}} />
          </Fragment>
        );
      })}
      {geometry.batteryRetention.slotX.map((x, i) => (
        <hole name={`H${i + 5}`} shape="pill"
          width={geometry.batteryRetention.slotWidth}
          height={geometry.batteryRetention.slotHeight}
          pcbX={x} pcbY={geometry.batteryRetention.y} />
      ))}
      <silkscreentext text="DRONE V2" pcbX={5} pcbY={-14} fontSize={1.4} />
      <silkscreentext text="1S +   -" pcbX={-10.5} pcbY={-18} fontSize={0.8} />
    </board>
  );
}
