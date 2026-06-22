# infra/terraform/modules/eks/main.tf — added week 18

resource "aws_eks_cluster" "main" {
  name     = "${var.env}-ecom"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.29"

  vpc_config {
    subnet_ids              = var.private_subnets
    endpoint_private_access = true
    endpoint_public_access  = var.env == "dev" ? true : false
  }

  tags = var.common_tags
}

resource "aws_eks_node_group" "workers" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.env}-workers"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnets

  scaling_config {
    desired_size = var.node_desired
    max_size     = var.node_max
    min_size     = var.node_min
  }

  instance_types = [var.node_instance_type]
  ami_type       = "AL2_x86_64"

  tags = var.common_tags
}

# OIDC provider for IRSA (IAM Roles for Service Accounts)
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
}