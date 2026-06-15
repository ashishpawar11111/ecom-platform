remote_state {
  backend = "s3"
  config = {
    bucket         = "ecom-platform-tfstate"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ecom-platform-tf-locks"
    encrypt        = true
  }
}
