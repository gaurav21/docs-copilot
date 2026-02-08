# On-Call Guide

## Overview

This guide covers the on-call responsibilities and procedures for our engineering team.

## On-Call Schedule

- On-call shifts rotate weekly, starting Monday at 9:00 AM local time
- Check the PagerDuty schedule to see who is currently on-call
- Handoff meetings occur every Monday at 9:00 AM

## Responsibilities

### Primary On-Call Engineer

- Respond to all alerts within 15 minutes
- Investigate and resolve incidents
- Escalate to senior engineers if issue persists beyond 1 hour
- Document all incidents in the incident tracking system
- Update status page during major outages

### Secondary On-Call Engineer

- Backup for primary on-call
- Respond if primary doesn't acknowledge within 15 minutes
- Available for consultation on complex issues

## Common Alerts

### High CPU Usage

**Trigger**: CPU usage > 80% for 5 minutes

**Response**:
1. Check application logs for errors
2. Review recent deployments
3. Check for traffic spikes in monitoring dashboard
4. Scale up instances if needed
5. Investigate memory leaks or infinite loops

### Database Connection Errors

**Trigger**: Connection pool exhausted or timeout errors

**Response**:
1. Check database server health
2. Verify connection pool configuration
3. Look for long-running queries
4. Check for database locks
5. Restart application servers if needed

### API Latency

**Trigger**: P95 latency > 2 seconds

**Response**:
1. Check external service dependencies
2. Review database query performance
3. Check cache hit rates
4. Look for N+1 query patterns
5. Enable request tracing for detailed analysis

## Escalation

If you cannot resolve an issue within 1 hour or if it's a critical system-wide outage:

1. Escalate to the engineering manager on-call
2. Create an incident in the incident management system
3. Start an incident bridge for coordination
4. Update stakeholders via Slack #incidents channel

## Tools

- **PagerDuty**: Alert management and on-call scheduling
- **Datadog**: Monitoring and logs
- **Grafana**: Dashboards and visualizations
- **Slack**: Communication (#on-call, #incidents)
- **Runbook Wiki**: Detailed procedures for common issues

## Post-Incident

After resolving an incident:
1. Write a brief incident summary
2. Schedule a post-mortem within 48 hours
3. Update runbooks if new procedures were discovered
4. Create action items to prevent recurrence
