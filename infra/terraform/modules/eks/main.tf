variable "name" { type = string }

resource "aws_eks_cluster" "this" {
  name     = var.name
  role_arn = "arn:aws:iam::000000000000:role/placeholder"

  vpc_config {
    subnet_ids = []
  }
}
