/**
 * Config Validator tests
 */
import { describe, it, expect } from 'vitest';
import {
  validateRootConfig,
  validateProjectsConfig,
  validateRoutinesConfig,
  formatValidationResults,
  type ConfigValidationResult,
} from './configValidator.js';

describe('validateRootConfig', () => {
  it('should pass with valid config', () => {
    const config = {
      projects: './config/projects.yaml',
      routines: './config/routines.yaml',
      reports: './reports',
    };

    const errors = validateRootConfig(config, 'mdjournal.config.yaml');

    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should error when reports is missing', () => {
    const config = {
      projects: './config/projects.yaml',
    };

    const errors = validateRootConfig(config, 'mdjournal.config.yaml');

    expect(errors.some(e => e.path === 'reports' && e.severity === 'error')).toBe(true);
  });

  it('should error when projects is missing', () => {
    const config = {
      reports: './reports',
    };

    const errors = validateRootConfig(config, 'mdjournal.config.yaml');

    expect(errors.some(e => e.path === 'projects' && e.severity === 'error')).toBe(true);
  });

  describe('timeline validation', () => {
    it('should warn when hourHeight is out of range', () => {
      const config = {
        projects: './config/projects.yaml',
        reports: './reports',
        timeline: { hourHeight: 10 }, // Below 20
      };

      const errors = validateRootConfig(config, 'mdjournal.config.yaml');

      expect(errors.some(e => e.path === 'timeline.hourHeight' && e.severity === 'warning')).toBe(true);
    });

    it('should error when defaultStartHour is out of range', () => {
      const config = {
        projects: './config/projects.yaml',
        reports: './reports',
        timeline: { defaultStartHour: 25 },
      };

      const errors = validateRootConfig(config, 'mdjournal.config.yaml');

      expect(errors.some(e => e.path === 'timeline.defaultStartHour' && e.severity === 'error')).toBe(true);
    });

    it('should error when defaultEndHour is out of range', () => {
      const config = {
        projects: './config/projects.yaml',
        reports: './reports',
        timeline: { defaultEndHour: 30 },
      };

      const errors = validateRootConfig(config, 'mdjournal.config.yaml');

      expect(errors.some(e => e.path === 'timeline.defaultEndHour' && e.severity === 'error')).toBe(true);
    });

    it('should warn when snapMinutes is not a recommended value', () => {
      const config = {
        projects: './config/projects.yaml',
        reports: './reports',
        timeline: { snapMinutes: 7 }, // Not in [1, 5, 10, 15, 30, 60]
      };

      const errors = validateRootConfig(config, 'mdjournal.config.yaml');

      expect(errors.some(e => e.path === 'timeline.snapMinutes' && e.severity === 'warning')).toBe(true);
    });

    it('should accept valid timeline config', () => {
      const config = {
        projects: './config/projects.yaml',
        reports: './reports',
        timeline: {
          hourHeight: 60,
          defaultStartHour: 8,
          defaultEndHour: 20,
          snapMinutes: 15,
        },
      };

      const errors = validateRootConfig(config, 'mdjournal.config.yaml');

      const timelineErrors = errors.filter(e => e.path.startsWith('timeline'));
      expect(timelineErrors).toHaveLength(0);
    });
  });
});

describe('validateProjectsConfig', () => {
  it('should pass with valid projects', () => {
    const config = {
      projects: [
        { code: 'P99', name: 'テストプロジェクト', color: '#FF0000' },
        { code: 'P34', name: '開発プロジェクト', color: '#00FF00' },
      ],
    };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should error when projects is missing', () => {
    const config = {};

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.path === 'projects' && e.severity === 'error')).toBe(true);
  });

  it('should error when projects is not an array', () => {
    const config = { projects: 'invalid' };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.path === 'projects' && e.severity === 'error')).toBe(true);
  });

  it('should error when projects is empty', () => {
    const config = { projects: [] };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.severity === 'error')).toBe(true);
  });

  it('should error when project code is missing', () => {
    const config = {
      projects: [{ name: 'テスト', color: '#FF0000' }],
    };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.path.includes('code') && e.severity === 'error')).toBe(true);
  });

  it('should error when project name is missing', () => {
    const config = {
      projects: [{ code: 'P99', color: '#FF0000' }],
    };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.path.includes('name') && e.severity === 'error')).toBe(true);
  });

  it('should error on duplicate project codes', () => {
    const config = {
      projects: [
        { code: 'P99', name: 'テスト1', color: '#FF0000' },
        { code: 'P99', name: 'テスト2', color: '#00FF00' },
      ],
    };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.message.includes('重複'))).toBe(true);
  });

  it('should warn on invalid color format', () => {
    const config = {
      projects: [
        { code: 'P99', name: 'テスト', color: 'red' },
      ],
    };

    const errors = validateProjectsConfig(config, 'projects.yaml');

    expect(errors.some(e => e.path.includes('color') && e.severity === 'warning')).toBe(true);
  });
});

describe('validateRoutinesConfig', () => {
  const projectCodes = new Set(['P99', 'P34']);

  it('should pass with valid routines', () => {
    const config = {
      routines: {
        weekly: {
          monday: [
            { time: '09:00', project: 'P99', task: '朝礼' },
          ],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
  });

  it('should error when routines is missing', () => {
    const config = {};

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path === 'routines' && e.severity === 'error')).toBe(true);
  });

  it('should warn on invalid day name', () => {
    const config = {
      routines: {
        weekly: {
          lunedi: [{ time: '09:00', project: 'P99', task: '朝礼' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.severity === 'warning' && e.message.includes('lunedi'))).toBe(true);
  });

  it('should error when weekly routine is not an array', () => {
    const config = {
      routines: {
        weekly: {
          monday: 'invalid',
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.severity === 'error' && e.message.includes('配列'))).toBe(true);
  });

  it('should error when time is missing in routine item', () => {
    const config = {
      routines: {
        weekly: {
          monday: [{ project: 'P99', task: '朝礼' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path.includes('time') && e.severity === 'error')).toBe(true);
  });

  it('should error on invalid time format', () => {
    const config = {
      routines: {
        weekly: {
          monday: [{ time: 'morning', project: 'P99', task: '朝礼' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path.includes('time') && e.severity === 'error')).toBe(true);
  });

  it('should error when project is missing', () => {
    const config = {
      routines: {
        weekly: {
          monday: [{ time: '09:00', task: '朝礼' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path.includes('project') && e.severity === 'error')).toBe(true);
  });

  it('should warn when project code does not exist', () => {
    const config = {
      routines: {
        weekly: {
          monday: [{ time: '09:00', project: 'UNKNOWN', task: '朝礼' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path.includes('project') && e.severity === 'warning')).toBe(true);
  });

  it('should error when task is missing', () => {
    const config = {
      routines: {
        weekly: {
          monday: [{ time: '09:00', project: 'P99' }],
        },
      },
    };

    const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

    expect(errors.some(e => e.path.includes('task') && e.severity === 'error')).toBe(true);
  });

  describe('monthly routines', () => {
    it('should validate start_of_month routines', () => {
      const config = {
        routines: {
          monthly: {
            start_of_month: [{ project: 'P99', task: '月初処理' }],
          },
        },
      };

      const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should error when monthly routine project is missing', () => {
      const config = {
        routines: {
          monthly: {
            start_of_month: [{ task: '月初処理' }],
          },
        },
      };

      const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

      expect(errors.some(e => e.path.includes('project') && e.severity === 'error')).toBe(true);
    });

    it('should error when monthly routine task is missing', () => {
      const config = {
        routines: {
          monthly: {
            end_of_month: [{ project: 'P99' }],
          },
        },
      };

      const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

      expect(errors.some(e => e.path.includes('task') && e.severity === 'error')).toBe(true);
    });

    it('should warn when monthly routine project does not exist', () => {
      const config = {
        routines: {
          monthly: {
            end_of_month: [{ project: 'UNKNOWN', task: '月末処理' }],
          },
        },
      };

      const errors = validateRoutinesConfig(config, 'routines.yaml', projectCodes);

      expect(errors.some(e => e.path.includes('project') && e.severity === 'warning')).toBe(true);
    });
  });
});

describe('formatValidationResults', () => {
  it('should format success result', () => {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const formatted = formatValidationResults(result);

    expect(formatted).toContain('✓');
    expect(formatted).toContain('バリデーションが完了');
  });

  it('should format errors', () => {
    const result: ConfigValidationResult = {
      valid: false,
      errors: [
        {
          file: 'config.yaml',
          path: 'reports',
          message: 'reportsが指定されていません',
          severity: 'error',
        },
      ],
      warnings: [],
    };

    const formatted = formatValidationResults(result);

    expect(formatted).toContain('エラー');
    expect(formatted).toContain('reportsが指定されていません');
    expect(formatted).toContain('config.yaml');
  });

  it('should format warnings', () => {
    const result: ConfigValidationResult = {
      valid: true,
      errors: [],
      warnings: [
        {
          file: 'config.yaml',
          path: 'timeline.hourHeight',
          message: '推奨範囲外です',
          severity: 'warning',
        },
      ],
    };

    const formatted = formatValidationResults(result);

    expect(formatted).toContain('警告');
    expect(formatted).toContain('推奨範囲外');
  });

  it('should format both errors and warnings', () => {
    const result: ConfigValidationResult = {
      valid: false,
      errors: [
        {
          file: 'config.yaml',
          path: 'reports',
          message: 'エラーメッセージ',
          severity: 'error',
        },
      ],
      warnings: [
        {
          file: 'config.yaml',
          path: 'timeline',
          message: '警告メッセージ',
          severity: 'warning',
        },
      ],
    };

    const formatted = formatValidationResults(result);

    expect(formatted).toContain('エラー');
    expect(formatted).toContain('警告');
  });
});

