import { test, expect } from "@playwright/test";
import path from "node:path";
const shots = path.resolve("../.impeccable/review/shots");
test("desktop assembly, inspection, views, visibility and export", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 45000 });
  await expect(page.locator("#part-count")).toContainText("parts");
  await page.screenshot({ path: path.join(shots, "desktop.png") });
  await expect(page.locator('[data-part="SAD"]')).toHaveCount(0);
  await page.locator('[data-part="TIE"]').click();
  await expect(page.locator("#selection")).toContainText("1.8 × 3.2 mm");
  await page.locator('[data-view="bottom"]').click();
  await page.screenshot({path: path.join(shots, "battery-bottom.png")});
  await page.locator('[data-view="side"]').click();
  await page.screenshot({path: path.join(shots, "battery-side.png")});
  await page.locator('[data-part="PAD"]').click();
  await expect(page.locator("#selection")).toContainText("Insulating foam pad");
  await page.locator('[data-part="U1"]').click();
  await expect(page.locator("#selection h3")).toContainText("ESP32");
  await page.locator('[data-view="top"]').click();
  await expect(page.locator('[data-view="top"]')).toHaveClass("active");
  await page.screenshot({ path: path.join(shots, "top.png") });
  await page.locator("#explode").fill("75");
  await expect(page.locator("#explode-value")).toHaveText("75%");
  await page.locator('[data-view="iso"]').click();
  await page.locator("#guards").uncheck();
  await page.locator("#keepouts").check();
  await page.screenshot({ path: path.join(shots, "exploded.png") });
  await page.locator("#search").fill("nonsense");
  await expect(page.locator("#tree")).toContainText("No matching parts");
  await page.locator("#search").fill("U1");
  await expect(page.locator('[data-part="U1"]')).toHaveClass(
    "part-row selected",
  );
  await page.screenshot({ path: path.join(shots, "selected-search.png") });
  await page.locator("#search").fill("");
  await page.locator("#guards").check();
  await page.locator('[data-part="G1"]').click();
  await page.locator("#guards").uncheck();
  await expect(
    page.getByRole("checkbox", {
      name: "Show G1 Propeller guard",
      exact: true,
    }),
  ).not.toBeChecked();
  await page.screenshot({ path: path.join(shots, "hidden-selection.png") });
  await page
    .getByRole("checkbox", { name: "Show G1 Propeller guard", exact: true })
    .check();
  expect(
    await page
      .locator("#guards")
      .evaluate((e: HTMLInputElement) => e.indeterminate),
  ).toBe(true);
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("drone-v2-assembly.glb");
  await file.saveAs(
    path.resolve("../.impeccable/review/drone-v2-assembly.glb"),
  );
  expect(errors).toEqual([]);
});
test("mobile layout and parts drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#loading")).toBeHidden({ timeout: 45000 });
  await page.screenshot({
    path: path.join(shots, "mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator('[data-view="top"]').click();
  await page.screenshot({ path: path.join(shots, "mobile-top.png") });
  await page.locator("#explode").fill("100");
  await page.locator('[data-view="iso"]').click();
  await page.screenshot({ path: path.join(shots, "mobile-exploded.png") });
  await page.locator("#reset").click();
  await expect(page.locator("#explode-value")).toHaveText("0%");
  await page.screenshot({ path: path.join(shots, "mobile-reset.png") });
  await page.locator("#parts-toggle").click();
  await expect(page.locator("#sidebar")).toBeVisible();
  await page.locator('[data-part="BAT"]').click();
  await expect(page.locator("#selection h3")).toContainText("LiPo");
});
