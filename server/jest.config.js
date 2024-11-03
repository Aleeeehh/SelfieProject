/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
    testEnvironment: "node",
    transform: {
        "\\.[jt]sx?$": ["ts-jest", { useESM: true }],
    },
    extensionsToTreatAsEsm: [".ts"],
    roots: ["<rootDir>"],
    testRegex: ".*\\.spec\\.ts$",
    moduleFileExtensions: ["ts", "js", "json", "node"],
    resolver: "ts-jest-resolver",
    bail: true,
};
