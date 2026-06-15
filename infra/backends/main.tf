resource "aws_s3_bucket" "tfstate" {
  bucket = "ecom-platform-tfstate"
}

resource "aws_dynamodb_table" "locks" {
  name         = "ecom-platform-tf-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
