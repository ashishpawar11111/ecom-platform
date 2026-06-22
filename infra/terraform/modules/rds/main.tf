# infra/terraform/modules/rds/main.tf

resource "aws_db_subnet_group" "main" {
  name       = "${var.env}-ecom-db"
  subnet_ids = var.private_subnets

  tags = merge(var.common_tags, { Name = "${var.env}-db-subnet-group" })
}

resource "aws_db_parameter_group" "postgres" {
  family = "postgres16"
  name   = "${var.env}-ecom-pg-params"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "250"     # log queries > 250ms
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.env}-ecom-db"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_encrypted     = true

  db_name  = "ecom"
  username = "ecom_admin"
  password = random_password.db.result

  multi_az               = var.env == "prod" ? true : false
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  backup_retention_period = var.env == "prod" ? 7 : 1
  skip_final_snapshot     = var.env != "prod"

  tags = merge(var.common_tags, { Name = "${var.env}-ecom-db" })
}

resource "random_password" "db" {
  length  = 32
  special = false
}

# Store credentials in Secrets Manager
resource "aws_secretsmanager_secret" "db" {
  name = "${var.env}/ecom/db-credentials"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = "ecom"
    username = "ecom_admin"
    password = random_password.db.result
  })
}