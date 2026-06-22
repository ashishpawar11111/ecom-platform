# infra/terraform/envs/staging/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//vpc"
}

inputs = {
  env      = "staging"
  vpc_cidr = "10.2.0.0/16"
  azs      = ["us-east-1a", "us-east-1b"]

  task_cpu      = 512
  task_memory   = 1024
  desired_count = 2

  instance_class    = "db.t3.small"
  allocated_storage = 50

  common_tags = {
    Environment = "staging"
    CostCenter  = "engineering"
    ManagedBy   = "terragrunt"
  }
}