if (typeof process.geteuid !== "function") {
  process.geteuid = () => 0;
}
await import("tsx/esm");
