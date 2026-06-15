variable "identifier" { type = string }

resource "aws_db_subnet_group" "placeholder" {
  name       = "${var.identifier}-subnets"
  subnet_ids = []
}
