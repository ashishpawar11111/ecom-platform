# infra/terraform/envs/prod/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//vpc"
}

inputs = {
  env      = "prod"
  vpc_cidr = "10.0.0.0/16"
  azs      = ["us-east-1a", "us-east-1b", "us-east-1c"]

  task_cpu      = 1024
  task_memory   = 2048
  desired_count = 3

  instance_class    = "db.r6g.large"
  allocated_storage = 100

  common_tags = {
    Environment = "prod"
    CostCenter  = "platform"
    ManagedBy   = "terragrunt"
  }
}