// The API suite spins up Express apps and drives them over real HTTP through
// supertest, which is slower than jest's 5s default allows for on a loaded
// machine. Set here rather than as `testTimeout` in the config: Jest 29
// ignores that key inside a `projects` entry, warns, and leaves the tests
// timing out against a config that looks correct.
jest.setTimeout(20000);
