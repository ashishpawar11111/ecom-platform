variable "env" { type = string }
variable "aws_region" { type = string }
variable "ecr_repo" { type = string }
variable "image_tag" {
  description = "Image tag — written to SSM by CI (BRIDGE-1)"
  type        = string
}
variable "task_cpu" { type = number; default = 256 }
variable "task_memory" { type = number; default = 512 }
variable "desired_count" { type = number; default = 2 }
variable "private_subnets" { type = list(string) }
variable "target_group_arn" { type = string }
variable "db_secret_arn" { type = string }