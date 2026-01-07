import { sanitizeForLog, computeDiff } from '../../modules/activity-log/utils/sanitize.util';

describe('sanitizeForLog', () => {
  describe('Secret Masking', () => {
    it('should mask password fields', () => {
      const input = {
        username: 'testuser',
        password: 'secret123',
        userPassword: 'secret456',
      };

      const result = sanitizeForLog(input);

      expect(result.username).toBe('testuser');
      expect(result.password).toBe('[MASKED_SECRET]');
      expect(result.userPassword).toBe('[MASKED_SECRET]');
    });

    it('should mask token fields', () => {
      const input = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh123',
        authorization: 'Bearer token123',
      };

      const result = sanitizeForLog(input);

      expect(result.accessToken).toBe('[MASKED_SECRET]');
      expect(result.refreshToken).toBe('[MASKED_SECRET]');
      expect(result.authorization).toBe('[MASKED_SECRET]');
    });

    it('should mask API keys and secrets', () => {
      const input = {
        apiKey: 'sk_test_123456',
        secret: 'my_secret_value',
        clientSecret: 'secret789',
      };

      const result = sanitizeForLog(input);

      expect(result.apiKey).toBe('[MASKED_SECRET]');
      expect(result.secret).toBe('[MASKED_SECRET]');
      expect(result.clientSecret).toBe('[MASKED_SECRET]');
    });

    it('should mask payment card data', () => {
      const input = {
        cardNumber: '4111111111111111',
        cvv: '123',
        iban: 'TR330006100519786457841326',
      };

      const result = sanitizeForLog(input);

      expect(result.cardNumber).toBe('[MASKED_SECRET]');
      expect(result.cvv).toBe('[MASKED_SECRET]');
      expect(result.iban).toBe('[MASKED_SECRET]');
    });

    it('should mask nested secrets', () => {
      const input = {
        user: {
          email: 'test@example.com',
          password: 'secret123',
          profile: {
            name: 'Test User',
            apiKey: 'key123',
          },
        },
      };

      const result = sanitizeForLog(input);

      expect(result.user.email).toContain('*'); // PII masked
      expect(result.user.password).toBe('[MASKED_SECRET]');
      expect(result.user.profile.name).toBe('Test User');
      expect(result.user.profile.apiKey).toBe('[MASKED_SECRET]');
    });

    it('should mask secrets in arrays', () => {
      const input = {
        users: [
          { email: 'user1@example.com', password: 'pass1' },
          { email: 'user2@example.com', password: 'pass2' },
        ],
      };

      const result = sanitizeForLog(input);

      expect(result.users[0].password).toBe('[MASKED_SECRET]');
      expect(result.users[1].password).toBe('[MASKED_SECRET]');
    });
  });

  describe('PII Masking', () => {
    it('should partially mask email addresses', () => {
      const input = {
        email: 'test@example.com',
        contactEmail: 'contact@domain.com',
      };

      const result = sanitizeForLog(input);

      expect(result.email).toContain('*');
      expect(result.email).not.toBe('test@example.com');
      expect(result.contactEmail).toContain('*');
    });

    it('should partially mask phone numbers', () => {
      const input = {
        phone: '+905551234567',
        mobilePhone: '05551234567',
      };

      const result = sanitizeForLog(input);

      expect(result.phone).toContain('*');
      expect(result.phone).not.toBe('+905551234567');
      expect(result.mobilePhone).toContain('*');
    });

    it('should mask ID numbers', () => {
      const input = {
        idNumber: '12345678901',
        passportNumber: 'AB1234567',
      };

      const result = sanitizeForLog(input);

      expect(result.idNumber).toContain('*');
      expect(result.passportNumber).toContain('*');
    });

    it('should allow disabling PII masking', () => {
      const input = {
        email: 'test@example.com',
        password: 'secret123',
      };

      const result = sanitizeForLog(input, { maskPII: false });

      expect(result.email).toBe('test@example.com'); // Not masked
      expect(result.password).toBe('[MASKED_SECRET]'); // Still masked (secret)
    });
  });

  describe('Depth Limiting', () => {
    it('should limit nesting depth', () => {
      const input: any = { level: 1 };
      let current = input;
      for (let i = 2; i <= 10; i++) {
        current.next = { level: i };
        current = current.next;
      }

      const result: any = sanitizeForLog(input);

      // Should truncate at max depth
      expect(result.level).toBe(1);
      expect(result.next.level).toBe(2);
      // Eventually should hit max depth
      let depth = 0;
      let curr = result;
      while (curr && depth < 10) {
        if (curr === '[MAX_DEPTH_EXCEEDED]') break;
        curr = curr.next;
        depth++;
      }
      expect(depth).toBeLessThan(10); // Should hit limit before level 10
    });
  });

  describe('Size Limiting', () => {
    it('should truncate large payloads', () => {
      const largeString = 'a'.repeat(20000); // 20KB
      const input = {
        data: largeString,
        other: 'value',
      };

      const result: any = sanitizeForLog(input);

      const stringified = JSON.stringify(result);
      // Should be truncated (max 10KB + truncation message)
      expect(stringified.length).toBeLessThan(15000);
    });

    it('should handle large nested objects', () => {
      const largeObject: any = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`.repeat(50);
      }

      const result = sanitizeForLog(largeObject);
      const stringified = JSON.stringify(result);

      // Should be truncated
      expect(stringified.length).toBeLessThan(15000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined', () => {
      expect(sanitizeForLog(null)).toBeNull();
      expect(sanitizeForLog(undefined)).toBeUndefined();
    });

    it('should handle primitive types', () => {
      expect(sanitizeForLog('string')).toBe('string');
      expect(sanitizeForLog(123)).toBe(123);
      expect(sanitizeForLog(true)).toBe(true);
    });

    it('should handle arrays', () => {
      const input = [1, 2, { password: 'secret' }];
      const result: any = sanitizeForLog(input);

      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
      expect(result[2].password).toBe('[MASKED_SECRET]');
    });

    it('should handle dates', () => {
      const date = new Date('2024-01-07');
      const input = { createdAt: date };

      const result = sanitizeForLog(input);

      expect(result.createdAt).toEqual(date);
    });

    it('should not modify original object', () => {
      const input = {
        password: 'secret123',
        email: 'test@example.com',
      };

      const originalPassword = input.password;
      const originalEmail = input.email;

      sanitizeForLog(input);

      expect(input.password).toBe(originalPassword);
      expect(input.email).toBe(originalEmail);
    });
  });
});

describe('computeDiff', () => {
  it('should compute diff for changed fields', () => {
    const before = {
      name: 'John',
      age: 30,
      city: 'Istanbul',
    };

    const after = {
      name: 'John',
      age: 31,
      city: 'Ankara',
    };

    const diff: any = computeDiff(before, after);

    expect(diff).toBeDefined();
    expect(diff.name).toBeUndefined(); // Not changed
    expect(diff.age).toBe(31);
    expect(diff.city).toBe('Ankara');
  });

  it('should include added fields', () => {
    const before = {
      name: 'John',
    };

    const after = {
      name: 'John',
      age: 30,
    };

    const diff: any = computeDiff(before, after);

    expect(diff).toBeDefined();
    expect(diff.age).toBe(30);
  });

  it('should include removed fields as null', () => {
    const before = {
      name: 'John',
      age: 30,
    };

    const after = {
      name: 'John',
    };

    const diff: any = computeDiff(before, after);

    expect(diff).toBeDefined();
    expect(diff.age).toBeNull();
  });

  it('should return null if no changes', () => {
    const before = {
      name: 'John',
      age: 30,
    };

    const after = {
      name: 'John',
      age: 30,
    };

    const diff = computeDiff(before, after);

    expect(diff).toBeNull();
  });

  it('should sanitize diff output', () => {
    const before = {
      username: 'john',
      password: 'old_password',
    };

    const after = {
      username: 'john',
      password: 'new_password',
    };

    const diff: any = computeDiff(before, after);

    expect(diff).toBeDefined();
    expect(diff.password).toBe('[MASKED_SECRET]');
  });

  it('should handle non-object inputs', () => {
    expect(computeDiff('string', 'string')).toBeNull();
    expect(computeDiff(null, null)).toBeNull();
    expect(computeDiff(undefined, {})).toBeNull();
  });

  it('should handle nested object changes', () => {
    const before = {
      user: {
        profile: {
          age: 30,
        },
      },
    };

    const after = {
      user: {
        profile: {
          age: 31,
        },
      },
    };

    const diff: any = computeDiff(before, after);

    expect(diff).toBeDefined();
    expect(diff.user).toBeDefined();
  });
});

