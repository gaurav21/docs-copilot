# Payments Service Runbook

## Service Overview

The Payments Service handles payment processing, subscription management, and billing operations using Stripe as the payment processor.

**Service URL**: https://payments.example.com
**Health Check**: https://payments.example.com/health
**Monitoring Dashboard**: https://grafana.example.com/d/payments-service

## Architecture

- **Technology**: Node.js, Express, PostgreSQL, Stripe API
- **Payment Processor**: Stripe
- **Database**: PostgreSQL for transaction records
- **Queue**: RabbitMQ for async payment processing

## Common Issues

### Issue: Payment Processing Failures

**Symptoms**:
- Customers reporting failed payments
- High error rate in payment processing
- Stripe webhooks failing

**Diagnosis**:
1. Check Stripe API status at https://status.stripe.com
2. Review payment service logs for errors
3. Check Stripe webhook delivery status
4. Verify API key configuration
5. Check for rate limiting issues

**Resolution**:
```bash
# Check service health
curl https://payments.example.com/health

# Verify Stripe connectivity
curl -u sk_test_xxx: https://api.stripe.com/v1/charges

# Check webhook endpoint
curl https://payments.example.com/webhooks/stripe

# Restart service if needed
kubectl rollout restart deployment/payments-service -n production
```

### Issue: Webhook Delivery Failures

**Symptoms**:
- Payment confirmations not updating in database
- Subscription status out of sync
- Stripe dashboard showing failed webhook deliveries

**Diagnosis**:
1. Check webhook endpoint accessibility
2. Review webhook signature verification
3. Check for timeouts in webhook handler
4. Verify webhook secret configuration

**Resolution**:
1. Ensure STRIPE_WEBHOOK_SECRET is correctly configured
2. Check that webhook endpoint returns 200 within 5 seconds
3. Verify webhook signature validation logic
4. Manually replay failed webhooks from Stripe dashboard

### Issue: Refund Processing Errors

**Symptoms**:
- Refunds not completing
- Customer complaints about pending refunds
- Error logs showing refund API failures

**Diagnosis**:
1. Check if payment is refundable (not already refunded, within refund window)
2. Verify Stripe API credentials
3. Check refund amount doesn't exceed original payment
4. Review payment capture status

**Resolution**:
```bash
# Check payment status in Stripe
stripe charges retrieve ch_xxxxxxxxxxxxx

# Process refund manually if needed
stripe refunds create --charge=ch_xxxxxxxxxxxxx --amount=1000

# Update database record
psql -h db.example.com -d payments_db -c "UPDATE transactions SET status='refunded' WHERE stripe_charge_id='ch_xxxxxxxxxxxxx';"
```

## Configuration

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Database
DATABASE_URL=postgresql://user:pass@host:5432/payments_db

# Queue
RABBITMQ_URL=amqp://rabbitmq.example.com

# Service
PORT=3000
NODE_ENV=production
```

## Payment Workflow

### Standard Payment Flow

1. Customer initiates payment on frontend
2. Frontend creates Stripe PaymentIntent
3. Customer confirms payment (card details)
4. Stripe processes payment
5. Stripe sends webhook to our service
6. Service validates webhook signature
7. Service updates database with payment status
8. Service triggers fulfillment process

### Subscription Flow

1. Customer selects subscription plan
2. Service creates Stripe Customer
3. Service attaches payment method
4. Service creates Stripe Subscription
5. Stripe charges customer immediately (or at trial end)
6. Webhook received for subscription created
7. Service grants access to subscription features
8. Recurring charges processed automatically by Stripe

## Monitoring

### Key Metrics

- **Payment Success Rate**: Should be > 95%
- **Payment Processing Time**: Should be < 3 seconds
- **Webhook Processing Time**: Should be < 500ms
- **Refund Processing Time**: Should be < 5 seconds

### Alerts

- Payment failure rate > 5% for 10 minutes
- Webhook delivery failure rate > 2%
- Payment processing latency > 5 seconds
- Stripe API error rate > 1%

## Handling Disputes and Chargebacks

### When a Dispute is Received

1. Stripe sends `charge.dispute.created` webhook
2. Service logs dispute in database
3. Notification sent to finance team
4. Review order details and customer communication
5. Gather evidence (receipts, shipping confirmations, etc.)
6. Submit evidence via Stripe dashboard within 7 days

### Evidence Required

- Customer email and IP address
- Shipping tracking number (if physical goods)
- Service usage logs (if digital service)
- Customer communication history
- Terms of service acceptance

## Financial Reconciliation

### Daily Reconciliation

Run daily reconciliation script to match Stripe payouts with database records:

```bash
# Run reconciliation for yesterday
npm run reconcile -- --date=2024-01-15

# Check for discrepancies
npm run reconcile:check -- --date=2024-01-15
```

### Month-End Close

1. Export all transactions for the month
2. Match with Stripe payout reports
3. Verify refund amounts
4. Check for pending disputes
5. Generate financial report for accounting

## Testing

### Test Cards

```
# Successful payment
4242 4242 4242 4242

# Declined payment
4000 0000 0000 0002

# Requires authentication (3D Secure)
4000 0025 0000 3155

# Insufficient funds
4000 0000 0000 9995
```

### Test Webhooks

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Trigger test webhook
stripe trigger payment_intent.succeeded
```

## Disaster Recovery

### Database Backup

- Automated backups every 6 hours
- Retention period: 30 days
- Restore time: < 1 hour

### Stripe Data Recovery

All Stripe data is stored permanently in Stripe. In case of database loss:

1. Use Stripe API to fetch payment history
2. Rebuild transaction records from Stripe data
3. Match customers by email
4. Restore subscription status

## Security

### PCI Compliance

- Never log full card numbers
- Use Stripe Elements for card collection
- Minimize PCI scope by not handling card data
- Annual PCI compliance review required

### API Key Management

- Rotate API keys annually
- Use separate keys for production and test
- Store keys in secrets management system
- Never commit keys to version control

## Contact

- **Team**: Payments & Billing
- **Slack**: #payments-team
- **On-Call**: PagerDuty "Payments On-Call"
- **Stripe Support**: support@stripe.com
