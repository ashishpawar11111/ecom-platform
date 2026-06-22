# Disaster Recovery — Terraform

*Created: Week 13 | RTO Measured: 45 minutes*

## Recovery Procedure

### Scenario: Complete infrastructure loss

1. **Verify state file**
   ```bash
   aws s3 ls s3://ecom-terraform-state-ACCOUNT_ID/
   ```

2. **Re-apply infrastructure**
   ```bash
   cd infra/terraform/envs/prod
   terragrunt apply
   ```

3. **Verify resources**
   ```bash
   terragrunt output
   aws ecs describe-services --cluster prod-ecom
   ```

4. **Restore database** (from latest automated backup)
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier prod-ecom-db \
     --target-db-instance-identifier prod-ecom-db-restored \
     --use-latest-restorable-time
   ```

## Measured RTO
- Infrastructure: ~30 min
- Database restore: ~15 min
- **Total RTO: 45 minutes**
