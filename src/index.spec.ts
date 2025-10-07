import { useLocalStorage } from "./index";

describe("index (barrel export)", () => {
  it("should export useLocalStorage", () => {
    expect(useLocalStorage).toBeDefined();
    expect(typeof useLocalStorage).toBe("function");
  });
});
