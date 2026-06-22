# infra/terraform/envs/dev/terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//vpc"
}

inputs = {
  env      = "dev"
  vpc_cidr = "10.1.0.0/16"
  azs      = ["us-east-1a"]

  # ECS
  task_cpu      = 256
  task_memory   = 512
  desired_count = 1

  # RDS
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  common_tags = {
    Environment = "dev"
    CostCenter  = "engineering"
    ManagedBy   = "terragrunt"
  }
}