variable "env" { type = string }
variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}
variable "allocated_storage" {
  type    = number
  default = 20
}
variable "private_subnets" { type = list(string) }
variable "db_security_group_id" { type = string }
variable "common_tags" {
  type    = map(string)
  default = {}
}