# Authentication Service Runbook

## Service Overview

The Authentication Service handles user login, registration, JWT token generation, and session management.

**Service URL**: https://auth.example.com
**Health Check**: https://auth.example.com/health
**Monitoring Dashboard**: https://grafana.example.com/d/auth-service

## Architecture

- **Technology**: Node.js, Express, PostgreSQL, Redis
- **Authentication Method**: JWT tokens with refresh tokens
- **Session Storage**: Redis
- **Database**: PostgreSQL for user data

## Common Issues

### Issue: Users Cannot Log In

**Symptoms**:
- Login endpoint returning 500 errors
- Users reporting "Authentication failed" messages

**Diagnosis**:
1. Check auth service health endpoint
2. Verify PostgreSQL connection
3. Check Redis connection for session storage
4. Review application logs for specific error messages
5. Test login with test credentials

**Resolution**:
```bash
# Check service status
curl https://auth.example.com/health

# Check database connection
psql -h db.example.com -U auth_user -d auth_db -c "SELECT 1;"

# Check Redis connection
redis-cli -h redis.example.com ping

# Restart service if needed
kubectl rollout restart deployment/auth-service -n production
```

### Issue: Token Validation Failing

**Symptoms**:
- API requests returning 401 Unauthorized
- Token expired errors appearing prematurely

**Diagnosis**:
1. Check JWT secret configuration
2. Verify token expiration settings
3. Check system time synchronization across servers
4. Review token generation logs

**Resolution**:
1. Verify JWT_SECRET environment variable is set correctly
2. Check TOKEN_EXPIRY is configured (default: 15 minutes)
3. Ensure REFRESH_TOKEN_EXPIRY is set (default: 7 days)
4. Restart service to pick up new configuration

### Issue: High Authentication Latency

**Symptoms**:
- Login requests taking > 2 seconds
- Users reporting slow login experience

**Diagnosis**:
1. Check database query performance
2. Review bcrypt rounds configuration
3. Check for database connection pool exhaustion
4. Review Redis performance

**Resolution**:
```bash
# Check slow queries
SELECT * FROM pg_stat_statements
WHERE query LIKE '%users%'
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check Redis latency
redis-cli --latency -h redis.example.com

# Scale up service if needed
kubectl scale deployment/auth-service --replicas=5 -n production
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/auth_db
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://redis.example.com:6379
REDIS_TTL=3600

# JWT
JWT_SECRET=your-secret-key
TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15m
```

## Monitoring

### Key Metrics

- **Login Success Rate**: Should be > 98%
- **Token Generation Time**: Should be < 500ms
- **Database Query Time**: Should be < 100ms
- **Redis Operation Time**: Should be < 10ms

### Alerts

- Login failure rate > 5% for 5 minutes
- Authentication latency P95 > 2 seconds
- Database connection pool exhausted
- Redis connection errors

## Security Procedures

### Responding to Suspicious Activity

1. Check for unusual login patterns
2. Review failed login attempts
3. Check for brute force attacks
4. Enable rate limiting if needed
5. Block suspicious IP addresses

### Password Reset

1. User requests password reset at /auth/forgot-password
2. System sends email with reset token (expires in 1 hour)
3. User submits new password with token at /auth/reset-password
4. All existing sessions are invalidated

## Database Maintenance

### User Cleanup

Inactive users (no login in 2 years) should be archived:

```sql
-- Find inactive users
SELECT id, email, last_login_at
FROM users
WHERE last_login_at < NOW() - INTERVAL '2 years';

-- Archive users (run during maintenance window)
INSERT INTO users_archived SELECT * FROM users
WHERE last_login_at < NOW() - INTERVAL '2 years';

DELETE FROM users
WHERE last_login_at < NOW() - INTERVAL '2 years';
```

## Deployment

### Rolling Deploy

```bash
# Deploy new version
kubectl set image deployment/auth-service auth-service=auth-service:v1.2.3 -n production

# Monitor rollout
kubectl rollout status deployment/auth-service -n production

# Rollback if needed
kubectl rollout undo deployment/auth-service -n production
```

## Contact

- **Team**: Identity & Access Management
- **Slack**: #iam-team
- **On-Call**: PagerDuty "IAM On-Call"
