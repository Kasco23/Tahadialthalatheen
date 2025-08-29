# Production Deployment Checklist - Authentication Integration

## Overview

This checklist ensures safe deployment of the Supabase authentication integration upgrade to production. Follow each step carefully to minimize risk and ensure smooth migration.

## Pre-Deployment Checklist

### 🔐 Database Security Validation

- [ ] **Verify RLS Policies**: Confirm all permissive policies have been replaced with secure auth-based policies
- [ ] **Test Anonymous Access**: Ensure anonymous users can still access waiting games appropriately
- [ ] **Test Authenticated Access**: Verify authenticated users can only access their games and games they're participating in
- [ ] **Validate Foreign Key Constraints**: Confirm host_id and user_id constraints work correctly with cascade deletion

### 📊 Schema Migration Verification

- [ ] **Backup Production Database**: Create full backup before migration
- [ ] **Test Migration Locally**: Run migration on local database copy
- [ ] **Validate New Columns**: Ensure all new auth columns (host_id, user_id, status, last_activity, is_host, session_id) are added correctly
- [ ] **Check Data Integrity**: Verify existing data remains intact after migration
- [ ] **Test Rollback Procedure**: Confirm ability to rollback migration if needed

### 🛠️ Function Deployment Validation

- [ ] **Test Create Game Function**: Verify create-game.ts works with authentication
- [ ] **Test Join Game Function**: Ensure join-game.ts handles both auth and anonymous users
- [ ] **Test Secure Event Handler**: Validate game-event-secure.ts works correctly
- [ ] **Test Updated Functions**: Verify create-daily-room.ts, daily-diagnostics.ts, supabase-health.ts work with auth context
- [ ] **Validate Environment Variables**: Ensure all required environment variables are configured in production

### 📈 Monitoring and Error Tracking

- [ ] **Sentry Configuration**: Verify Sentry DSN is configured for production functions
- [ ] **Test Error Tracking**: Confirm authentication errors are properly captured
- [ ] **Monitor Performance**: Set up alerts for authentication operation performance
- [ ] **Dashboard Setup**: Create monitoring dashboard for auth events and database operations

### 🧪 Testing Strategy

- [ ] **End-to-End Tests**: Run comprehensive tests covering all user flows
- [ ] **Security Tests**: Verify unauthorized access attempts are properly blocked
- [ ] **Performance Tests**: Ensure authentication doesn't significantly impact response times
- [ ] **Backward Compatibility**: Test that existing anonymous functionality still works

## Deployment Steps

### Phase 1: Database Migration (Low Risk)

1. [ ] **Create Production Backup**

   ```sql
   -- Create backup of current production state
   pg_dump --clean --if-exists --no-owner --no-privileges production_db > backup_pre_auth_$(date +%Y%m%d_%H%M%S).sql
   ```

2. [ ] **Apply Schema Migration**

   ```bash
   pnpm supabase db push --linked
   ```

3. [ ] **Verify Migration Success**

   ```bash
   # Test schema validation
   node test-schema-validation.js
   ```

4. [ ] **Monitor Database Health**
   - Check RLS policy enforcement
   - Verify foreign key constraints
   - Validate new column creation

### Phase 2: Function Deployment (Medium Risk)

1. [ ] **Deploy Authentication Utilities**
   - Deploy `_auth.ts` and `_authMonitoring.ts`
   - Verify no breaking changes to existing functions

2. [ ] **Deploy Updated Functions** (in order)
   - Deploy `create-game.ts` (requires authentication)
   - Deploy `join-game.ts` (supports both auth and anonymous)
   - Deploy `game-event-secure.ts` (new secure endpoint)
   - Deploy `create-daily-room.ts`, `daily-diagnostics.ts`, `supabase-health.ts`

3. [ ] **Update Function Routes**
   - Add deprecation notice to legacy `game-event.ts`
   - Update frontend to use secure endpoints gradually

4. [ ] **Test Live Functions**
   ```bash
   # Test each function with curl or integration tests
   curl -X POST https://yoursite.netlify.app/.netlify/functions/create-game \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${AUTH_TOKEN}" \
     -d '{"gameId":"TEST","hostCode":"TEST-HOST"}'
   ```

### Phase 3: Monitoring and Validation (Low Risk)

1. [ ] **Enable Enhanced Monitoring**
   - Activate Sentry auth monitoring
   - Set up performance tracking
   - Configure security event alerts

2. [ ] **Gradual Rollout**
   - Start with small percentage of traffic
   - Monitor error rates and performance
   - Gradually increase to 100%

3. [ ] **User Communication**
   - Notify users of enhanced security features
   - Provide migration guide for API consumers
   - Update documentation

## Rollback Procedures

### Immediate Rollback (if critical issues detected)

1. [ ] **Revert Function Deployments**

   ```bash
   # Revert to previous function versions
   git revert <deployment-commit>
   netlify deploy --prod
   ```

2. [ ] **Restore Database** (if data corruption detected)

   ```bash
   # Restore from backup (LAST RESORT)
   psql production_db < backup_pre_auth_YYYYMMDD_HHMMSS.sql
   ```

3. [ ] **Disable New Features**
   - Switch traffic back to legacy endpoints
   - Disable authentication requirements temporarily

### Partial Rollback (for specific functions)

1. [ ] **Individual Function Rollback**

   ```bash
   # Revert specific function
   git checkout HEAD~1 -- netlify/functions/problematic-function.ts
   netlify deploy --prod
   ```

2. [ ] **Route Traffic to Legacy Functions**
   - Update load balancer rules
   - Use feature flags to disable new functionality

## Post-Deployment Monitoring

### First 24 Hours

- [ ] **Monitor Error Rates**: Watch for authentication-related errors
- [ ] **Check Performance Metrics**: Ensure response times are acceptable
- [ ] **Validate User Reports**: Monitor support channels for issues
- [ ] **Review Security Logs**: Check for unauthorized access attempts

### First Week

- [ ] **Analyze Usage Patterns**: Review authentication adoption rates
- [ ] **Performance Optimization**: Identify and fix any bottlenecks
- [ ] **User Feedback**: Collect and address user experience issues
- [ ] **Security Review**: Validate that security improvements are working

### First Month

- [ ] **Comprehensive Review**: Full assessment of authentication integration
- [ ] **Documentation Updates**: Update all relevant documentation
- [ ] **Team Training**: Ensure team understands new authentication patterns
- [ ] **Legacy Cleanup**: Plan removal of deprecated functions and policies

## Success Criteria

✅ **Security Enhanced**

- All permissive RLS policies replaced
- No unauthorized access to restricted resources
- Proper user isolation enforced

✅ **Functionality Maintained**

- All existing features work as expected
- Anonymous users can still join games
- No breaking changes for existing users

✅ **Performance Acceptable**

- Response times within 10% of baseline
- No significant increase in error rates
- Database performance maintained

✅ **Monitoring Active**

- Authentication events properly tracked
- Security violations detected and alerted
- Performance metrics collected

## Emergency Contacts

- **Database Admin**: [Contact Information]
- **DevOps Lead**: [Contact Information]
- **Security Team**: [Contact Information]
- **Product Owner**: [Contact Information]

## Documentation Links

- [Authentication Integration Summary](./AUTHENTICATION_INTEGRATION_SUMMARY.md)
- [Supabase Implementation Guide](./supabase.md)
- [Function Security Patterns](./REFERENCE.md)

---

**Deployment Date**: **\*\***\_**\*\***
**Deployed By**: **\*\***\_**\*\***
**Reviewed By**: **\*\***\_**\*\***
**Status**: [ ] Success [ ] Partial [ ] Rollback Required
