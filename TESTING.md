# Testing Guide

## Overview

This project uses Jest as the testing framework with comprehensive unit and integration tests.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and environment setup
├── __mocks__/                  # Mock implementations
│   ├── chromadb.ts            # ChromaDB mock
│   └── langchain.ts           # LangChain components mock
├── fixtures/                   # Test data
│   └── docs/                  # Sample documents for testing
├── unit/                       # Unit tests
│   ├── config.test.ts         # Configuration tests
│   ├── ingestion.test.ts      # Ingestion service tests
│   ├── retrieval.test.ts      # Retrieval service tests
│   └── workflow.test.ts       # Workflow tests
└── integration/                # Integration tests
    └── api.test.ts            # API endpoint tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in CI mode
```bash
npm run test:ci
```

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:
- `coverage/lcov-report/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format

Target coverage: 80%+ for all metrics

## Writing Tests

### Unit Test Example

```typescript
import { MyService } from '../../src/services/my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import { app } from '../../src/index';

describe('GET /endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app).get('/endpoint');
    expect(response.status).toBe(200);
  });
});
```

## Test Guidelines

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to set up fresh state
- Don't rely on test execution order

### 2. Mocking
- Mock external services (ChromaDB, OpenRouter)
- Mock file system operations
- Use jest.mock() for module mocking

### 3. Assertions
- Test both success and error cases
- Verify edge cases
- Check data types and structure

### 4. Naming
- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests with describe blocks

### 5. Coverage
- Aim for 80%+ code coverage
- Test all public APIs
- Include error handling tests

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Multiple Node.js versions (18.x, 20.x)

See `.github/workflows/test.yml` for CI configuration.

## Debugging Tests

### Run specific test file
```bash
npm test -- tests/unit/config.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should retrieve documents"
```

### Debug with verbose output
```bash
npm test -- --verbose
```

### Debug in VSCode
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Tests timing out
- Increase timeout in jest.config.js
- Check for unresolved promises
- Ensure async operations complete

### Mock not working
- Ensure mock is defined before import
- Use `jest.clearAllMocks()` in beforeEach
- Check mock implementation

### Coverage not updating
- Delete coverage directory
- Run with `--no-cache` flag
- Check .gitignore for coverage exclusions

## Maintenance

### When adding new features
1. Write tests first (TDD approach)
2. Ensure tests pass before committing
3. Update test documentation if needed
4. Maintain coverage above 80%

### When modifying code
1. Run affected tests
2. Update tests to match changes
3. Ensure all tests still pass
4. Check coverage hasn't decreased

### Regular maintenance
- Review and update mocks
- Remove obsolete tests
- Refactor duplicate test code
- Update test dependencies

## Test Data

Test fixtures are located in `tests/fixtures/`:
- Sample markdown documents
- Mock API responses
- Configuration files

Keep test data minimal and focused on specific test scenarios.

## Performance

- Unit tests should run in < 5 seconds
- Integration tests should run in < 30 seconds
- Use `--maxWorkers=2` in CI to limit parallelism

## Security

- Never commit real API keys in tests
- Use mock data for sensitive information
- Sanitize test outputs in CI logs
