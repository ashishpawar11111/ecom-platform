// Mock pg pool — tests run without a real database
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockClient = {
  query:   mockQuery,
  release: mockRelease
};
const pool = {
  query:   mockQuery,
  connect: jest.fn().mockResolvedValue(mockClient)
};

module.exports = { pool, mockQuery, mockRelease, mockClient };