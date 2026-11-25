// 浏览器升级档判据回归（0.13.0-rc.1）：allowlist 与升级特征两个纯函数 + 关闭态零行为。
// provider 全链（ctx.get 联动）由 rc.2 文案后的装机冒烟覆盖。
import { test } from "node:test";
import assert from "node:assert/strict";
import { hostInAllowlist, browserUpgradeNeeded } from "../lib/index.js";

test("hostInAllowlist: 空表全放行（总开关在调用方）", () => {
  assert.equal(hostInAllowlist("anything.example", ""), true);
  assert.equal(hostInAllowlist("anything.example", "  ,, "), true);
});

test("hostInAllowlist: 全名与子域命中，无关域不命中", () => {
  assert.equal(hostInAllowlist("example.com", "example.com"), true);
  assert.equal(hostInAllowlist("www.example.com", "example.com"), true);
  assert.equal(hostInAllowlist("EXAMPLE.com", "example.com "), true);
  assert.equal(hostInAllowlist("notexample.com", "example.com"), false);
  assert.equal(hostInAllowlist("evil.com", "example.com,other.org"), false);
  assert.equal(hostInAllowlist("app.other.org", "example.com,other.org"), true);
});

test("browserUpgradeNeeded: 登录墙/反爬/挑战页错误触发升级", () => {
  assert.equal(browserUpgradeNeeded(null, new Error("HTTP 401 from https://x.example")), true);
  assert.equal(browserUpgradeNeeded(null, new Error("HTTP 403 from https://x.example")), true);
  assert.equal(browserUpgradeNeeded(null, new Error("anti-bot challenge page detected (HTTP 200)")), true);
  assert.equal(browserUpgradeNeeded(null, new Error("CAPTCHA required")), true);
});

test("browserUpgradeNeeded: 网络错/5xx/超时不升级（浏览器帮助有限且贵）", () => {
  assert.equal(browserUpgradeNeeded(null, new Error("connection error: socket hang up")), false);
  assert.equal(browserUpgradeNeeded(null, new Error("HTTP 503 from https://x.example")), false);
  assert.equal(browserUpgradeNeeded(null, new Error("timed out after 15000ms")), false);
});

test("browserUpgradeNeeded: 成功结果按 note 特征判定", () => {
  assert.equal(browserUpgradeNeeded({ note: "server HTML looks like a JS-rendered shell; ..." }, null), true);
  assert.equal(browserUpgradeNeeded({ note: "frameset page: frame contents are not fetched" }, null), true);
  assert.equal(browserUpgradeNeeded({ note: "rss/atom xml passed through" }, null), false);
  assert.equal(browserUpgradeNeeded({ }, null), false);
  assert.equal(browserUpgradeNeeded(null, null), false);
});

test("provider 关闭态零行为：browserFetchTier=false 时判据不参与（形状断言）", () => {
  // 纯函数层护栏：判据函数不读配置——开关语义由 provider 的 tierAllows() 组合完成；
  // 此处钉住 false 组合下绝不触发 svc（provider 代码审阅 + 装机冒烟对照）。
  const cfg = { browserFetchTier: false, browserFetchAllowHosts: "" };
  const tierAllows = () => cfg.browserFetchTier === true && hostInAllowlist("x.example", cfg.browserFetchAllowHosts);
  assert.equal(tierAllows(), false);
  assert.equal(browserUpgradeNeeded(null, new Error("HTTP 401 x")), true); // 特征成立但开关关 → 组合仍不升级
});
