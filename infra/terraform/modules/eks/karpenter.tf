# infra/terraform/modules/eks/karpenter.tf — added week 30

# Karpenter IAM role (IRSA)
module "karpenter_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "5.34.0"

  role_name                          = "karpenter-controller-${var.env}"
  attach_karpenter_controller_policy = true

  karpenter_controller_cluster_name       = aws_eks_cluster.main.name
  karpenter_controller_node_iam_role_arns = [aws_iam_role.node.arn]

  oidc_providers = {
    main = {
      provider_arn               = aws_iam_openid_connect_provider.eks.arn
      namespace_service_accounts = ["karpenter:karpenter"]
    }
  }
}

# Karpenter Helm release
resource "helm_release" "karpenter" {
  name       = "karpenter"
  repository = "oci://public.ecr.aws/karpenter"
  chart      = "karpenter"
  version    = "0.33.0"
  namespace  = "karpenter"

  create_namespace = true

  set {
    name  = "settings.clusterName"
    value = aws_eks_cluster.main.name
  }
  set {
    name  = "serviceAccount.annotations.eks\.amazonaws\.com/role-arn"
    value = module.karpenter_irsa.iam_role_arn
  }
}