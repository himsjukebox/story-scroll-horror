import { expect, test } from "@playwright/test";

// Sandbox smoke check only. Headless Chromium with a fake camera and software
// rendering says nothing about phone performance. It proves the spike page
// loads models and wasm from this origin and that both modes produce samples.
for (const mode of ["main", "worker"] as const) {
  test(`spike page runs segmenter in ${mode} mode with no third-party requests`, async ({ page }) => {
    test.setTimeout(120_000);
    const origin = "http://localhost:3000";
    const external: string[] = [];
    const cspErrors: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith(origin) && !url.startsWith("blob:") && !url.startsWith("data:")) external.push(url);
    });
    page.on("console", (msg) => {
      const text = msg.text();
      // MediaPipe tries to send usage telemetry to odml.pa.googleapis.com. The
      // CSP (connect-src 'self') blocks it. That block is wanted, so ignore it.
      if (/content security policy/i.test(text) && !text.includes("odml.pa.googleapis.com")) cspErrors.push(text);
    });

    await page.goto("/spike");
    await expect(page.getByRole("heading", { name: "Performance spike" })).toBeVisible();
    await page.getByLabel("Where inference runs").selectOption(mode);
    await page.getByLabel("Delegate").selectOption("CPU");
    await page.getByLabel("Camera resolution").selectOption("320x240");
    await page.getByRole("button", { name: "Start camera and tasks" }).click();

    const loopRow = page.getByRole("row", { name: /Whole loop iteration/ });
    await expect(async () => {
      const samples = Number((await loopRow.getByRole("cell").first().textContent()) ?? "0");
      expect(samples).toBeGreaterThan(5);
    }).toPass({ timeout: 90_000 });

    await page.getByRole("button", { name: "Markdown row" }).click();
    const row = await page.getByLabel("Result text").inputValue();
    console.log(`SANDBOX SMOKE (headless Chromium, fake camera, CPU, not a device measurement) mode=${mode}:\n${row}`);
    expect(row).toContain("segmenter");

    await page.getByRole("button", { name: "Stop" }).click();
    expect(external).toEqual([]);
    expect(cspErrors).toEqual([]);
  });
}
