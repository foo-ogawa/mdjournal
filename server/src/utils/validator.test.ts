/**
 * Validator tests
 */
import { describe, it, expect } from 'vitest';
import { 
  validateReport, 
  formatValidationResult, 
  formatValidationSummary,
  VALIDATION_RULES 
} from './validator.js';

describe('validateReport', () => {
  describe('header validation', () => {
    it('should pass with valid header', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

## [NOTE]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      expect(result.isValid).toBe(true);
      expect(result.summary.errors).toBe(0);
    });

    it('should fail with invalid header', () => {
      const content = `# 日報 2025-01-06

## [PLAN]

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      expect(result.issues.some(i => i.code === 'header-format')).toBe(true);
    });

    it('should extract date from file path', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025/01/2025-01-06.md');
      
      expect(result.date).toBe('2025-01-06');
    });
  });

  describe('section validation', () => {
    it('should warn about missing PLAN section', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [RESULT]

## [TODO]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const planIssue = result.issues.find(i => 
        i.code === 'required-sections' && i.message.includes('PLAN')
      );
      expect(planIssue).toBeDefined();
      expect(planIssue?.severity).toBe('warning');
    });

    it('should warn about missing RESULT section', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [TODO]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const resultIssue = result.issues.find(i => 
        i.code === 'required-sections' && i.message.includes('RESULT')
      );
      expect(resultIssue).toBeDefined();
    });
  });

  describe('separator line detection', () => {
    it('should warn about old separator lines', () => {
      const content = `# [日報] 山田太郎 2025-01-06

====================

## [PLAN]

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const separatorIssue = result.issues.find(i => i.code === 'separator-line');
      expect(separatorIssue).toBeDefined();
      expect(separatorIssue?.severity).toBe('warning');
    });
  });

  describe('schedule item validation', () => {
    it('should accept valid schedule items', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

* 08:30 [P99] タスク確認
* 09:00 [P34] 開発作業
* 12:00

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const formatIssues = result.issues.filter(i => i.code === 'schedule-item-format');
      expect(formatIssues).toHaveLength(0);
    });

    it('should warn about invalid schedule item format', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

* 08:30 タスク確認
* 09:00 開発作業

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const formatIssues = result.issues.filter(i => i.code === 'schedule-item-format');
      expect(formatIssues.length).toBeGreaterThan(0);
    });

    it('should error on invalid time format', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

* 99:99 [P99] 不正な時刻

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const timeIssue = result.issues.find(i => i.code === 'time-format');
      expect(timeIssue).toBeDefined();
      expect(timeIssue?.severity).toBe('error');
    });
  });

  describe('location subsection detection', () => {
    it('should warn about old location subsections', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

### [home]
* 08:30 [P99] タスク

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const locationIssue = result.issues.find(i => i.code === 'location-subsection');
      expect(locationIssue).toBeDefined();
    });
  });

  describe('TODO validation', () => {
    it('should info about asterisk list marker', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

* [ ] タスク

## [NOTE]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const markerIssue = result.issues.find(i => i.code === 'todo-list-marker');
      expect(markerIssue).toBeDefined();
      expect(markerIssue?.severity).toBe('info');
    });

    it('should warn about inline project code (old format)', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

- [ ] [P99] タスク

## [NOTE]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const projectIssue = result.issues.find(i => i.code === 'todo-inline-project');
      expect(projectIssue).toBeDefined();
    });

    it('should warn about bracket deadline format', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

- [ ] タスク（12月末）

## [NOTE]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const deadlineIssue = result.issues.find(i => i.code === 'todo-deadline-format');
      expect(deadlineIssue).toBeDefined();
    });

    it('should warn about nested TODOs', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]

## [TODO]

- [ ] 親タスク
  - [ ] 子タスク

## [NOTE]
`;
      const result = validateReport(content, 'reports/2025-01-06.md');
      
      const nestedIssue = result.issues.find(i => i.code === 'nested-todo');
      expect(nestedIssue).toBeDefined();
    });
  });

  describe('skipRules option', () => {
    it('should skip specified rules', () => {
      const content = `# 不正なヘッダー

## [RESULT]
`;
      const result = validateReport(content, 'reports/2025-01-06.md', {
        skipRules: ['header-format', 'required-sections'],
      });
      
      const headerIssue = result.issues.find(i => i.code === 'header-format');
      expect(headerIssue).toBeUndefined();
    });
  });

  describe('strict mode', () => {
    it('should treat warnings as errors in strict mode', () => {
      const content = `# [日報] 山田太郎 2025-01-06

## [PLAN]

====================

## [RESULT]
`;
      const normalResult = validateReport(content, 'reports/2025-01-06.md');
      const strictResult = validateReport(content, 'reports/2025-01-06.md', { strict: true });
      
      expect(normalResult.isValid).toBe(true); // Only errors matter
      expect(strictResult.isValid).toBe(false); // Warnings also matter
    });
  });
});

describe('formatValidationResult', () => {
  it('should format valid result', () => {
    const result = validateReport(`# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]
`, 'reports/2025-01-06.md');
    
    const formatted = formatValidationResult(result, { color: false });
    
    expect(formatted).toContain('✓');
    expect(formatted).toContain('2025-01-06.md');
  });

  it('should format result with issues', () => {
    const result = validateReport(`# 不正なヘッダー

## [RESULT]
`, 'reports/2025-01-06.md');
    
    const formatted = formatValidationResult(result, { color: false });
    
    expect(formatted).toContain('✗');
    expect(formatted).toContain('header-format');
  });

  it('should include suggestions in verbose mode', () => {
    const result = validateReport(`# 不正なヘッダー

## [RESULT]
`, 'reports/2025-01-06.md');
    
    const formatted = formatValidationResult(result, { color: false, verbose: true });
    
    expect(formatted).toContain('→');
  });
});

describe('formatValidationSummary', () => {
  it('should format summary for multiple results', () => {
    const results = [
      validateReport(`# [日報] 山田太郎 2025-01-06

## [PLAN]

## [RESULT]
`, 'reports/2025-01-06.md'),
      validateReport(`# 不正なヘッダー

## [RESULT]
`, 'reports/2025-01-07.md'),
    ];
    
    const summary = formatValidationSummary(results, { color: false });
    
    expect(summary).toContain('ファイル数: 2');
    expect(summary).toContain('有効: 1');
    expect(summary).toContain('無効: 1');
  });
});

describe('VALIDATION_RULES', () => {
  it('should have all rule codes defined', () => {
    expect(VALIDATION_RULES['header-format']).toBeDefined();
    expect(VALIDATION_RULES['separator-line']).toBeDefined();
    expect(VALIDATION_RULES['schedule-item-format']).toBeDefined();
    expect(VALIDATION_RULES['time-format']).toBeDefined();
    expect(VALIDATION_RULES['required-sections']).toBeDefined();
  });
});

