# Incident Report Template

## Incident Information

**Incident ID**: INC-YYYY-NNNN
**Date**: YYYY-MM-DD
**Time Started**: HH:MM UTC
**Time Resolved**: HH:MM UTC
**Duration**: X hours Y minutes
**Severity**: Critical / High / Medium / Low
**Status**: Investigating / Identified / Monitoring / Resolved

## Summary

A brief 2-3 sentence summary of what happened, the impact, and the resolution.

## Impact

**Services Affected**:
- Service Name 1
- Service Name 2

**User Impact**:
- Number of users affected
- Geographic regions impacted
- Functionality unavailable
- Degraded performance details

**Business Impact**:
- Revenue impact (if applicable)
- SLA violations
- Customer complaints received
- PR/reputation considerations

## Timeline

All times in UTC.

**YYYY-MM-DD HH:MM** - Initial detection / alert triggered
**YYYY-MM-DD HH:MM** - On-call engineer notified
**YYYY-MM-DD HH:MM** - Incident declared, investigation started
**YYYY-MM-DD HH:MM** - Root cause identified
**YYYY-MM-DD HH:MM** - Fix implemented
**YYYY-MM-DD HH:MM** - Monitoring for stability
**YYYY-MM-DD HH:MM** - Incident resolved

## Root Cause

Detailed explanation of what caused the incident. Include:
- What component failed or caused the issue
- Why it failed (configuration error, code bug, capacity issue, etc.)
- Contributing factors
- Why existing monitoring/safeguards didn't prevent it

## Detection

**How was the incident detected?**
- Automated monitoring alert
- Customer report
- Internal team member noticed
- Other

**Alert Details**:
- Alert name
- Time triggered
- Monitoring system

## Response

**Actions Taken**:
1. First action taken with timestamp
2. Second action taken with timestamp
3. Continue chronologically...

**What Worked Well**:
- Quick detection via monitoring
- Effective communication
- Clear escalation path
- Good documentation
- Other positive aspects

**What Could Be Improved**:
- Delayed response time
- Unclear runbooks
- Missing monitoring
- Communication gaps
- Other areas for improvement

## Resolution

Detailed explanation of how the incident was resolved:
- Specific fix implemented
- Configuration changes made
- Services restarted
- Data restored
- Other remediation steps

## Prevention

### Immediate Actions (within 24 hours)

- [ ] Action item 1 - Owner: @engineer1 - Due: Date
- [ ] Action item 2 - Owner: @engineer2 - Due: Date

### Short-term Actions (within 1 week)

- [ ] Action item 3 - Owner: @engineer3 - Due: Date
- [ ] Action item 4 - Owner: @engineer4 - Due: Date

### Long-term Actions (within 1 month)

- [ ] Action item 5 - Owner: @engineer5 - Due: Date
- [ ] Action item 6 - Owner: @engineer6 - Due: Date

## Post-Mortem Meeting

**Date**: YYYY-MM-DD
**Attendees**:
- Name 1 (Role)
- Name 2 (Role)
- Name 3 (Role)

**Key Discussion Points**:
- Discussion topic 1
- Discussion topic 2
- Discussion topic 3

## Metrics

**MTTR (Mean Time To Recovery)**: X hours
**MTTD (Mean Time To Detect)**: X minutes
**MTTA (Mean Time To Acknowledge)**: X minutes

## Supporting Information

**Relevant Links**:
- Monitoring Dashboard: [link]
- Slack Thread: [link]
- PagerDuty Incident: [link]
- Related Tickets: [links]

**Logs and Data**:
```
# Relevant log snippets or error messages
# Command outputs
# Configuration diffs
```

**Graphs and Screenshots**:
- Attach or link to relevant monitoring graphs
- Error rate spikes
- Latency increases
- Resource utilization

## Lessons Learned

### Technical Lessons
- Lesson 1
- Lesson 2

### Process Lessons
- Lesson 1
- Lesson 2

### Communication Lessons
- Lesson 1
- Lesson 2

## Sign-off

**Incident Commander**: Name - Date
**Engineering Manager**: Name - Date
**Director/VP**: Name - Date (for Sev1/Sev2 incidents)

---

## Appendix: Severity Definitions

**Critical (Sev1)**:
- Complete service outage
- Data loss or security breach
- Revenue impact > $10,000/hour
- Immediate response required

**High (Sev2)**:
- Major functionality unavailable
- Significant user impact
- Workaround available
- Response within 1 hour

**Medium (Sev3)**:
- Minor functionality impacted
- Limited user impact
- Response within 4 hours

**Low (Sev4)**:
- Minimal impact
- Cosmetic issues
- Response within 24 hours

## Appendix: Communication Templates

### Status Page Update (During Incident)
```
We are currently investigating an issue affecting [service/feature].
Users may experience [specific impact]. Our team is actively working
on a resolution. We will provide updates every 30 minutes.
```

### Status Page Update (Resolution)
```
The issue affecting [service/feature] has been resolved as of [time].
All systems are now operating normally. We apologize for any inconvenience.
```

### Customer Email Template
```
Subject: Service Incident - [Service Name] - [Date]

Dear Customer,

We are writing to inform you about a service incident that occurred on
[date] between [time range]. [Brief description of impact].

We sincerely apologize for the disruption. Our team worked quickly to
resolve the issue, and all systems are now operating normally.

For more details, please see our incident report: [link]

If you have any questions, please contact support@example.com.

Thank you for your patience.
```
