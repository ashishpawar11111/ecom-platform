# infra/terraform/backends/dynamodb.tf

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "ecom-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name      = "Terraform Lock Table"
    ManagedBy = "terraform"
  }
}